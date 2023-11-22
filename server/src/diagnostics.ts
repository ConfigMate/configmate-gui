import {
	Connection,
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationParams,
	TextDocuments
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
// import { analyzeSpec } from './api';
import { TokenResponse } from './models';

interface ServerSettings {
	settings: {
		configMateServer: ConfigMateSettings;
	};
}

export interface ConfigMateSettings {
	maxNumberOfProblems: number;
	port: number;
	trace: {
		server: 'off' | 'messages' | 'verbose';
	};
}

const defaultSettings: ConfigMateSettings = {
	maxNumberOfProblems: 1000,
	port: 10006,
	trace: {
		server: 'verbose'
	}
};

export class DiagnosticManager {
	private globalSettings: ConfigMateSettings = defaultSettings;
	private documentSettings: Map<string, Thenable<ConfigMateSettings>> = new Map();
	private settings: ConfigMateSettings = defaultSettings;

	constructor(
		private connection: Connection,
		private readonly documents: TextDocuments<TextDocument>,
		private readonly hasConfigurationCapability: boolean,
		private readonly hasDiagnosticRelatedInformationCapability: boolean
	) {
		documents.onDidClose(e => this.removeDocumentSettings(e.document.uri));
		documents.onDidChangeContent((change) => this.validate(change.document));
		documents.listen(connection);
	}

	public async validate(textDocument: TextDocument): Promise<void> {
		// if (this.hasConfigurationCapability)
		// 	this.settings = await this.getDocumentSettings(textDocument.uri);

		// const text = textDocument.getText();
		// let problems = 0;
		// const diagnostics: Diagnostic[] = [];
		// const tokenResponse: TokenResponse = await analyzeSpec(text);
		// if (!tokenResponse) return;
		// console.log(tokenResponse);

		// for (const token of tokenResponse.semantic_tokens) {
		// 	if (problems >= this.settings.maxNumberOfProblems) break;
		// 	problems++;
		// 	const diagnostic: Diagnostic = {
		// 		code: '',
		// 		severity: DiagnosticSeverity.Information,
		// 		range: {
		// 			start: {line: token.line, character: token.column},
		// 			end: { line: token.line, character: token.column + token.length }
		// 		},
		// 		message: 'token.text',
		// 		source: 'ConfigMate'
		// 	};
		// 	if (this.hasDiagnosticRelatedInformationCapability) {
		// 		/* diagnostic.relatedInformation.push({
		// 				location: {
		// 					uri: textDocument.uri,
		// 					range: Object.assign({}, diagnostic.range)
		// 				},
		// 				message: 'Spelling matters'
		// 		}) */
		// 	}
		// 	diagnostics.push(diagnostic);
		// }

		// return this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

	// -------------- SETTINGS ----------------- //

	private async getDocumentSettings(resource: string): Promise<ConfigMateSettings> {
		if (!this.hasConfigurationCapability) return Promise.resolve(this.globalSettings);

		let result = await this.documentSettings.get(resource);
		if (!result) {
			const config = this.connection.workspace.getConfiguration({
				scopeUri: resource,
				section: 'configMateServer'
			});
			this.documentSettings.set(resource, config);
			result = await this.documentSettings.get(resource);
		}
		return result;
	}
	public clearDocumentSettings = () => this.documentSettings.clear();
	public removeDocumentSettings = (resource: string) =>
		this.documentSettings.delete(resource);
	public updateGlobalSettings = (change: DidChangeConfigurationParams) => {
		const { settings } = <ServerSettings>change;
		this.globalSettings = settings.configMateServer || defaultSettings;
	}
}
