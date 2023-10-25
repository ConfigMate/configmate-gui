'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookExplorer, RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile, ConfigFileExplorer } from './configFiles';
import { ConfigMateProvider } from './configMate';
import { DiagnosticsProvider } from './diagnostics';

// exports for use in tests; will improve this later
export let configFileExplorer!: ConfigFileExplorer;
export let configFileProvider!: ConfigFileProvider;
export let rulebookFileProvider!: RulebookFileProvider;
export let rulebookTreeView!: vscode.TreeView<RulebookFile>;
export let diagnosticsProvider!: DiagnosticsProvider;
export let rulebookExplorer!: RulebookExplorer;

export function activate(context: vscode.ExtensionContext): void {

	rulebookFileProvider = new RulebookFileProvider();
	rulebookExplorer = new RulebookExplorer(context, rulebookFileProvider);
	rulebookTreeView = rulebookExplorer.getTreeView();

	configFileExplorer = new ConfigFileExplorer(context, rulebookExplorer);
	configFileProvider = configFileExplorer.getProvider();

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);
	diagnosticsProvider = new DiagnosticsProvider();

	context.subscriptions.push(
		vscode.commands.registerCommand('configMate.checkConfigFile', async (node: ConfigFile) =>{
			const response = await configMateProvider.checkConfigFile(node.filepath);
			console.log(response);
			await diagnosticsProvider.parseResponse(response);
		}),
		vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
			if (doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json'))
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText());
		}),
		vscode.commands.registerCommand('extension.runGoServer', () => configMateProvider.runServer(context))
	);


	void vscode.commands.executeCommand('extension.runGoServer');
}