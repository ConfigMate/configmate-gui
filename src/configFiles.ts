import * as vscode from 'vscode';
import * as path from 'path';

export class ConfigFile extends vscode.TreeItem {
	public readonly filepath: string;
	
	constructor(
		public readonly label: string,
		public readonly filePath: string,
		public readonly command: vscode.Command
		) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = label;
		this.filepath = filePath;
		this.command = command;
		this.contextValue = 'configFile';
	}

}

export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | null | void> = new vscode.EventEmitter<ConfigFile | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | null | void> = this._onDidChangeTreeData.event;

	private configFiles: string[] = [];

	constructor() { }

	refresh(configFiles: string[]): void {
		this.configFiles = configFiles;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ConfigFile): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ConfigFile): Thenable<ConfigFile[]> {
		if (element) {
			return Promise.resolve([]);
		} else {
			return this.getConfigFiles();
		}
	}

	getConfigFiles(): Thenable<ConfigFile[]> {
		return Promise.resolve(
			this.configFiles.map(filepath => 
				new ConfigFile(
					path.basename(filepath), 
					filepath,
					{
						command: 'configFiles.openConfigFile',
						title: 'Open Config File',
						arguments: [filepath]
					}
				)
			)
		);
	}
}