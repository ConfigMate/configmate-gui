import * as vscode from 'vscode';
import { Spec } from './models';
import * as utils from "./utils";
import * as path from 'path';
import { Config } from './models';
import { ConfigMateProvider } from './configMate';

export class SpecFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public filepath: string,
		public specFile: Spec
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = vscode.workspace.asRelativePath(filepath);
		this.tooltip = specFile.description;
		this.contextValue = 'specFile';
	}


	public getConfigFilePaths(): string[] {
		const configFiles: string[] = [];
		for (const config of Object.values(this.specFile.files)) {
			if (!config.path) continue;
			configFiles.push(path.resolve(vscode.workspace.workspaceFolders[0].uri.fsPath, config.path));
		}
		return configFiles;
	}

	public getConfigs(): Config[] {
		return this.specFile.files;
	}
}

export class SpecFileProvider implements vscode.TreeDataProvider<SpecFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<SpecFile | undefined | void> = new vscode.EventEmitter<SpecFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SpecFile | undefined | void> = this._onDidChangeTreeData.event;

	// eslint-disable-next-line no-unused-vars
	constructor(private readonly configMateProvider: ConfigMateProvider) { }

	onSpecFileSelectionChanged = async (specFiles: readonly SpecFile[]): Promise<void> => {
		await this.openSpecFile(specFiles[0].filepath);
		this.refresh(specFiles[0]);
	}

	refresh = (selection?: SpecFile): void =>
		this._onDidChangeTreeData.fire(selection);

	getTreeItem = (element: SpecFile): vscode.TreeItem => element;
	getParent = (): vscode.ProviderResult<SpecFile> => null;
	getChildren = async (element?: SpecFile): Promise<SpecFile[]> => {
		if (element || !vscode.workspace.workspaceFolders) return [];

		const pattern = '**/*.{cms}';
		const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000);

		const specFiles: SpecFile[] = [];
		for (const uri of uris) {
			const filepath: string = uri.fsPath;
			const label = utils.uriToFilename(uri);
			try {
				const spec = await this.configMateProvider.getSpecFromUri(uri);
				const file = new SpecFile(label, filepath, spec);
				specFiles.push(file);
			} catch (error) { 
				console.error(`Error parsing specFile ${label}: `, error);
				// return Promise.reject(error);
			}
		}
		return Promise.resolve(specFiles);
	};

	openSpecFile = async (filepath: string): Promise<void> => {
		try {
			const uri = vscode.Uri.file(filepath);
			await vscode.workspace.fs.stat(uri);
			await vscode.commands.executeCommand('vscode.open', uri)
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error opening specFile file: ${error as string}`);
		}
	};

	addSpecFile = async (uri: vscode.Uri): Promise<SpecFile> => {
		try {
			await this.configMateProvider.createSpecFile(uri);
			this.refresh();
			const file = await this.getSpecFile(uri);
			await this.onSpecFileSelectionChanged([file]);
			return Promise.resolve(file);
		} catch (error) {
			await vscode.window.showErrorMessage(`Error creating specFile: ${error as string}`);
			return Promise.reject(error);
		}
	};

	deleteSpecFile = async (node: SpecFile): Promise<void> => {
		const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete specFile ${node.label}?`, { modal: true }, 'Delete');
		if (confirm !== 'Delete') return;
		try {
			await this.deleteSpecFileFile(vscode.Uri.file(node.filepath));
		} catch (error) { 
			await vscode.window.showErrorMessage(`Error deleting specFile: ${error as string}`);
		}
	};

	deleteSpecFileFile = async (uri: vscode.Uri): Promise<void> => {
		try {
			await vscode.workspace.fs.delete(uri, { recursive: false });
			this.refresh();
		} catch (error) { 
			console.error(`Error deleting specFile ${uri.fsPath}: `, error); 
		}
	}

	getSpecFile = async (uri: vscode.Uri): Promise<SpecFile> => {
		const specFiles: SpecFile[] = await this.getChildren();
		for (const specFile of specFiles)
			if (specFile.filepath === uri.fsPath) return specFile;
		return {} as SpecFile;
	};
}

export class SpecFileExplorer {
	private specFileTreeView: vscode.TreeView<SpecFile>;
	private specFileProvider: SpecFileProvider;

	constructor(context: vscode.ExtensionContext,
		configMateProvider: ConfigMateProvider) {
		this.specFileProvider = new SpecFileProvider(configMateProvider);
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider('specFiles', this.specFileProvider)
		);
		this.specFileTreeView = vscode.window.createTreeView('specFiles',
			{ treeDataProvider: this.specFileProvider }
		);
		this.specFileTreeView.onDidChangeSelection(async e =>
			await this.specFileProvider.onSpecFileSelectionChanged(e.selection)
		);

		const { registerCommand } = vscode.commands;
		context.subscriptions.push(
			registerCommand('specFiles.refreshSpecFiles', () =>
				this.specFileProvider.refresh()
			),
			registerCommand('specFiles.addSpecFile', async () => {
				const uri = await vscode.window.showSaveDialog(
					{ saveLabel: 'Create specFile', filters: { 'cms': ['cms'] } }
				);
				if (!uri) return;
				const file = await this.specFileProvider.addSpecFile(uri);
				await this.specFileTreeView.reveal(file, { select: true, focus: true });
			}),
			registerCommand('specFiles.deleteSpecFile', async (specFile: SpecFile) =>
				await this.specFileProvider.deleteSpecFile(specFile)
			),
		);
	}

	getTreeView = (): vscode.TreeView<SpecFile> => this.specFileTreeView;
	getProvider = (): SpecFileProvider => this.specFileProvider;
	getSelectedSpecFile = (): SpecFile | undefined =>
		this.specFileTreeView.selection[0] || undefined;
}


export const initSpecFile = (filename: string): Spec => {
	const specFile: Spec = {
		name: filename,
		description: "specFile description",
		files: []
	};

	return specFile;
};