'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';

export let configFileProvider: ConfigFileProvider;
export let rulebookFileProvider: RulebookFileProvider;
export let rulebookTreeView: vscode.TreeView<RulebookFile>;

export function activate(context: vscode.ExtensionContext) {
	const { Uri, window, commands, workspace } = vscode;

	rulebookFileProvider = new RulebookFileProvider();
	rulebookTreeView = window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });

	configFileProvider = new ConfigFileProvider(rulebookFileProvider);
	window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(
		commands.registerCommand('rulebooks.openRulebook', async (filePath: string) => {
			try {
				const uri = Uri.file(filePath);
				await workspace.fs.stat(uri);
				await rulebookFileProvider.selectRulebook(uri);
				await commands.executeCommand('vscode.open', uri);
			}
			catch (error) {
				await window.showErrorMessage(`Error: ${error as string}`);
			}
		}),
		commands.registerCommand('rulebooks.refreshRulebooks', () => 
			rulebookFileProvider.refresh()
		),

		commands.registerCommand('configFiles.openConfigFile', async (filePath: string) => {
			await commands.executeCommand('vscode.open', Uri.file(filePath));
		}),
		commands.registerCommand('configFiles.refreshConfigFiles', () => 
			configFileProvider.refresh()
		),

		commands.registerCommand('configMate.checkConfigFile', async (node: ConfigFile) => 
			await configMateProvider.checkConfigFile(node.filepath)
		),

		commands.registerCommand('rulebooks.addRulebook', async () => {
			const uri = await window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'JSON': ['rulebook.json'] } });
			if (uri) await rulebookFileProvider.addRulebook(uri);
		}),
		commands.registerCommand('rulebooks.deleteRulebook', async (node: RulebookFile) => {
			await rulebookFileProvider.deleteRulebook(node);
		}),
		commands.registerCommand('configFiles.addConfigFile', async () => {
			const uri = await window.showSaveDialog({ saveLabel: 'Create Config File', filters: { 'JSON': ['json'] } });
			if (uri) {
				const selectedRulebook = rulebookTreeView.selection[0];
				if (selectedRulebook instanceof RulebookFile) {
					await configFileProvider.addConfigFile(uri);
					await rulebookFileProvider.addConfigFileToRulebook(uri, selectedRulebook);
					// await rulebookFileProvider.selectRulebook(selectedRulebook.uri);
				} else
					await window.showErrorMessage(`Choose a rulebook first!`);
			}
		}),
		commands.registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			await configFileProvider.deleteConfigFile(node);
		}),


		workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
			if (doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json'))
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText());
		}),
		
		commands.registerCommand('extension.runGoServer', () => configMateProvider.runServer(context))
	);

	// void commands.executeCommand('extension.runGoServer');
}