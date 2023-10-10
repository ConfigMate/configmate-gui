import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookFile } from './rulebooks';

export class ConfigFile extends vscode.TreeItem {
	public readonly filepath: string;
	constructor(
		public readonly label: string,
		public readonly filePath: string,
		public readonly command: vscode.Command,
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

	refresh(rulebookTreeView: vscode.TreeView<RulebookFile>): void {
		const rulebook = rulebookTreeView.selection[0];
		if (rulebook instanceof RulebookFile)
			this.configFiles = rulebook.rulebook.Files;
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

	addConfigFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			const name = (path.basename(uri.fsPath)).split('.')[0];
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders) {
				// const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, name);
				await vscode.workspace.fs.writeFile(uri, new Uint8Array());
				void vscode.window.showInformationMessage(`Added new config file ${name}.`);
			}
		} catch (error) {
			void vscode.window.showErrorMessage(`Error creating config file: ${error as string}`);
		}
	};


	deleteConfigFile = async (node: ConfigFile) => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete config file ${node.label}?`, { modal: true }, 'Delete');
		if (confirm === 'Delete') 
			await this.deleteConfigFileFile(vscode.Uri.file(node.filepath));
	};

	deleteConfigFileFile = async (uri: vscode.Uri) => {
		try {
			await vscode.workspace.fs.delete(uri, { recursive: true });
			void vscode.window.showInformationMessage(`Deleted config file ${uri.fsPath}.`);
		} catch (error) {
			void vscode.window.showErrorMessage(`Error deleting config file: ${error as string}`);
		}
	};
}