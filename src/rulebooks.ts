'use strict';

import { Uri } from 'vscode';
import * as vscode from 'vscode';
import * as path from 'path';
import { Rulebook } from './models';
import { configFileProvider, rulebookTreeView } from './extension';

export const initRulebook = (filename: string, files?: string[]): Rulebook => {
	const rulebook: Rulebook = {
		Name: filename,
		Description: "Rulebook description",
		Files: [],
		Rules: [
			{
				"Description": "Rule description",
				"CheckName": "Name of check to run",
				"Args": "Arguments to pass to check"
			}
		]
	};
	if (files) rulebook.Files.push(...files);
	return rulebook;
};

export class RulebookFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// public command: vscode.Command,
		public readonly filepath: string,
		public rulebook: Rulebook
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = rulebook.Name;
		this.tooltip = rulebook.Description;
		this.filepath = filepath;
		// this.rulebook = rulebook;
		// this.command = command;
		this.contextValue = 'rulebook';
	}

	getConfigFiles(): string[]{
		return this.rulebook.Files;
	}
}

export class RulebookFileProvider implements vscode.TreeDataProvider<RulebookFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<RulebookFile | undefined | void> = new vscode.EventEmitter<RulebookFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<RulebookFile | undefined | void> = this._onDidChangeTreeData.event;

	

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: RulebookFile): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: RulebookFile): Promise<RulebookFile[]> {
		if (element || !vscode.workspace.workspaceFolders) {
			return []; // if element is present, it means we are at the leaf node, or there's no workspace opened
		}

		const pattern = '**/*.{rulebook}.{json,toml,hocon}';
		const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000);

		const rulebookFiles: RulebookFile[] = [];
		for (const uri of uris) {
			const filepath: string = uri.fsPath;
			try {
				const rulebook = await this.parseRulebook(filepath);
				const rulebookFile = new RulebookFile(
					path.basename(filepath),
					filepath,
					rulebook
				);
				rulebookFile.command = {
					command: 'rulebooks.openRulebook',
					title: 'Open Rulebook',
					arguments: [filepath, rulebook]
				};
				rulebookFiles.push(rulebookFile);
			} catch (err) {
				// console.error(`Error parsing rulebook file ${filepath}: `, err);
				// Handle or log error as appropriate
			}
		}
		return rulebookFiles;
	}

	getParent(): vscode.ProviderResult<RulebookFile> {
		return null;
	}

	async readFile(filepath: string): Promise<string> {
		const uri = Uri.file(filepath);
		const buffer = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(buffer).toString();
	}

	async parseRulebook(filepath: string, contents?: string): Promise<Rulebook> {
		const fileContents: string = contents || await this.readFile(filepath);

		// Check for valid file contents before proceeding
		if (!fileContents) {
			throw new Error(`Rulebook file is empty or unreadable.`);
		}

		// Try parsing the JSON content
		let rulebook: Rulebook;
		try {
			rulebook = JSON.parse(fileContents) as Rulebook;
		} catch (error) {
			throw new Error(`Error parsing rulebook content: ${error as string}`);
		}

		// Validate the necessary fields in the rulebook
		const { Name, Description, Files, Rules } = rulebook;
		if (!Name || !Description || !Files || !Rules) {
			throw new Error(`Rulebook file is missing required fields.`);
		}

		return rulebook;
	}

	writeRulebook = async (uri: Uri, rulebook: Rulebook): Promise<void> => {
		try {
			const contentAsUint8Array = Buffer.from(JSON.stringify(rulebook, null, 4));
			await vscode.workspace.fs.writeFile(uri, contentAsUint8Array);
			this.refresh(); // Assuming this doesn't return a promise; otherwise, await this too.
		} catch (error) {
			// Handle or throw the error
			throw new Error(`Error writing rulebook: ${error as string}`);
		}
	};

	addRulebook = async (uri: Uri): Promise<void> => {
		try {
			const filepath = (path.basename(uri.fsPath)).split('.');
			const [filename, ...extension] = filepath;
			if (extension.join('.') !== 'rulebook.json') throw new Error('Invalid file extension');
			const rulebook = initRulebook(filename);
			await this.writeRulebook(uri, rulebook);
			void vscode.window.showInformationMessage(`Added new rulebook ${uri.fsPath}.`);
		} catch (error) {
			void vscode.window.showErrorMessage(`Error creating rulebook: ${error as string}`);
		}
	};
	
	deleteRulebook = async (node: RulebookFile): Promise<void> => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete rulebook ${node.label}?`, { modal: true }, 'Delete');
		if (confirm === 'Delete') {
			try {
				await this.deleteRulebookFile(Uri.file(node.filepath));
				this.refresh();
			}
			catch(error) {
				throw new Error(`Error deleting rulebook: ${error as string}`);
			}
		}
	};
	
	async deleteRulebookFile(uri: Uri): Promise<void> {
		try {
			await vscode.workspace.fs.delete(uri, { recursive: false });
			void vscode.window.showInformationMessage(`Deleted rulebook ${uri.fsPath}.`);
			this.refresh();
		} catch (error) {
			void vscode.window.showErrorMessage(`Error deleting rulebook: ${error as string}`);
			console.error(`Error deleting rulebook ${uri.fsPath}: `, error);
		}
	}


	addConfigFileToRulebook = async (uri: Uri, selectedRulebook: RulebookFile): Promise<void> => {
		try {
			selectedRulebook.rulebook.Files.push(uri.fsPath);
			const rulebookUri = Uri.file(selectedRulebook.filepath);
			await this.writeRulebook(rulebookUri, selectedRulebook.rulebook);
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	removeConfigFileFromRulebooks = async (uri: Uri): Promise<void> => {
		try {
			const rulebookFiles = await this.getChildren();
			rulebookFiles.forEach((rulebookFile) => {
				const index = rulebookFile.rulebook.Files.indexOf(uri.fsPath);
				if (index > -1) rulebookFile.rulebook.Files.splice(index, 1);		
			});
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	saveRulebook = async (uri: Uri, text: string): Promise<void> => {
		try {
			const filepath: string = uri.fsPath;
			const rulebook: Rulebook = await this.parseRulebook(filepath, text);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath === filepath) {
					rulebookFile.rulebook = rulebook;
					break;
				} else {
					rulebookFile.command = {
						command: 'rulebooks.openRulebook',
						title: 'Open Rulebook',
						arguments: [filepath, rulebook]
					};
					break;
				}
			}
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	selectRulebook = async (uri: Uri): Promise<RulebookFile | undefined> => {
		try {
			await vscode.workspace.fs.stat(uri);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath === uri.fsPath) {
					await rulebookTreeView.reveal(rulebookFile);
					configFileProvider.refresh();
					return rulebookFile;
				}
			}
		}
		catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
		return undefined;
	};

	getSelectedRulebook = (): RulebookFile | undefined => {
		const selectedRulebook = rulebookTreeView.selection[0];
		if (selectedRulebook instanceof RulebookFile) return selectedRulebook;
		return undefined;
	};
}
