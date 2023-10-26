import * as vscode from 'vscode';

import { RulebookExplorer, RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileExplorer } from './configFiles';
import { ConfigMateProvider } from './configMate';
import { DiagnosticsProvider } from './diagnostics';

export let configFileExplorer!: ConfigFileExplorer;
export let diagnosticsProvider!: DiagnosticsProvider;
export let rulebookExplorer!: RulebookExplorer;

export function activate(context: vscode.ExtensionContext): void {
	const rulebookFileProvider = new RulebookFileProvider();
	rulebookExplorer = new RulebookExplorer(context, rulebookFileProvider);
	configFileExplorer = new ConfigFileExplorer(context, rulebookExplorer);
	const configMateProvider = new ConfigMateProvider();
	diagnosticsProvider = new DiagnosticsProvider();

	context.subscriptions.push(
		vscode.commands.registerCommand('configMate.check', 
			async (node: RulebookFile) =>	{
				const response = await configMateProvider.check(node.filepath);
				console.log(response);
			}),
		vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => 
			(doc.languageId === 'cmrb' && doc.uri.fsPath.endsWith('cmrb')) ? 
				await rulebookFileProvider.saveRulebook(doc.uri, doc.getText()): null),
		// configMateProvider.runServer(context)
	);
}