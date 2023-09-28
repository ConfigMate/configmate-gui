import * as vscode from 'vscode';
import * as path from 'path';
import {Rulebook} from './models';

export class RulebookFile extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly command: vscode.Command,
		public readonly filepath: string,
		public readonly rulebook: Rulebook
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

	getChildren = (element?: RulebookFile): Thenable<RulebookFile[]> => {
		if (!vscode.workspace.workspaceFolders) return Promise.resolve([]);
		if (element) return Promise.resolve([]);
		else {
			const pattern = '**/*.{rulebook}.{json,toml,hocon}';
			return vscode.workspace.findFiles(pattern, '**/node_modules/**', 1000)
				.then(uris => {
					const promises = uris.map(uri => {
						const filepath: string = uri.fsPath;
						return this.parseRulebook(filepath)
							.then((rulebook: Rulebook) => {
								return new RulebookFile(
									path.basename(filepath),
									{
										command: 'rulebooks.openRulebook',
										title: 'Open Rulebook',
										arguments: [filepath, rulebook]
									},
									filepath,
									rulebook
								);
							})
							.catch((err) => {
								console.error(`Error parsing rulebook file ${filepath}: `, err);
								return null;
							});
					});
					return Promise.all(promises);
				})
				.then(rulebookFiles => rulebookFiles.filter((file): file is RulebookFile => file !== null));
		}
	};


	async readFile(filepath: string): Promise<string> {
		const uri: vscode.Uri = vscode.Uri.file(filepath);
		const buffer: Uint8Array = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(buffer).toString();
	}

	async parseRulebook(filepath: string): Promise<Rulebook> {
		const fileContents: string = await this.readFile(filepath);

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
}