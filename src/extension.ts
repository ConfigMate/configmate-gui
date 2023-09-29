'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';
// import { DiagnosticManager } from './DiagnosticManager';
// import { RulebookManager } from './RulebookManager';
import {Rulebook} from './models';

export function activate(context: vscode.ExtensionContext) {
	// Text decoration
	// const diagnosticManager = new DiagnosticManager(context);

	// Rulebook treeview
	// const rulebookManager = new RulebookManager(diagnosticManager);
	
	const rulebookFileProvider = new RulebookFileProvider();
	vscode.window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });

	const configFileProvider = new ConfigFileProvider();
	vscode.window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	context.subscriptions.push(
		vscode.commands.registerCommand('rulebooks.openRulebook', (rulebookPath: string, rulebook: Rulebook) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(rulebookPath));
			configFileProvider.refresh(rulebook.Files);
		}),
		vscode.commands.registerCommand('rulebooks.refreshRulebooks', () => 
			rulebookFileProvider.refresh()
		),
		vscode.commands.registerCommand('rulebooks.addRulebook', () => 
			vscode.window.showInformationMessage(`Added new rulebook.`)
		),
		vscode.commands.registerCommand('rulebooks.deleteRulebook', (node: RulebookFile) => 
			vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`)
		),
		vscode.commands.registerCommand('configFiles.openConfigFile', (filePath: string) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
		}),
		vscode.commands.registerCommand('configFiles.refreshConfigFiles', (rulebook: Rulebook) => 
			configFileProvider.refresh(rulebook.Files)
		),
		vscode.commands.registerCommand('configFiles.addConfigFile', () => 
			vscode.window.showInformationMessage(`Added new configFile.`)
		),
		vscode.commands.registerCommand('configFiles.deleteConfigFile', (node: ConfigFile) => 
			vscode.window.showInformationMessage(`Deleted configFile ${node.label}.`)
		),
	);


	// // ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	vscode.commands.registerCommand('configMate.checkConfigFile', (node: ConfigFile) => configMateProvider.checkConfigFile(node.filepath));
	vscode.commands.registerCommand('configMate.checkConfigFiles', () => configMateProvider.checkAllConfigFiles());
	vscode.commands.registerCommand('configMate.checkRulebook', (node: RulebookFile) => configMateProvider.checkRulebook(node.filepath));

}