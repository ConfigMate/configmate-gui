import * as vscode from 'vscode';
import * as path from 'path';

export class Rulebook extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}
}

export class RulebookProvider implements vscode.TreeDataProvider<Rulebook> {
	private _onDidChangeTreeData: vscode.EventEmitter<Rulebook | undefined | void> = new vscode.EventEmitter<Rulebook | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Rulebook | undefined | void> = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Rulebook): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Rulebook): Thenable<Rulebook[]> {
		if (!vscode.workspace.workspaceFolders) {
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve([]);
		} else {
			const rulebooks: Rulebook[] = [];
			const pattern = '**/*.{rulebook}';

			return new Promise((resolve, reject) => {
				vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000).then(uris => {
					uris.forEach(uri => {
						const rulebook = new Rulebook(
							path.basename(uri.fsPath),
							vscode.TreeItemCollapsibleState.None,
							{
								command: 'vscode.open',
								title: '',
								arguments: [uri],
							}
						);
						rulebooks.push(rulebook);
					});
					resolve(rulebooks);
				}, reject);
			});
		}
	}

}

