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
	DidChangeConfigurationNotification
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticManager } from './diagnostics';
import { ConfigMateManager } from './configmate';

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
		hasConfigurationCapability, 
		hasWorkspaceFolderCapability, 
		hasDiagnosticRelatedInformationCapability
	);

	configMateManager = new ConfigMateManager(connection);

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

// This handler provides the initial list of the code completion suggestions.
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
	configMateManager.handleShutdown();
});

connection.onExit(() => {
	configMateManager.handleShutdown();
});

documents.listen(connection);
connection.listen();
