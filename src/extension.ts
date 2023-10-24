'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookExplorer, RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';
// import { Rule } from './models';

export let configFileProvider!: ConfigFileProvider;
export let rulebookFileProvider!: RulebookFileProvider;
export let rulebookTreeView!: vscode.TreeView<RulebookFile>;
export let rulebookExplorer!: RulebookExplorer;

export function activate(context: vscode.ExtensionContext): void {
	const { Uri, window, commands, workspace } = vscode;
	const { registerCommand, executeCommand } = commands;

	rulebookFileProvider = new RulebookFileProvider();
	rulebookExplorer = new RulebookExplorer(context, rulebookFileProvider);
	rulebookTreeView = rulebookExplorer.getTreeView();
	configFileProvider = new ConfigFileProvider(rulebookFileProvider);
	window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(


		registerCommand('configFiles.openConfigFile', async (filePath: string) => {
			await executeCommand('vscode.open', Uri.file(filePath));
		}),
		registerCommand('configFiles.refreshConfigFiles', () => 
			configFileProvider.refresh(rulebookExplorer.getSelectedRulebook())
		),

		registerCommand('configMate.checkConfigFile', async (node: ConfigFile) => 
			await configMateProvider.checkConfigFile(node.filepath)
		),

		
		registerCommand('configFiles.addConfigFile', async () => {
			const uri = await window.showSaveDialog({ saveLabel: 'Create Config File', filters: { 'JSON': ['json'] } });
			if (uri) {
				const selectedRulebook = rulebookExplorer.getSelectedRulebook();
				if (selectedRulebook instanceof RulebookFile) {
					await configFileProvider.addConfigFile(uri);
					await rulebookFileProvider.addConfigFileToRulebook(uri, selectedRulebook);
					// await rulebookFileProvider.openRulebook(selectedRulebook.uri);
				} else
					await window.showErrorMessage(`Choose a rulebook first!`);
			}
		}),
		registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			await configFileProvider.deleteConfigFile(node);
		}),


		workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
			if (doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json'))
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText());
		}),
		
		registerCommand('extension.runGoServer', () => configMateProvider.runServer(context))
	);

	// void executeCommand('extension.runGoServer');
}