import * as vscode from 'vscode';
import { Rulebook } from './models';
import * as utils from "./utils";
import * as path from 'path';
import { Config } from './models';
import { ConfigMateProvider } from './configMate';

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

	public getConfigFilePath(config: string): string {
		const configPath = this.rulebook.files[config].path;
		return path.resolve(vscode.workspace.workspaceFolders![0].uri.fsPath, configPath);
	}

	public getConfigFilePaths(): string[] {
		const configFiles: string[] = [];
		for (const config of Object.values(this.rulebook.files)) {
			if (!config.path) continue;
			configFiles.push(path.resolve(vscode.workspace.workspaceFolders![0].uri.fsPath, config.path));
		}
		return configFiles;
	}

	public getConfigs(): { [key: string]: Config } {
		return this.rulebook.files;
	}
}

export class RulebookFileProvider implements vscode.TreeDataProvider<RulebookFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<RulebookFile | undefined | void> = new vscode.EventEmitter<RulebookFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<RulebookFile | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private configMateProvider: ConfigMateProvider) {}

	onRulebookSelectionChanged = async (rulebooks: readonly RulebookFile[]): Promise<void> => {
		await this.openRulebook(rulebooks[0].filepath);
		this.refresh(rulebooks[0]);
		// this.refresh();
	}

	refresh = (selection?: RulebookFile): void =>
		this._onDidChangeTreeData.fire(selection);

	getTreeItem = (element: RulebookFile): vscode.TreeItem => element;
	getParent = (): vscode.ProviderResult<RulebookFile> => null;
	getChildren = async (element?: RulebookFile): Promise<RulebookFile[]> => {
		if (element || !vscode.workspace.workspaceFolders) return [];

		const pattern = '**/*.{cmrb}';
		const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000);

		const rulebookFiles: RulebookFile[] = [];
		for (const uri of uris) {
			const filepath: string = uri.fsPath;
			try {
				const label = utils.uriToFilename(uri);
				const rulebook = await this.configMateProvider.getRulebook(uri);
				// const rulebook = this.parseRulebook(contents);
				const file = new RulebookFile(label, filepath, rulebook);
				// file.command = {
				// 	command: 'rulebooks.openRulebook',
				// 	title: 'Open Rulebook',
				// 	arguments: [filepath]
				// };
				rulebookFiles.push(file);
			} catch (error) { console.error(`Error parsing rulebook file ${filepath}: `, error); }
		}
		return rulebookFiles;
	};

	openRulebook = async (filepath: string): Promise<void> => {
		try {
			const uri = vscode.Uri.file(filepath);
			await vscode.workspace.fs.stat(uri);
			await vscode.commands.executeCommand('vscode.open', uri)
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error opening rulebook file: ${error as string}`);
		}
	};


	parseRulebook = (contents: string): Rulebook => {
		let rulebook = {} as Rulebook;
		try {
			rulebook = JSON.parse(contents) as Rulebook;
			const { name, description, files, rules } = rulebook;
			if (!name || !description || !files || !rules)
				throw new Error(`Rulebook file is missing required fields.`);
		} catch (error) {
			console.error(`Error parsing rulebook content: ${error as string}`);
		}
		return rulebook;
	};


	addRulebook = async (uri: vscode.Uri): Promise<RulebookFile> => {
		try {
			await this.configMateProvider.createRulebook(uri);
			this.refresh();
			const file = await this.getRulebookFile(uri);
			await this.onRulebookSelectionChanged([file]);
			return Promise.resolve(file);
		} catch (error) { 
			await vscode.window.showErrorMessage(`Error creating rulebook: ${error as string}`); 
			return Promise.reject(error);
		}
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
			this.refresh();
		} catch (error) { console.error(`Error deleting rulebook ${uri.fsPath}: `, error); }
	}

	saveRulebook = async (uri: vscode.Uri, text: string): Promise<void> => {
		try {
			const filepath: string = uri.fsPath;
			const rulebook: Rulebook = this.parseRulebook(text);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath !== filepath) continue;
				rulebookFile.rulebook = rulebook;
				// rulebookFile.filepath = filepath;
				this.refresh(rulebookFile);
				console.log(filepath);
				break;
			}
		} catch (error) { 
			await vscode.window.showErrorMessage(`Error: ${error as string}`); 
		}
	};

	getRulebookFile = async (uri: vscode.Uri): Promise<RulebookFile> => {
		const rulebooks: RulebookFile[] = await this.getChildren();
		for (const rulebook of rulebooks)
			if (rulebook.filepath === uri.fsPath) return rulebook;
		return {} as RulebookFile;
	};
}

export class RulebookExplorer {
	private rulebookTreeView: vscode.TreeView<RulebookFile>;
	private rulebookFileProvider: RulebookFileProvider;

	constructor(context: vscode.ExtensionContext, 
		configMateProvider: ConfigMateProvider) {
		this.rulebookFileProvider = new RulebookFileProvider(configMateProvider);
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider('rulebooks', this.rulebookFileProvider
		));
		this.rulebookTreeView = vscode.window.createTreeView('rulebooks', 
			{ treeDataProvider: this.rulebookFileProvider });
		this.rulebookTreeView.onDidChangeSelection(async e => 
			await this.rulebookFileProvider.onRulebookSelectionChanged(e.selection)
		);

		const { registerCommand } = vscode.commands;
		context.subscriptions.push(
			vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) =>
				(doc.uri.fsPath.endsWith('cmrb')) ?
				await this.rulebookFileProvider.saveRulebook(doc.uri, doc.getText()) : 
				null),
			registerCommand('rulebooks.refreshRulebooks', () => 
				this.rulebookFileProvider.refresh()
			),
			registerCommand('rulebooks.addRulebook', async () => {
				const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'CMRB': ['cmrb'] } });
				if (uri) {
					const file = await this.rulebookFileProvider.addRulebook(uri);
					await this.rulebookTreeView.reveal(file, { select: true, focus: true });
				}
			}),
			// registerCommand('rulebooks.openRulebook', async (filepath: string) =>
			// 	await this.rulebookFileProvider.openRulebook(filepath)
			// ),
			registerCommand('rulebooks.deleteRulebook', async (rulebook: RulebookFile) =>
				await this.rulebookFileProvider.deleteRulebook(rulebook)
			),
		);
	}

	getTreeView = (): vscode.TreeView<RulebookFile> => this.rulebookTreeView;
	getProvider = (): RulebookFileProvider => this.rulebookFileProvider;
	getSelectedRulebook = (): RulebookFile | undefined => 
		this.rulebookTreeView.selection[0] || undefined;
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