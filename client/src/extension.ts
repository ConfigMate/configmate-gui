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

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// UI controllers; export these for use in integration tests
	const diagnosticsProvider = new DiagnosticsProvider(context);
	const configMateProvider = new ConfigMateProvider(context, diagnosticsProvider);
	const specFileExplorer = new SpecFileExplorer(context, configMateProvider);
	new ConfigFileExplorer(context, specFileExplorer);

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

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'cms' }],
		synchronize: {
			// Notify the server about file changes to .cms files in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.cms')
		}
	};

	client = new LanguageClient(
		'configMateServer',
		'ConfigMateServer',
		serverOptions,
		clientOptions
	);

	return client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) return undefined;
	return client.stop();
}
