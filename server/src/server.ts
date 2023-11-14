import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind,
	DidChangeConfigurationParams,
	InitializeResult,
	DidChangeConfigurationNotification,
	Connection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import path = require('path');
import { spawn, ChildProcess } from 'child_process';
import { DiagnosticManager } from './diagnostics';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let diagnosticManager: DiagnosticManager;

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let antlrProcess: ChildProcess | null = null;
let isShuttingDown = false;
const maxRestartAttempts = 3;
let restartAttempts = 0;

function startAntlrProcess(connection: Connection) {
	if (isShuttingDown || restartAttempts >= maxRestartAttempts) return;

	const cliPath = path.resolve(__dirname, '../../configmate');
	antlrProcess = spawn(
		'./bin/configm', 
		['serve'], 
		{ 
			cwd: cliPath, 
			detached: true, 
			shell: true
		}
	);

	antlrProcess?.stdout?.on('data', (data) => {
		// connection.console.log(data as string);
	});

	antlrProcess?.stderr?.on('data', (data) => {
		connection.console.error(`ANTLR CLI error: ${data as string}`);
	});

	antlrProcess.on('close', (code) => {
		connection.console.log(`ANTLR CLI process exited with code ${code as number}`);
		restartAttempts++;
		if (!isShuttingDown && restartAttempts < maxRestartAttempts)
			startAntlrProcess(connection);
	});
}

function cleanUpAntlrProcess() {
	if (antlrProcess && !antlrProcess.killed && antlrProcess.pid) {
		process.kill(-antlrProcess.pid, 'SIGKILL');
		antlrProcess.on('close', () => {
			antlrProcess = null;
		});
	}
}

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	diagnosticManager = new DiagnosticManager(
		connection, 
		hasConfigurationCapability, 
		hasWorkspaceFolderCapability, 
		hasDiagnosticRelatedInformationCapability
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		}
	}

	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		void connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log(`Workspace folder change: 
				${_event.added.length} added,
				${_event.removed.length} removed}`);
		});
	}

	isShuttingDown = false;
	restartAttempts = 0;
	startAntlrProcess(connection);
});

connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {
	if (hasConfigurationCapability) {
		diagnosticManager.clearDocumentSettings();
	} else {
		diagnosticManager.updateGlobalSettings(change);
	}

	documents.all().forEach((doc) => void diagnosticManager.validateTextDocument(doc));
});


documents.onDidClose(e => diagnosticManager.removeDocumentSettings(e.document.uri));
documents.onDidChangeContent(async (change) => 
	await diagnosticManager.validateTextDocument(change.document)
);
connection.onDidChangeWatchedFiles(_change => connection.console.log(`File change: ${_change.changes[0].uri}`));

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		connection.console.log(`${_textDocumentPosition.textDocument.uri}}`);

		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

connection.onShutdown(() => {
	isShuttingDown = true;
	cleanUpAntlrProcess();
});

connection.onExit(() => {
	isShuttingDown = true;
	cleanUpAntlrProcess();
});

documents.listen(connection);
connection.listen();
