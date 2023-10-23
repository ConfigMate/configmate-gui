'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';
import { DiagnosticsProvider } from './diagnostics';

export let configFileProvider!: ConfigFileProvider;
export let rulebookFileProvider!: RulebookFileProvider;
export let rulebookTreeView!: vscode.TreeView<RulebookFile>;
export let diagnosticsProvider!: DiagnosticsProvider;

export function activate(context: vscode.ExtensionContext): void {
	const { Uri, window, commands, workspace } = vscode;
	const { registerCommand, executeCommand } = commands;

	rulebookFileProvider = new RulebookFileProvider();
	rulebookTreeView = window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });

	configFileProvider = new ConfigFileProvider(rulebookFileProvider);
	window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(
		registerCommand('rulebooks.openRulebook', async (filePath: string) => {
			await executeCommand('vscode.open', Uri.file(filePath));
			await rulebookFileProvider.selectRulebook(Uri.file(filePath));
		}),
		registerCommand('rulebooks.refreshRulebooks', () => 
			rulebookFileProvider.refresh()
		),

		registerCommand('configFiles.openConfigFile', async (filePath: string) => {
			await executeCommand('vscode.open', Uri.file(filePath));
		}),
		registerCommand('configFiles.refreshConfigFiles', () => 
			configFileProvider.refresh()
		),

		registerCommand('configMate.checkConfigFile', async (node: ConfigFile) => 
			await configMateProvider.checkConfigFile(node.filepath)
		),

		registerCommand('rulebooks.addRulebook', async () => {
			const uri = await window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'JSON': ['rulebook.json'] } });
			if (uri) await rulebookFileProvider.addRulebook(uri);
		}),
		registerCommand('rulebooks.deleteRulebook', async (node: RulebookFile) => {
			await rulebookFileProvider.deleteRulebook(node);
		}),
		registerCommand('configFiles.addConfigFile', async () => {
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
		registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			await configFileProvider.deleteConfigFile(node);
		}),


		workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
			if (doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json'))
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText());
		}),
		
		registerCommand('extension.runGoServer', () => configMateProvider.runServer(context))
	);

	diagnosticsProvider = new DiagnosticsProvider();

	// void executeCommand('extension.runGoServer');
}