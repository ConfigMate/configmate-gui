import * as vscode from 'vscode';
import * as path from 'path';
import {Rulebook} from './models';
import { rulebookTreeView } from './extension';

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
		public readonly command: vscode.Command,
		public readonly filepath: string,
		public rulebook: Rulebook
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = rulebook.Name;
		this.tooltip = rulebook.Description;
		this.filepath = filepath;
		this.rulebook = rulebook;
		this.command = command;
		this.contextValue = 'rulebook';
	}

}
export class RulebookFileProvider implements vscode.TreeDataProvider<RulebookFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<RulebookFile | undefined | void> = new vscode.EventEmitter<RulebookFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<RulebookFile | undefined | void> = this._onDidChangeTreeData.event;

	refresh = (): void => this._onDidChangeTreeData.fire();

	getTreeItem = (element: RulebookFile): vscode.TreeItem => element;

	getChildren = async (element?: RulebookFile): Promise<RulebookFile[]> => {
		if (!vscode.workspace.workspaceFolders || element) return Promise.resolve([]);
		else {
			const pattern = '**/*.{rulebook}.{json,toml,hocon}';
			const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000);
			const promises = uris.map(async uri => {
				const filepath: string = uri.fsPath;
				try {
					const rulebook = await this.parseRulebook(filepath);
					return new RulebookFile(
						path.basename(filepath),
						{
							command: 'rulebooks.openRulebook',
							title: 'Open Rulebook',
							arguments: [uri, rulebook]
						},
						filepath,
						rulebook
					);
				} catch (err) {
					console.error(`Error parsing rulebook file ${filepath}: `, err);
					return null;
				}
			});
			const rulebookFiles = await Promise.all(promises);
			return rulebookFiles.filter((file): file is RulebookFile => file !== null);
		}
	};

	getParent(element: RulebookFile): vscode.ProviderResult<RulebookFile> {
		return null;
	}

	async readFile(filepath: string): Promise<string> {
		const uri: vscode.Uri = vscode.Uri.file(filepath);
		const buffer: Uint8Array = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(buffer).toString();
	}

	async parseRulebook(filepath: string, contents?: string): Promise<Rulebook> {
		const fileContents: string = contents || await this.readFile(filepath);

		// const fileContents: string = '';
		const fileExtension: string = path.extname(filepath);
		const fileName: string = path.basename(filepath);
		const fileContentsAreValid: boolean = fileContents !== '' && fileContents !== undefined;

		if (!fileExtension || !fileContents || !fileName || !fileContentsAreValid) {
			if (!fileExtension) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid file extension`);
			if (!fileContents) void vscode.window.showErrorMessage(`Rulebook file ${fileName} is empty`);
			if (!fileName) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid file name`);
		}


		const rulebook: Rulebook = JSON.parse(fileContents) as Rulebook;
		const { Name, Description, Files, Rules } = rulebook;
		if (!Name || !Description || !Files || !Rules) {
			if (!Name) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid name`);
			if (!Description) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid description`);
			if (!Files) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid files`);
			if (!Rules) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid rules`);
		}

		return rulebook;
	}
	writeRulebook = async (uri: vscode.Uri, rulebook: Rulebook): Promise<void> => {
		try {
			const contentAsUint8Array = Buffer.from(JSON.stringify(rulebook, null, 4));
			await vscode.workspace.fs.writeFile(uri, contentAsUint8Array);
			this.refresh();
		} catch (error) {
			void vscode.window.showErrorMessage(`Error writing rulebook: ${error as string}`);
		}
	};

	addRulebook = async (uri: vscode.Uri): Promise<void> => {
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

	deleteRulebook = async (node: RulebookFile) => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete rulebook ${node.label}?`, { modal: true }, 'Delete');
		if (confirm === 'Delete') 
			await this.deleteRulebookFile(vscode.Uri.file(node.filepath));
	};

	deleteRulebookFile = async (uri: vscode.Uri) => {
			try {
				await vscode.workspace.fs.delete(uri, { recursive: true });
				void vscode.window.showInformationMessage(`Deleted rulebook ${uri.fsPath}.`);
			} catch (error) {
				void vscode.window.showErrorMessage(`Error deleting rulebook: ${error as string}`);
			}
	};

	addConfigFileToRulebook = async (uri: vscode.Uri, selectedRulebook: RulebookFile): Promise<void> => {
		try {
			selectedRulebook.rulebook.Files.push(uri.fsPath);
			const rulebookUri = vscode.Uri.file(selectedRulebook.filepath);
			await this.writeRulebook(rulebookUri, selectedRulebook.rulebook);
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	removeConfigFileFromRulebooks = async (uri: vscode.Uri): Promise<void> => {
		try {
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				const index = rulebookFile.rulebook.Files.indexOf(uri.fsPath);
				if (index > -1) {
					rulebookFile.rulebook.Files.splice(index, 1);
					const rulebookUri = vscode.Uri.file(rulebookFile.filepath);
					await this.writeRulebook(rulebookUri, rulebookFile.rulebook);
				}
			}
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	saveRulebook = async (uri: vscode.Uri, text: string): Promise<void> => {
		try {
			const rulebook: Rulebook = await this.parseRulebook(uri.fsPath, text);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath === uri.fsPath) {
					rulebookFile.rulebook = rulebook;
					break;
				}
			}
		} catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
	};

	selectRulebook = async(uri: vscode.Uri): Promise<RulebookFile | undefined> => {
		try {
			await vscode.workspace.fs.stat(uri);
			const rulebookFiles = await this.getChildren();
			for (const rulebookFile of rulebookFiles) {
				if (rulebookFile.filepath === uri.fsPath) {
					await rulebookTreeView.reveal(rulebookFile);
					return rulebookFile;
				}
			}
		}
		catch (error) {
			void vscode.window.showErrorMessage(`Error: ${error as string}`);
		}
		return undefined;
	};
}