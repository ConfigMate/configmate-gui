'use strict';

import { window, commands, workspace, 
	WorkspaceEdit, TextDocument, ExtensionContext, Uri } from 'vscode';
// import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';
import { DiagnosticManager } from './DiagnosticManager';
import { RulebookManager } from './RulebookManager';

export function activate(context: ExtensionContext) {
	// Text decoration
	const diagnosticManager = new DiagnosticManager(context);

	// Rulebook treeview
	const rulebookManager = new RulebookManager(diagnosticManager);
	const rulebookFileProvider = new RulebookFileProvider(rulebookManager);

	window.registerTreeDataProvider('rulebooks', rulebookFileProvider);
	commands.registerCommand('rulebooks.refreshRulebooks', () => rulebookFileProvider.refresh());
	commands.registerCommand('rulebooks.addRulebook', () => window.showInformationMessage(`Added new rulebook.`));
	commands.registerCommand('rulebooks.editRulebook', (node: RulebookFile) => window.showTextDocument(Uri.file(node.filepath)));
	commands.registerCommand('rulebooks.deleteRulebook', (node: RulebookFile) => window.showInformationMessage(`Deleted rulebook ${node.label}.`));

	// ConfigFile treeview
	const configFileProvider = new ConfigFileProvider(rulebookManager);

	window.registerTreeDataProvider('configFiles', configFileProvider);
	commands.registerCommand('configFiles.refreshConfigFiles', () => configFileProvider.refresh());
	commands.registerCommand('configFiles.addConfigFile', () => 
		// ask for filename/extension, create new text document within configFiles View, then open it
		window.showInputBox({
			prompt: 'Enter the name of the new config file',
			placeHolder: 'config.json',
			validateInput: (input: string) => {
				if (input.length === 0)
					return 'Please enter a name for the new config file.';
				else if (input.indexOf('.') === -1)
					return 'Please enter a valid filename with an extension.';
				else return null;
			}
		}).then((input: string | undefined) => {
			if (input) {
				const workspaceEdit = new WorkspaceEdit();
				const filepath = Uri.joinPath(context.extensionUri, input);
				workspaceEdit.createFile(filepath, { ignoreIfExists: true });
				workspace.applyEdit(workspaceEdit)
				.then(() => workspace.openTextDocument(filepath),
				(error: Error) => console.error('Error creating new config file: ', error));
				// lol this creates the file in my actual workspace

				// https://stackoverflow.com/questions/74339446/insert-default-text-into-newly-created-files-using-vscod-extension-api
				// https://stackoverflow.com/questions/64475731/how-to-create-a-new-file-in-vscode-extension
				// possibly createFileSystemWatcher
			}
		}));
	commands.registerCommand('configFiles.editConfigFile', (node: ConfigFile) => window.showTextDocument(Uri.file(node.filepath)));
	commands.registerCommand('configFiles.deleteConfigFile', (node: ConfigFile) => window.showInformationMessage(`Deleted configFile ${node.label}.`));


	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	commands.registerCommand('configMate.checkConfigFile', (node: ConfigFile) => configMateProvider.checkConfigFile(node.filepath));
	commands.registerCommand('configMate.checkConfigFiles', () => configMateProvider.checkAllConfigFiles());
	commands.registerCommand('configMate.checkRulebook', (node: RulebookFile) => configMateProvider.checkRulebook(node.filepath));


	// Text document coordination
	workspace.onDidSaveTextDocument((document: TextDocument) => {
		console.log(`Saved ${document.fileName}`);
		void window.showInformationMessage(`Saved ${document.fileName}`);
	});



}