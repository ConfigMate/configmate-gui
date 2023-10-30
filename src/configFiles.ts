import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookFileProvider, RulebookFile, RulebookExplorer } from './rulebooks';

export class ConfigFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public filepath: string,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = label;
		this.contextValue = 'configFile';
	}

}

export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | null | void> = new vscode.EventEmitter<ConfigFile | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | null | void> = this._onDidChangeTreeData.event;

	private configFiles: ConfigFile[] = [];

	constructor(private rulebookFileProvider: RulebookFileProvider) {
		this.rulebookFileProvider.onDidChangeTreeData((e) => {
			if (!e || Object.values(e.rulebook.files).length < 1) {
				this.configFiles = [];
				this.refresh(undefined);
				return;
			}
			this.refresh(e);
		});
	}

	refresh(rulebookFile?: RulebookFile): void {
		if (rulebookFile) {
			const filepaths = rulebookFile.getConfigFilePaths();
			this.configFiles = this.parseConfigFiles(filepaths);
		} else this.configFiles = [];

		this._onDidChangeTreeData.fire();
	}

	parseConfigFiles = (filepaths: string[]): ConfigFile[] =>
		filepaths.map(filepath => {
			if (!filepath) throw new Error('No filepath');
			if (!vscode.Uri.file(filepath)) throw new Error('Invalid filepath');
			const file = new ConfigFile(
				path.basename(filepath),
				filepath);
			file.command = {
				command: 'configFiles.openConfigFile',
				title: 'Open Config File',
				arguments: [file.filepath]
			};
			return file;
		}
	);

	getTreeItem = (element: ConfigFile): vscode.TreeItem => element;
	getChildren = (element?: ConfigFile): Promise<ConfigFile[]> => element ? Promise.resolve([]) : Promise.resolve(this.configFiles);

	addConfigFile = async (uri: vscode.Uri, selectedRulebook: RulebookFile): Promise<void> => {
		try {
			await this.addConfigFileFile(uri);
			await this.rulebookFileProvider.addConfigFileToRulebook(uri, selectedRulebook);
		} catch (error) { void vscode.window.showErrorMessage(`Error creating config file: ${error as string}`); }
	};

	addConfigFileFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			const filepath = (path.basename(uri.fsPath)).split('.');
			const [filename, ...extension] = filepath;
			if (filename && extension.join('.') !== 'cmrb') throw new Error('Invalid file extension');
			else await vscode.workspace.fs.writeFile(uri, new Uint8Array());
		} catch (error) { console.error(`Error creating config file: ${error as string}`); }
	};

	deleteConfigFile = async (uri: vscode.Uri, selection?: RulebookFile[]): Promise<void> => {
		try {
			await this.deleteConfigFileFile(uri);
			if (selection && selection[0] instanceof RulebookFile)
				await this.rulebookFileProvider.removeConfigFileFromRulebooks(uri, selection);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error deleting config file: ${error as string}`);
		}
	};

	deleteConfigFileFile = async (uri: vscode.Uri): Promise<void> => 
		await vscode.workspace.fs.delete(uri, { recursive: false });

	openConfigFile = async (filepath: string): Promise<void> => {
		try {
			const uri = vscode.Uri.file(filepath);
			await vscode.workspace.fs.stat(uri);
			await vscode.commands.executeCommand('vscode.open', uri)
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);
		} catch (error) { void vscode.window.showErrorMessage(`Error opening config file: ${error as string}`); }
	};

	changeFilename = async (uri: vscode.Uri, newUri: vscode.Uri): Promise<void> => {
		try {
			await vscode.workspace.fs.rename(uri, newUri);
			// await this.rulebookFileProvider.changeConfigFileUri(uri, newUri);
			// refresh
		} catch (error) { void vscode.window.showErrorMessage(`Error renaming config file: ${error as string}`); }
	};
}


export class ConfigFileExplorer {
	private configFileTreeView: vscode.TreeView<ConfigFile>;
	private configFileProvider: ConfigFileProvider;

	constructor(context: vscode.ExtensionContext, rulebookExplorer: RulebookExplorer) {
		const rulebookFileProvider = rulebookExplorer.getProvider();
		this.configFileProvider = new ConfigFileProvider(rulebookFileProvider);
		context.subscriptions.push(vscode.window.registerTreeDataProvider('configFiles', this.configFileProvider));

		this.configFileTreeView = vscode.window.createTreeView('configFiles', 
			{ treeDataProvider: this.configFileProvider });

		const { registerCommand } = vscode.commands;

		context.subscriptions.push(
			registerCommand('configFiles.openConfigFile', async (filepath: string) =>
				await this.configFileProvider.openConfigFile(filepath)),
			registerCommand('configFiles.refreshConfigFiles', () =>
				this.configFileProvider.refresh(rulebookExplorer.getSelectedRulebook())),
			registerCommand('configFiles.addConfigFile', async () => {
				const uri = await vscode.window.showSaveDialog(
					{ saveLabel: 'Create Config File', filters: { 'CMRB': ['cmrb'] } });
				if (uri) {
					const selectedRulebook = rulebookExplorer.getSelectedRulebook();
					if (selectedRulebook instanceof RulebookFile) {
						await this.configFileProvider.addConfigFile(uri, selectedRulebook);
						// await rulebookFileProvider.openRulebook(selectedRulebook.uri);
					} else await vscode.window.showErrorMessage(`Choose a rulebook first!`);
				}
			}),
			registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
				const confirm = await vscode.window.showWarningMessage(
					`Are you sure you want to delete config file ${node.label}?`, { modal: true }, 'Delete');
				if (confirm !== 'Delete') return;
				const selection = rulebookExplorer.getSelectedRulebook();
				const uri = vscode.Uri.file(node.filepath);
				if (selection) await this.configFileProvider.deleteConfigFile(uri, [selection]);
			})
		);
	}

	getTreeView = (): vscode.TreeView<ConfigFile> => this.configFileTreeView;
	getProvider = (): ConfigFileProvider => this.configFileProvider;
	getSelectedConfigFile = (): ConfigFile | undefined => this.configFileTreeView.selection[0] || undefined;
}