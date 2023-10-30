import * as vscode from 'vscode';

import { RulebookExplorer } from './rulebooks';
import { ConfigFileExplorer } from './configFiles';
import { ConfigMateProvider } from './configMate';
import { DiagnosticsProvider } from './diagnostics';

export let configMateProvider!: ConfigMateProvider;
export let configFileExplorer!: ConfigFileExplorer;
export let diagnosticsProvider!: DiagnosticsProvider;
export let rulebookExplorer!: RulebookExplorer;

export function activate(context: vscode.ExtensionContext): void {
	diagnosticsProvider = new DiagnosticsProvider(context);
	configMateProvider = new ConfigMateProvider(context, diagnosticsProvider);
	rulebookExplorer = new RulebookExplorer(context, configMateProvider);
	configFileExplorer = new ConfigFileExplorer(context, rulebookExplorer);
}