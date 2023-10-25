'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookExplorer, RulebookFileProvider } from './rulebooks';
import { ConfigFile, ConfigFileExplorer } from './configFiles';
import { ConfigMateProvider } from './configMate';

export let configFileExplorer!: ConfigFileExplorer;
export let rulebookExplorer!: RulebookExplorer;

export function activate(context: vscode.ExtensionContext): void {
	const rulebookFileProvider = new RulebookFileProvider();
	rulebookExplorer = new RulebookExplorer(context, rulebookFileProvider);
	configFileExplorer = new ConfigFileExplorer(context, rulebookExplorer);

	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(
		vscode.commands.registerCommand('configMate.checkConfigFile', 
			async (node: ConfigFile) =>	await configMateProvider.check(node.filepath)),
		vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => 
			(doc.languageId === 'json' && doc.uri.fsPath.endsWith('rulebook.json')) ? 
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText()): null),
		configMateProvider.runServer(context)
	);
}