'use strict';

import * as vscode from 'vscode';

import { RuleProvider, Rulebook } from './rulebooks';
import { ConfigFileProvider} from './configFiles';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Sample of `window.registerTreeDataProvider`
	const ruleProvider = new RuleProvider(rootPath);
	vscode.window.registerTreeDataProvider('rulebooks', ruleProvider);
	vscode.commands.registerCommand('rulebooks.refreshEntry', () => ruleProvider.refresh());
	vscode.commands.registerCommand('rulebooks.addEntry', () => vscode.window.showInformationMessage(`Added new rulebook.`));
	vscode.commands.registerCommand('rulebooks.editEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Updated rulebook ${node.label}.`));
	vscode.commands.registerCommand('rulebooks.deleteEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`));

	const configFileProvider = new ConfigFileProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('configFiles', configFileProvider));
	context.subscriptions.push(vscode.commands.registerCommand('extension.refreshConfigFiles', () => configFileProvider.refresh()));
}