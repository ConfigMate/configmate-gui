import * as vscode from 'vscode';

const tokenTypes = ['class', 'interface', 'enum', 'function', 'variable'];
const tokenModifiers = ['declaration', 'definition'];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

export class SemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	private ranges: vscode.Range[] = [];
	private _onDidChangeSemanticTokens: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	readonly onDidChangeSemanticTokens?: vscode.Event<void> = this._onDidChangeSemanticTokens.event;

	trigger = async (doc: vscode.TextDocument, ranges: vscode.Range[]): Promise<void> => {
		// console.table(ranges);
		this.ranges = ranges;
		await this.provideDocumentSemanticTokens(doc);
		this._onDidChangeSemanticTokens.fire();
	}

	provideDocumentSemanticTokens(doc: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
		if (!doc) return;
		// analyze the document and return semantic tokens

		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		
		
		this.ranges.map(range => {
			const token = this.makeToken(range);
			tokensBuilder.push(
				token[0] as vscode.Range, 
				token[1] as string, 
				token[2] as string[]);
		});
		
		return tokensBuilder.build();
	}

	private makeToken = (range: vscode.Range) => [range, 'class', ['declaration']];
}

const selector = { language: 'json', scheme: 'file' }; // register for all json documents from the local file system

export const getSemanticTokensProvider = (): SemanticTokensProvider => {
	const provider = new SemanticTokensProvider();
	vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);
	return provider;
}
