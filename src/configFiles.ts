import * as vscode from 'vscode';
import * as path from 'path';

class ConfigFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}
}

export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | void> = new vscode.EventEmitter<ConfigFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | void> = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ConfigFile): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ConfigFile): Thenable<ConfigFile[]> {
		if (!vscode.workspace.workspaceFolders) {
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve([]);
		} else {
			const configFiles: ConfigFile[] = [];
			const pattern = '**/*.{json,yaml,yml,xml,ini,conf,.gitignore,.mod}';

			return new Promise((resolve, reject) => {
				vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000).then(uris => {
					uris.forEach(uri => {
						const configFile = new ConfigFile(
							path.basename(uri.fsPath),
							vscode.TreeItemCollapsibleState.None,
							{
								command: 'vscode.open',
								title: '',
								arguments: [uri],
							}
						);
						configFiles.push(configFile);
					});
					resolve(configFiles);
				}, reject);
			});
		}
	}

}

