import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookFileProvider } from './rulebooks';

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

	private configFiles: ConfigFile[] = [];
	private rulebookFileProvider: RulebookFileProvider;

	constructor(rulebookFileProvider: RulebookFileProvider) {
		this.rulebookFileProvider = rulebookFileProvider;
		this.rulebookFileProvider.onDidChangeTreeData(() => this.refresh());
	}

	refresh(): void {
		// console.log('Refresh called'); // Debug log
		const selectedRulebook = this.rulebookFileProvider.getSelectedRulebook();
		if (selectedRulebook === undefined || selectedRulebook.rulebook.Files.length < 1) {
			this.configFiles = [];
			this._onDidChangeTreeData.fire();
			return;
		}
	
		this.configFiles = selectedRulebook.getConfigFiles().map(filepath =>
			new ConfigFile(
				path.basename(filepath),
				filepath,
				{
					command: 'configFiles.openConfigFile',
					title: 'Open Config File',
					arguments: [filepath]
				}
			)	
		);
		this._onDidChangeTreeData.fire();
		
		// console.log('Config files after refresh:', this.configFiles.length); // Debug log
	}

	getTreeItem(element: ConfigFile): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ConfigFile): Promise<ConfigFile[]> {
		if (element) return Promise.resolve([]);
		else return Promise.resolve(this.configFiles);
		
	}

	addConfigFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			await this.addConfigFileFile(uri);
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
			this.refresh();
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
			// Remove the file from the filesystem.
			await vscode.workspace.fs.delete(uri, { recursive: false });

			// Remove the configFile reference from the associated rulebook's files.
			await this.rulebookFileProvider.removeConfigFileFromRulebooks(uri);

			// Refresh the view. If the deletion affects the current selection, you should pass the new selection here.
			this.refresh(); // Consider passing the appropriate rulebook if necessary.
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