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

	openConfigFile = async (filepath: string): Promise<void> => {
		try {
			const uri = vscode.Uri.file(filepath);
			await vscode.workspace.fs.stat(uri);
			await vscode.commands.executeCommand('vscode.open', uri)
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);
		} catch (error) { 
			await vscode.window.showErrorMessage(`Error opening config file: ${error as string}`); 
		}
	};

	changeFilename = async (uri: vscode.Uri, newUri: vscode.Uri): Promise<void> => {
		try {
			await vscode.workspace.fs.rename(uri, newUri);
			// await this.rulebookFileProvider.changeConfigFileUri(uri, newUri);
			// refresh
		} catch (error) { 
			await vscode.window.showErrorMessage(`Error renaming config file: ${error as string}`); 
		}
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
				this.configFileProvider.refresh(rulebookExplorer.getSelectedRulebook()))
		);
	}

	getTreeView = (): vscode.TreeView<ConfigFile> => this.configFileTreeView;
	getProvider = (): ConfigFileProvider => this.configFileProvider;
	getSelectedConfigFile = (): ConfigFile | undefined => this.configFileTreeView.selection[0] || undefined;
}