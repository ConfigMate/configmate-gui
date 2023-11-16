import {
	Connection,
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationParams,
	TextDocuments
} from 'vscode-languageserver/node';
import { Range, TextDocument } from 'vscode-languageserver-textdocument';
import { Token, cmResponseNode } from './models';

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

	constructor(
		private connection: Connection,
		private documents: TextDocuments<TextDocument>,
		private hasConfigurationCapability: boolean,
		private hasDiagnosticRelatedInformationCapability: boolean
	) {
		documents.onDidClose(e => this.removeDocumentSettings(e.document.uri));
		documents.onDidChangeContent((change) => this.validate(change.document));
		documents.listen(connection);
	}

	public async validate(textDocument: TextDocument): Promise<void> {
		let settings: ConfigMateSettings;
		if (this.hasConfigurationCapability)
			settings = await this.getDocumentSettings(textDocument.uri);
		else
			settings = this.globalSettings;

		// Find problems using validation logic...
		const text = textDocument.getText();
		const pattern = /\b[A-Z]{2,}\b/g;
		let m: RegExpExecArray | null;
		let problems = 0;
		const diagnostics: Diagnostic[] = [];

		// iterate until the entire document is parsed or max problems reached
		while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
			problems++;

			// create a diagnostic object for each problem found
			const diagnostic: Diagnostic = {
				code: '', // for code actions
				severity: DiagnosticSeverity.Warning,
				range: {
					start: textDocument.positionAt(m.index),
					end: textDocument.positionAt(m.index + m[0].length)
				},
				message: `${m[0]} is all uppercase.`,
				source: 'ConfigMate'
			};
			if (this.hasDiagnosticRelatedInformationCapability) {
				/* diagnostic.relatedInformation.push({
						location: {
							uri: textDocument.uri,
							range: Object.assign({}, diagnostic.range)
						},
						message: 'Spelling matters'
				}) */
			}
			diagnostics.push(diagnostic);
		}

		return this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

	private parseToken(token: Token): Range {
		const { start: _start, end: _end } = token.location;
		return {
			start: {
				line: _start.line - 1,
				character: _start.column - 1
			},
			end: {
				line: _end.line - 1,
				character: _end.column
			}
		};
	}

	private parseResponse = (response: cmResponseNode[]): Diagnostic[] => {
		try {
			const diagnostics: Diagnostic[] = [];
			const failed = response.filter(node => !node.passed);
			for (const node of failed) {
				const { result_comment, token_list } = node;
				if (!token_list) continue;
				token_list.map(token => {
					const range = this.parseToken(token);
					const diagnostic = Diagnostic.create(
						range,
						result_comment,
						DiagnosticSeverity.Error,
						'ConfigMate'
					);
					diagnostics.push(diagnostic);
				});
			}
			return diagnostics;
		} catch (error) {
			this.connection.console.error(`Couldn't parse a ConfigMate response: ${error as string}`);
			return [];
		}
	}

	// -------------- SETTINGS ----------------- //

	private async getDocumentSettings(resource: string): Promise<ConfigMateSettings> {
		if (!this.hasConfigurationCapability) return Promise.resolve(this.globalSettings);

		let result = this.documentSettings.get(resource);
		if (!result) {
			result = this.connection.workspace.getConfiguration({
				scopeUri: resource,
				section: 'configMateServer'
			});
			this.documentSettings.set(resource, result);
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
