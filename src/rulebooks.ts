import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookManager } from './RulebookManager';

export class RulebookFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		// public readonly checkboxState: vscode.TreeItemCheckboxState,
		public readonly filepath: string
	) {
		super(label, collapsibleState);
		this.contextValue = 'rulebook';
		this.filepath = filepath;
	}
}

export class RulebookFileProvider implements vscode.TreeDataProvider<RulebookFile> {
	private rulebookManager: RulebookManager;

	constructor(rulebookManager: RulebookManager) {
		this.rulebookManager = rulebookManager;
	}

	private _onDidChangeTreeData: vscode.EventEmitter<RulebookFile | undefined | void> = new vscode.EventEmitter<RulebookFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<RulebookFile | undefined | void> = this._onDidChangeTreeData.event;

	refresh = (): void => this._onDidChangeTreeData.fire();

	getTreeItem = (element: RulebookFile): vscode.TreeItem => element;

	getChildren(element?: RulebookFile): Thenable<RulebookFile[]> {
		if (!vscode.workspace.workspaceFolders) return Promise.resolve([]);
		if (element) return Promise.resolve([]);
		else {
			const rulebookFiles: RulebookFile[] = [];
			const pattern = '**/*.{rulebook}.{json,toml,hocon}';

			return new Promise((resolve, reject) => {
				vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000)
				.then(uris => {
					uris.forEach(uri => {
						const filepath: string = uri.fsPath;
						const newRulebookFile: RulebookFile = new RulebookFile(
							path.basename(filepath),
							vscode.TreeItemCollapsibleState.None,
							// vscode.TreeItemCheckboxState.Unchecked,
							filepath
						);
						this.rulebookManager.addRulebook(newRulebookFile);
						rulebookFiles.push(newRulebookFile);
					});
					resolve(rulebookFiles);
				}, reject);
			});
		}
	}
}

