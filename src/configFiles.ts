import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookFile } from './rulebooks';
// import { rulebookTreeView } from './extension';

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

	async getChildren(element?: ConfigFile): Promise<ConfigFile[]> {
		if (element) {
			return [];
		} else {
			return this.getConfigFiles();
		}
	}

	getConfigFiles(): Promise<ConfigFile[]> {
		const promise = new Promise<ConfigFile[]>((resolve, reject) => {
			resolve(this.configFiles.map(filepath =>
				new ConfigFile(
					path.basename(filepath),
					filepath,
					{
						command: 'configFiles.openConfigFile',
						title: 'Open Config File',
						arguments: [filepath]
					}
				)
			));
			reject;
		});
		return promise;
	}

	addConfigFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			await this.addConfigFileFile(uri);
			// this.refresh(rulebookTreeView);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error creating config file: ${error as string}`);
		}
	};

	addConfigFileFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			const filepath = (path.basename(uri.fsPath)).split('.');
			const [filename, ...extension] = filepath;
			if (extension.join('.') !== 'json') throw new Error('Invalid file extension');
			else await vscode.workspace.fs.writeFile(uri, new Uint8Array());
			// this.refresh(rulebookTreeView);
		} catch (error) {
			console.error(`Error creating config file: ${error as string}`);
		}
	};

	deleteConfigFile = async (node: ConfigFile) => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete config file ${node.label}?`, { modal: true }, 'Delete');
		if (confirm === 'Delete') {
			try {
				await this.deleteConfigFileFile(vscode.Uri.file(node.filepath));
			} catch (error) {
				await vscode.window.showErrorMessage(`Error deleting config file: ${error as string}`);
			}
		}
	};

	deleteConfigFileFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			await vscode.workspace.fs.delete(uri, { recursive: true });
			// this.refresh(rulebookTreeView);
		} catch (error) {
			console.error(`Error deleting config file: ${error as string}`);
		}
	};

	openConfigFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error opening config file: ${error as string}`);
		}
	};
}