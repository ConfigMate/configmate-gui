import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookManager } from './RulebookManager';

export class ConfigFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly filepath: string
	) {
		super(label, collapsibleState);
		this.contextValue = 'configFile';
		this.filepath = filepath;
	}
}

export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {
	private rulebookManager: RulebookManager;

	constructor(rulebookManager: RulebookManager) { 
		this.rulebookManager = rulebookManager;
	}

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
			return new Promise(() => {
				const {rulebooks, rulebookFiles} = this.rulebookManager;
				for (let i = 0; i < rulebooks.length; i++) {
					// if (rulebookFiles[i].checkboxState === vscode.TreeItemCheckboxState.Checked) {
						for (const configFilepath of rulebooks[i].Files) {
							configFiles.push(new ConfigFile(
								path.basename(configFilepath),
								vscode.TreeItemCollapsibleState.None,
								configFilepath
							));
						}
					// }
				}
			});
		}
	}

}

