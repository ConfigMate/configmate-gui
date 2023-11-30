import {
	Connection,
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationParams,
	TextDocuments
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeSpec } from './api';
import { Token, TokenLocation } from './models';

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
	private readonly hasConfigurationCapability: boolean;

	constructor(
		private readonly connection: Connection,
		documents: TextDocuments<TextDocument>,
		hasConfigurationCapability: boolean,
	) {
		this.hasConfigurationCapability = hasConfigurationCapability;

		documents.onDidClose(e => this.removeDocumentSettings(e.document.uri));
		documents.onDidChangeContent((change) => {
			try {
				return Promise.resolve(this.validate(change.document));
			} catch (error) {
				console.error(error);
				return Promise.reject(error);
			}
		});
		documents.listen(connection);
	}

	public async validate(textDocument: TextDocument): Promise<void> {
		if (this.hasConfigurationCapability)
			this.settings = await this.getDocumentSettings(textDocument.uri);

		const text = textDocument.getText();
		const filepath = textDocument.uri;
		let problems = 0;

		const diagnostics: Diagnostic[] = [];
		await this.clearDiagnostics(textDocument.uri);

		const response = await analyzeSpec(filepath, text);
		if (!response || 
			!('spec_error' in response) ||
			response.spec_error == null) return;
		
		console.log(response);
		
		const error = response.spec_error;
		const { error_msgs, token_list  } = error;
		if (!token_list) return;
		
		const length = Math.min(error_msgs.length, token_list.length)
		for (let i = 0; i < length; i++) {
			if (problems >= this.settings.maxNumberOfProblems) break;
			problems++;

			const token = token_list[i];
			const error_msg = error_msgs[i];

			const diagnostic: Diagnostic = this.getDiagnostic(token, error_msg);			
			if (diagnostic != null) diagnostics.push(diagnostic);
		}
		
		return this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

	// ------------------------------ DIAGNOSTICS ------------------------------ //

	private getDiagnostic(token: Token, error_msg: string): Diagnostic {

		const location: TokenLocation = token.location;
		const { start, end } = location;

		/* DEBUGGING
		console.log(`Error parsing .cms file:
			Analyzer message: ${analyzer_msg}
			Error message: ${error_msg}
			Token location: ${JSON.stringify(location)}`)
		*/

		const diagnostic: Diagnostic = {
			code: '',
			message: error_msg || 'ConfigMate error',
			range: { 
				start: { line: start.line, character: start.column },
				end: { line: end.line, character: end.column }
			},
			severity: DiagnosticSeverity.Error,
			source: 'ConfigMate'
		};

		return diagnostic;
	}
	public clearDiagnostics = (uri: string) => this.connection.sendDiagnostics({ uri, diagnostics: [] });
				
	// ------------------------------ SETTINGS ------------------------------ //

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
