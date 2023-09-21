'use strict';

import * as vscode from 'vscode';

import { RulebookProvider, Rulebook } from './rulebooks';
import { ConfigFileProvider} from './configFiles';

export function activate(context: vscode.ExtensionContext) {
	const ruleProvider = new RulebookProvider();
	vscode.window.registerTreeDataProvider('rulebooks', ruleProvider);
	vscode.commands.registerCommand('rulebooks.refreshEntry', () => ruleProvider.refresh());
	vscode.commands.registerCommand('rulebooks.addEntry', () => vscode.window.showInformationMessage(`Added new rulebook.`));
	vscode.commands.registerCommand('rulebooks.editEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Updated rulebook ${node.label}.`));
	vscode.commands.registerCommand('rulebooks.deleteEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`));

	const configFileProvider = new ConfigFileProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('configFiles', configFileProvider));
	context.subscriptions.push(vscode.commands.registerCommand('extension.refreshConfigFiles', () => configFileProvider.refresh()));
}