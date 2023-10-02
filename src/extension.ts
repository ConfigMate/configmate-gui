'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { RulebookFileProvider, RulebookFile } from './rulebooks';
import { ConfigFileProvider, ConfigFile } from './configFiles';
import { ConfigMateProvider } from './configMate';
import {Rulebook} from './models';

export function activate(context: vscode.ExtensionContext) {
	
	const rulebookFileProvider = new RulebookFileProvider();
	vscode.window.createTreeView('rulebooks', { treeDataProvider: rulebookFileProvider });

	const configFileProvider = new ConfigFileProvider();
	vscode.window.createTreeView('configFiles', { treeDataProvider: configFileProvider });

	// ConfigMate CLI coordination
	const mockProgramPath = path.join(context.extensionPath, 'bin', 'ConfigMate');
	const configMateProvider = new ConfigMateProvider(mockProgramPath);

	context.subscriptions.push(
		vscode.commands.registerCommand('rulebooks.openRulebook', (rulebookPath: string, rulebook: Rulebook) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(rulebookPath));
			configFileProvider.refresh(rulebook.Files);
		}),
		vscode.commands.registerCommand('rulebooks.refreshRulebooks', () => 
			rulebookFileProvider.refresh()
		),

		vscode.commands.registerCommand('configFiles.openConfigFile', (filePath: string) => {
			void vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
		}),
		vscode.commands.registerCommand('configFiles.refreshConfigFiles', (rulebook: Rulebook) => 
			configFileProvider.refresh(rulebook.Files)
		),

		vscode.commands.registerCommand('configMate.checkConfigFile', (node: ConfigFile) => 
			configMateProvider.checkConfigFile(node.filepath)
		),

		vscode.commands.registerCommand('rulebooks.addRulebook', async () => {
			const uri = await vscode.window.showSaveDialog({ saveLabel: 'Create Rulebook', filters: { 'JSON': ['json'] } });
			if (uri) {
				try {
					const rulebook: Rulebook = {
						"Name": "Rulebook name",
						"Description": "Rulebook description",
						"Files": [
							"D:\\KT\\Projects\\Go\\src\\configmate\\configmate\\.github\\events\\bump_version_patch.json"
						],
						"Rules": [
							{
								"Description": "Rule description",
								"CheckName": "Name of check to run",
								"Args": "Arguments to pass to check"
							}
						]
					};
					const contentAsUint8Array = Buffer.from(JSON.stringify(rulebook, null, 4));
					await vscode.workspace.fs.writeFile(uri, contentAsUint8Array);
					rulebookFileProvider.refresh();
					void vscode.window.showInformationMessage(`Added new rulebook ${uri.fsPath}.`);
				} catch (error) {
					void vscode.window.showErrorMessage(`Error creating rulebook: ${error}`);
				}
			}
		}),

		vscode.commands.registerCommand('rulebooks.deleteRulebook', async (node: RulebookFile) => {
			const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete rulebook ${node.label}?`, { modal: true }, 'Delete');
			if (confirm === 'Delete') {
				try {
					const uri = vscode.Uri.file(node.filepath);
					await vscode.workspace.fs.delete(uri, { recursive: true });
					rulebookFileProvider.refresh();
					void vscode.window.showInformationMessage(`Deleted rulebook ${node.label}.`);
				} catch (error) {
					void vscode.window.showErrorMessage(`Error deleting rulebook: ${error as string}`);
				}
			}
		}),
		vscode.commands.registerCommand('configFiles.addConfigFile', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'Enter the name of the new config file' });
			if (name) {
				try {
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (workspaceFolders) {
						const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, name);
						await vscode.workspace.fs.writeFile(uri, new Uint8Array()); // Adjust content as needed
						// configFileProvider.refresh();
						void vscode.window.showInformationMessage(`Added new config file ${name}.`);
					}
				} catch (error) {
					void vscode.window.showErrorMessage(`Error creating config file: ${error as string}`);
				}
			}
		}),
		vscode.commands.registerCommand('configFiles.deleteConfigFile', async (node: ConfigFile) => {
			const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete config file ${node.label}?`, { modal: true }, 'Delete');
			if (confirm === 'Delete') {
				try {
					const uri = vscode.Uri.file(node.filepath);
					await vscode.workspace.fs.delete(uri, { recursive: true }); // Adjust as needed
					// configFileProvider.refresh();
					void vscode.window.showInformationMessage(`Deleted config file ${node.label}.`);
				} catch (error) {
					void vscode.window.showErrorMessage(`Error deleting config file: ${error as string}`);
				}
			}
		})
	);

}