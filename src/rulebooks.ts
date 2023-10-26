import * as vscode from 'vscode';
import { Config, Rulebook, Configs } from './models';
import * as utils from "./utils";
import * as toml from 'toml';
import * as path from 'path';

export class RulebookFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public filepath: string,
		public rulebook: Rulebook
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = rulebook.name;
		this.tooltip = rulebook.description;
		this.contextValue = 'rulebook';
	}

	getConfigFilePaths(): string[] {
		const configFiles: string[] = [];
		for (const config of Object.values(this.rulebook.files)) {
			if (!config.path) continue;
			configFiles.push(path.resolve(vscode.workspace.workspaceFolders![0].uri.fsPath, config.path));
		}
		return configFiles;
	}

	getConfigs(): Configs {
		return this.rulebook.files;
	}
}

export class RulebookFileProvider implements vscode.TreeDataProvider<RulebookFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<RulebookFile | undefined | void> = new vscode.EventEmitter<RulebookFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<RulebookFile | undefined | void> = this._onDidChangeTreeData.event;

	onRulebookSelectionChanged = async (rulebooks: readonly RulebookFile[]): Promise<void> => {
		await this.openRulebook(rulebooks[0]);
		this.refresh(rulebooks[0]);
	}

	refresh = (selection?: RulebookFile): void =>
		this._onDidChangeTreeData.fire(selection);

	getTreeItem = (element: RulebookFile): vscode.TreeItem => element;

	getChildren = async (element?: RulebookFile): Promise<RulebookFile[]> => {
		if (element || !vscode.workspace.workspaceFolders) return [];

		const pattern = '**/*.{cmrb}';
		const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000);

		const rulebookFiles: RulebookFile[] = [];
		for (const uri of uris) {
			const filepath: string = uri.fsPath;
			try {
				const label = utils.uriToFilename(uri);
				const rulebook = await this.parseRulebook(filepath);
				rulebookFiles.push(new RulebookFile(label, filepath, rulebook));
			} catch (error) { console.error(`Error parsing rulebook file ${filepath}: `, error); }
		}
		return rulebookFiles;
	}

	openRulebook = async (rulebookFile: RulebookFile) => {
		const uri = vscode.Uri.file(rulebookFile.filepath);
		await vscode.commands.executeCommand('vscode.open', uri);
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.uri.fsPath === uri.fsPath)
			await vscode.window.showTextDocument(editor.document, editor.viewColumn);
		else await vscode.window.showTextDocument(uri);
	}

	readFile = async (filepath: string): Promise<string> => {
		const uri = vscode.Uri.file(filepath);
		const buffer = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(buffer).toString();
	}

	parseRulebook = async (filepath: string, contents?: string): Promise<Rulebook> => {
		let rulebook = {} as Rulebook;
		try {
			const fileContents: string = contents || await this.readFile(filepath);
			rulebook = toml.parse(fileContents) as Rulebook;
			const { name, description, files, rules } = rulebook;
			if (!name || !description || !files || !rules)
				throw new Error(`Rulebook file is missing required fields.`);

			// for (const file of files) {
			// this.filepath = (path.isAbsolute(filepath)) ? filepath : path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, filepath);
			
		} catch (error) {
			console.error(`Error parsing rulebook content: ${error as string}`);
		}
		return rulebook;
	}

	parseConfig = (uri: vscode.Uri): [string, Config] => {
		const name = utils.getBasename(uri);
		const absPath = uri.fsPath;
		const path = vscode.workspace.asRelativePath(absPath);
		const format = utils.uriToExtension(uri);
		return [name, { path, format }];
	};

	writeRulebook = async (uri: vscode.Uri, rulebook: Rulebook): Promise<void> => {
		try {
			const contentAsUint8Array = Buffer.from(JSON.stringify(rulebook, null, 4));
			await vscode.workspace.fs.writeFile(uri, contentAsUint8Array);
			this.refresh(await this.getRulebookFile(uri));
		} catch (error) { console.error(`Error writing rulebook: ${error as string}`); }
	};

	addRulebook = async (uri: vscode.Uri): Promise<void> => {
		try {
			const filename = utils.getBasename(uri);
			const extension = utils.uriToExtension(uri);
			if (extension !== 'cmrb') throw new Error('Invalid file extension');
			const rulebook = initRulebook(filename);
			await this.writeRulebook(uri, rulebook);
			void vscode.window.showInformationMessage(`Added new rulebook ${uri.fsPath}.`);
		} catch (error) { void vscode.window.showErrorMessage(`Error creating rulebook: ${error as string}`); }
	};

	deleteRulebook = async (node: RulebookFile): Promise<void> => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete rulebook ${node.label}?`, { modal: true }, 'Delete');
		if (confirm !== 'Delete') return;

		try {
			await this.deleteRulebookFile(vscode.Uri.file(node.filepath));
		} catch (error) { void vscode.window.showErrorMessage(`Error deleting rulebook: ${error as string}`); }
	};

	deleteRulebookFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			await vscode.workspace.fs.delete(uri, { recursive: false });
			void vscode.window.showInformationMessage(`Deleted rulebook ${uri.fsPath}.`);
			this.refresh();
		} catch (error) { console.error(`Error deleting rulebook ${uri.fsPath}: `, error); }
	}


	addConfigFileToRulebook = async (uri: vscode.Uri, selectedRulebook: RulebookFile): Promise<void> => {
		try {
			const [name, config] = this.parseConfig(uri);
			Object.assign(selectedRulebook.rulebook.files, { [name]: config });
			const rulebookUri = vscode.Uri.file(selectedRulebook.filepath);
			await this.writeRulebook(rulebookUri, selectedRulebook.rulebook);
			this.refresh(selectedRulebook);
		} catch (error) { void vscode.window.showErrorMessage(`Error: ${error as string}`); }
	};

	removeConfigFileFromRulebooks = async (configFileUri: vscode.Uri, selection: RulebookFile[]): Promise<void> => {
		try {
			const rulebookFiles = await this.getChildren();
			const [key] = this.parseConfig(configFileUri);
			const selectionUri = vscode.Uri.file(selection[0].filepath);
			const rulebookFile = rulebookFiles.find(rulebook => Object.hasOwn(rulebook, key));
			if (!rulebookFile) throw new Error(`Config file ${configFileUri.fsPath} is not in rulebook ${selectionUri.fsPath}.`);
			const { rulebook } = rulebookFile;
			delete rulebook.files[key];

			await this.writeRulebook(selectionUri, rulebookFile.rulebook);
			await this.onRulebookSelectionChanged(selection);
		} catch (error) { void vscode.window.showErrorMessage(`Error: ${error as string}`); }
	};

	saveRulebook = async (uri: vscode.Uri, text: string): Promise<void> => {
		try {
			const filepath: string = uri.fsPath;
			const rulebook: Rulebook = await this.parseRulebook(filepath, text);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath !== filepath) continue;
				rulebookFile.rulebook = rulebook;
				// rulebookFile.filepath = filepath;
				this.refresh(rulebookFile);
				console.log(filepath);
				break;
			}
		} catch (error) { void vscode.window.showErrorMessage(`Error: ${error as string}`); }
	};
	getRulebookFile = async (uri: vscode.Uri): Promise<RulebookFile | undefined> => {
		const rulebooks: RulebookFile[] = await this.getChildren();
		for (const rulebook of rulebooks)
			if (rulebook.filepath === uri.fsPath) return rulebook;
	}
}

export class RulebookExplorer {
	private rulebookTreeView: vscode.TreeView<RulebookFile>;

	constructor(context: vscode.ExtensionContext, private rulebookFileProvider: RulebookFileProvider) {
		context.subscriptions.push(vscode.window.registerTreeDataProvider('rulebooks', rulebookFileProvider));

		this.rulebookTreeView = vscode.window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });
		this.rulebookTreeView.onDidChangeSelection(async e => await rulebookFileProvider.onRulebookSelectionChanged(e.selection));

		const { registerCommand } = vscode.commands;

		registerCommand('rulebooks.refreshRulebooks', () => rulebookFileProvider.refresh());
		registerCommand('rulebooks.addRulebook', async () => {
			const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'CMRB': ['cmrb'] } });
			if (uri) await rulebookFileProvider.addRulebook(uri);
		});
		registerCommand('rulebooks.deleteRulebook', async (node: RulebookFile) => await rulebookFileProvider.deleteRulebook(node));
	}

	getTreeView = (): vscode.TreeView<RulebookFile> => this.rulebookTreeView;
	getProvider = (): RulebookFileProvider => this.rulebookFileProvider;
	getSelectedRulebook = (): RulebookFile | undefined => this.rulebookTreeView.selection[0] || undefined;
}


export const initRulebook = (filename: string): Rulebook => {
	const rulebook: Rulebook = {
		name: filename,
		description: "Rulebook description",
		files: {},
		rules: [
			{
				"description": "Rule description",
				"checkName": "Name of check to run",
				"args": "Arguments to pass to check"
			}
		]
	};
	return rulebook;
};