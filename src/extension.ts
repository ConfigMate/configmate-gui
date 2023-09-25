'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookProvider, Rulebook } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';

export function activate(context: vscode.ExtensionContext) {
	// Rulebook treeview
	const ruleProvider = new RulebookProvider();

	vscode.window.registerTreeDataProvider('rulebooks', ruleProvider);
	vscode.commands.registerCommand('rulebooks.refreshRulebooks', () => ruleProvider.refresh());
	vscode.commands.registerCommand('rulebooks.addRulebook', () => vscode.window.showInformationMessage(`Added new rulebook.`));
	vscode.commands.registerCommand('rulebooks.editRulebook', (node: Rulebook) => vscode.window.showTextDocument(vscode.Uri.file(node.filepath)));
	vscode.commands.registerCommand('rulebooks.deleteRulebook', (node: Rulebook) => vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`));


	// ConfigFile treeview
	const configFileProvider = new ConfigFileProvider();

	vscode.window.registerTreeDataProvider('configFiles', configFileProvider);
	vscode.commands.registerCommand('configFiles.refreshConfigFiles', () => configFileProvider.refresh());
	vscode.commands.registerCommand('configFiles.addConfigFile', () => vscode.window.showInformationMessage(`Added new configFile.`));
	vscode.commands.registerCommand('configFiles.editConfigFile', (node: ConfigFile) => vscode.window.showTextDocument(vscode.Uri.file(node.filepath)));
	vscode.commands.registerCommand('configFiles.deleteConfigFile', (node: ConfigFile) => vscode.window.showInformationMessage(`Deleted configFile ${node.label}.`));


	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	vscode.commands.registerCommand('configMate.checkConfigFile', (node: ConfigFile) => configMateProvider.checkConfigFile(node.filepath));
	vscode.commands.registerCommand('configMate.checkConfigFiles', () => configMateProvider.checkAllConfigFiles());
	vscode.commands.registerCommand('configMate.checkRulebook', (node: Rulebook) => configMateProvider.checkRulebook(node.filepath));


	// Text document coordination & decoration
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		console.log(`Saved ${document.fileName}`);
		void vscode.window.showInformationMessage(`Saved ${document.fileName}`);
	});

	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate small numbers
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			borderColor: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			borderColor: 'lightblue'
		}
	});

	// create a decorator type that we use to decorate large numbers
	const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		// use a themable color. See package.json for the declaration and default values.
		backgroundColor: { id: 'myextension.largeNumberBackground' }
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /\d+/g;
		const text = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			if (match[0].length < 3) {
				smallNumbers.push(decoration);
			} else {
				largeNumbers.push(decoration);
			}
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
		activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
	}

	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

}