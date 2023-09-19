import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {

	private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | void> = new vscode.EventEmitter<ConfigFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ConfigFile): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: ConfigFile): Promise<ConfigFile[]> {
		if (!this.workspaceRoot) {
			// vscode.window.showInformationMessage('No configFile in empty workspace');
			return Promise.resolve([]);
		}

		const pattern = '**/*.{json,yaml,yml,xml,ini,conf,.gitignore,.mod}'; // Add more extensions if needed

		if (element) {
			return Promise.resolve(this.getAllConfigFiles(pattern));
		} else {
			vscode.window.showInformationMessage('Workspace has no config files');
			return Promise.resolve([]);
		}
	}


	/**
	 * Find all config files in the current workspace (including subfolders)
	 * @param pattern Glob pattern to match config file extensions
	 */
	private getAllConfigFiles(pattern: string): ConfigFile[] {
		const toConfigFile = (label: string, uri: vscode.Uri): ConfigFile => {
			return new ConfigFile(label, uri, vscode.TreeItemCollapsibleState.None, {
				command: 'vscode.openFolder',
				title: 'Open Folder',
				arguments: [uri]
			});
		};

		const uris = vscode.workspace.findFiles(pattern, '**/node_modules/**');
		const ConfigFiles: ConfigFile[] = [];
		// Convert the uris to ConfigFile objects
		Promise.resolve(uris).then((uris) => {
				return uris.map((uri) => {
					ConfigFiles.push(toConfigFile(path.basename(uri.fsPath), uri));
				});
			}
		);

		return ConfigFiles;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}

	public openFolder(): any {
		return (uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.openFolder', uri);
		};
	}
}

export class ConfigFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly uri: vscode.Uri,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = uri.fsPath;
		this.description = path.dirname(uri.fsPath);
	}
	iconPath = "$(file-code)";

	contextValue = 'configFile';
}
