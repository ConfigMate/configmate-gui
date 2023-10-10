'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';

export function activate(context: vscode.ExtensionContext) {
	
	const rulebookFileProvider = new RulebookFileProvider();
	const rulebookTreeView = vscode.window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });

	const configFileProvider = new ConfigFileProvider();
	vscode.window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(
		vscode.commands.registerCommand('rulebooks.openRulebook', (rulebookPath: string) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(rulebookPath));
			configFileProvider.refresh(rulebookTreeView);
		}),
		vscode.commands.registerCommand('rulebooks.refreshRulebooks', () => 
			rulebookFileProvider.refresh()
		),

		vscode.commands.registerCommand('configFiles.openConfigFile', (filePath: string) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
		}),
		vscode.commands.registerCommand('configFiles.refreshConfigFiles', (rulebookTreeView: vscode.TreeView<RulebookFile>) => 
			configFileProvider.refresh(rulebookTreeView)
		),

		vscode.commands.registerCommand('configMate.checkConfigFile', async (node: ConfigFile) => 
			await configMateProvider.checkConfigFile(node.filepath)
		),

		vscode.commands.registerCommand('rulebooks.addRulebook', async () => {
			const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'JSON': ['rulebook.json'] } });
			if (uri) await rulebookFileProvider.addRulebook(uri);
		}),
		vscode.commands.registerCommand('rulebooks.deleteRulebook', async (node: RulebookFile) => {
			await rulebookFileProvider.deleteRulebook(node);
			rulebookFileProvider.refresh();
		}),
		vscode.commands.registerCommand('configFiles.addConfigFile', async () => {
			const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Config File', filters: { 'JSON': ['json'] } });
			if (uri) {
				const selectedRulebook = rulebookTreeView.selection[0];
				if (selectedRulebook instanceof RulebookFile) {
					await configFileProvider.addConfigFile(uri);
					await rulebookFileProvider.addConfigFileToRulebook(uri, selectedRulebook);
					configFileProvider.refresh(rulebookTreeView);
				} else
					void vscode.window.showErrorMessage(`Choose a rulebook first!`);
			}
		}),
		vscode.commands.registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			await configFileProvider.deleteConfigFile(node);
			const uri = vscode.Uri.file(node.filepath);
			await rulebookFileProvider.removeConfigFileFromRulebooks(uri);
			configFileProvider.refresh(rulebookTreeView);
		}),


		vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
			if (doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json'))
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText());
		}),
		
		vscode.commands.registerCommand('extension.runGoServer', () => configMateProvider.runServer(context))
	);

	void vscode.commands.executeCommand('extension.runGoServer');
}