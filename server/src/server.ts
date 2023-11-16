import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	DidChangeConfigurationParams,
	InitializeResult,
	DidChangeConfigurationNotification
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticManager } from './diagnostics';
import { ConfigMateManager } from './configmate';
import { CodeCompletionManager } from './completion';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let diagnosticManager: DiagnosticManager;
let configMateManager: ConfigMateManager;

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

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
		documents,
		hasConfigurationCapability,
		hasDiagnosticRelatedInformationCapability
	);
	configMateManager = new ConfigMateManager(connection);
	new CodeCompletionManager(connection);

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
});

connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {
	if (hasConfigurationCapability) diagnosticManager.clearDocumentSettings();
	else diagnosticManager.updateGlobalSettings(change);

	documents.all().forEach((doc) => void diagnosticManager.validate(doc));
});


connection.onDidChangeWatchedFiles(_change =>
	connection.console.log(`File change: ${_change.changes[0].uri}`)
);

connection.onShutdown(() => configMateManager.handleShutdown());
connection.onExit(() => configMateManager.handleShutdown());
connection.listen();
