import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { DiagnosticsProvider } from './configDiagnostics';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import { SpecFileExplorer } from './specFiles';
import { ConfigFileExplorer } from './configFiles';
import { ConfigMateProvider } from './configMate';

export let configMateProvider!: ConfigMateProvider;
export let configFileExplorer!: ConfigFileExplorer;
export let specFileExplorer!: SpecFileExplorer;
export let diagnosticsProvider!: DiagnosticsProvider;

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	diagnosticsProvider = new DiagnosticsProvider(context);
	configMateProvider = new ConfigMateProvider(context, diagnosticsProvider);
	specFileExplorer = new SpecFileExplorer(context, configMateProvider);
	configFileExplorer = new ConfigFileExplorer(context, specFileExplorer);

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=10006'] }
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'cms' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'configMateServer',
		'ConfigMateServer',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	return client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) return undefined;
	return client.stop();
}
