'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { RulebookFileProvider, RulebookFile, RulebookExplorer } from './rulebooks';

export class ConfigFile extends vscode.TreeItem {
	public readonly filepath: string;
	constructor(
		public readonly label: string,
		public readonly filePath: string,
		) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = label;
		this.filepath = filePath;
		this.contextValue = 'configFile';
	}

}

export class ConfigFileProvider implements vscode.TreeDataProvider<ConfigFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | null | void> = new vscode.EventEmitter<ConfigFile | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | null | void> = this._onDidChangeTreeData.event;

	private configFiles: ConfigFile[] = [];

	constructor(private rulebookFileProvider: RulebookFileProvider) {
		this.rulebookFileProvider.onDidChangeTreeData((e) =>{
			if (!e || e.rulebook.Files.length < 1) {
				this.configFiles = [];
				this.refresh(undefined);
				return;
			}
			this.refresh(e);
		});
	}

	// Method to refresh the TreeView
	refresh(rulebookFile: RulebookFile | undefined | void): void {
		if (rulebookFile) {
			const filepaths = rulebookFile.getConfigFiles();
			this.configFiles = this.parseConfigFiles(filepaths);
		} else this.configFiles = [];

		// This will refresh the whole TreeView. If you want more control, you could pass specific data through your event and refresh selectively.
		this._onDidChangeTreeData.fire();
	}

	parseConfigFiles = (filepaths: string[]): ConfigFile[] => 
		filepaths.map(filepath => {
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
			if (filename && extension.join('.') !== 'json') throw new Error('Invalid file extension');
			else await vscode.workspace.fs.writeFile(uri, new Uint8Array());
		} catch (error) {
			// console.error(`Error creating config file: ${error as string}`);
		}
	};

	deleteConfigFile = async (node: ConfigFile, selection: RulebookFile[] | undefined | void): Promise<void> => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete config file ${node.label}?`, { modal: true }, 'Delete');
		if (confirm === 'Delete') {
			try {
				await this.deleteConfigFileFile(vscode.Uri.file(node.filepath));
				if (selection && selection[0] instanceof RulebookFile) {
					const uri = vscode.Uri.file(node.filepath);
					await this.rulebookFileProvider.removeConfigFileFromRulebooks(uri, selection);
				}
			} catch (error) {
				await vscode.window.showErrorMessage(`Error deleting config file: ${error as string}`);
			}
		}
	};

	deleteConfigFileFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			// Remove the file from the filesystem.
			await vscode.workspace.fs.delete(uri, { recursive: false });
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
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider('configFiles', this.configFileProvider)
		);

		this.configFileTreeView = vscode.window.createTreeView('configFiles', {
			treeDataProvider: this.configFileProvider
		});

		// register ConfigFileView commands here
		const { registerCommand, executeCommand } = vscode.commands;

		registerCommand('configFiles.openConfigFile', async (filePath: string) => {
			await executeCommand('vscode.open', vscode.Uri.file(filePath));
		});
		registerCommand('configFiles.refreshConfigFiles', () => {
			this.configFileProvider.refresh(rulebookExplorer.getSelectedRulebook())
		});
		registerCommand('configFiles.addConfigFile', async () => {
			const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Config File', filters: { 'JSON': ['json'] } });
			if (uri) {
				const selectedRulebook = rulebookExplorer.getSelectedRulebook();
				if (selectedRulebook instanceof RulebookFile) {
					await this.configFileProvider.addConfigFile(uri);
					await rulebookFileProvider.addConfigFileToRulebook(uri, selectedRulebook);
					// await rulebookFileProvider.openRulebook(selectedRulebook.uri);
				} else
					await vscode.window.showErrorMessage(`Choose a rulebook first!`);
			}
		});
		registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			const selection = rulebookExplorer.getSelectedRulebook();
			if (selection)
				await this.configFileProvider.deleteConfigFile(node, [selection]);
		});
	}

	getTreeView(): vscode.TreeView<ConfigFile> {
		return this.configFileTreeView;
	}
	getProvider(): ConfigFileProvider {
		return this.configFileProvider;
	}
	getSelectedConfigFile = (): ConfigFile | undefined => {
		return this.configFileTreeView.selection[0] || undefined;
	};
}