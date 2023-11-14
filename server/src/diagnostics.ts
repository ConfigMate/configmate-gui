import { 
	Connection,
	Diagnostic,
	DiagnosticSeverity, 
	DidChangeConfigurationParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface ConfigMateSettings {
	maxNumberOfProblems: number;
	port: number;
}

const defaultSettings: ConfigMateSettings = { 
	maxNumberOfProblems: 1000,
	port: 10006
};

export class DiagnosticManager {
	private globalSettings: ConfigMateSettings = defaultSettings;
	private documentSettings: Map<string, Thenable<ConfigMateSettings>> = new Map();

	constructor(
		private connection: Connection, 
		private hasConfigurationCapability: boolean,
		private hasWorkspaceFolderCapability: boolean,
		private hasDiagnosticRelatedInformationCapability: boolean
	) { }

	public async validateTextDocument(textDocument: TextDocument): Promise<void> {
		let settings: ConfigMateSettings;
		if (this.hasConfigurationCapability)
			settings = await this.getDocumentSettings(textDocument.uri);
		else
			settings = this.globalSettings;

		// Validation logic...
		const text = textDocument.getText();
		const pattern = /\b[A-Z]{2,}\b/g;
		let m: RegExpExecArray | null;
		let problems = 0;
		const diagnostics: Diagnostic[] = [];

		while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
			problems++;
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range: {
					start: textDocument.positionAt(m.index),
					end: textDocument.positionAt(m.index + m[0].length)
				},
				message: `${m[0]} is all uppercase.`,
				source: 'ex'
			};
			if (this.hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: textDocument.uri,
							range: Object.assign({}, diagnostic.range)
						},
						message: 'Spelling matters'
					},
					{
						location: {
							uri: textDocument.uri,
							range: Object.assign({}, diagnostic.range)
						},
						message: 'Particularly for names'
					}
				];
			}
			diagnostics.push(diagnostic);
		}

		return this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

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

	public clearDocumentSettings(): void {
		this.documentSettings.clear();
	}

	public removeDocumentSettings(resource: string): void {
		this.documentSettings.delete(resource);
	}

	public updateGlobalSettings(change: DidChangeConfigurationParams): void {
		this.globalSettings = <ConfigMateSettings>(
			change.settings.configMateServer || defaultSettings
		);
	}
}
