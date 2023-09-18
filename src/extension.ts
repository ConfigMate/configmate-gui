'use strict';

import * as vscode from 'vscode';

import { RuleProvider as RuleProvider, Rulebook } from './rulebooks';
import { JsonOutlineProvider } from './jsonOutline';
import { ConfigFileExplorer as ConfigFileExplorer } from './configFileExplorer';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Samples of `window.registerTreeDataProvider`
	const ruleProvider = new RuleProvider(rootPath);
	vscode.window.registerTreeDataProvider('rulebooks', ruleProvider);
	vscode.commands.registerCommand('rulebooks.refreshEntry', () => ruleProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('rulebooks.addEntry', () => vscode.window.showInformationMessage(`Added new rulebook.`));
	vscode.commands.registerCommand('rulebooks.editEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Updated rulebook ${node.label}.`));
	vscode.commands.registerCommand('rulebooks.deleteEntry', (node: Rulebook) => vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`));

	const jsonOutlineProvider = new JsonOutlineProvider(context);
	vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider);
	vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
	vscode.commands.registerCommand('jsonOutline.refreshNode', offset => jsonOutlineProvider.refresh(offset));
	vscode.commands.registerCommand('jsonOutline.renameNode', args => {
		let offset = undefined;
		if (args.selectedTreeItems && args.selectedTreeItems.length) {
			offset = args.selectedTreeItems[0];
		} else if (typeof args === 'number') {
			offset = args;
		}
		if (offset) {
			jsonOutlineProvider.rename(offset);
		}
	});
	vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));

	// Samples of `window.createView`
	new ConfigFileExplorer(context);
}