import * as vscode from 'vscode';
import { Token } from './models';

const tokenTypes = ['class', 'interface', 'enum', 'function', 'variable'];
const tokenModifiers = ['fail', 'pass'];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

export class SemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {

	private _onDidChangeSemanticTokens: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	readonly onDidChangeSemanticTokens?: vscode.Event<void> = this._onDidChangeSemanticTokens.event;

	trigger = async(doc: vscode.TextDocument, tokens: Token[]): Promise<void> => {
		console.table(tokens);
		await this.provideDocumentSemanticTokens(doc);
		this._onDidChangeSemanticTokens.fire();
	}

	provideDocumentSemanticTokens(doc: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
		// analyze the document and return semantic tokens

		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		// on line 1, characters 1-5 are a class declaration
		tokensBuilder.push(
			new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 5)),
			'class',
			['declaration']
		);
		return tokensBuilder.build();
	}

	private convertTokens(passed: boolean, message: string, token: Token) {
		const tokenType = tokenTypes[0];
		const tokenModifier = tokenModifiers[Number(passed)];
		const range = this.convertTokenToRange(token);
		const results = [range, tokenType, tokenModifier];
		// return new vscode.SemanticTokens(results[0], results[1], results[2);
	}

	private convertTokenToRange(token: Token): vscode.Range {
		return new vscode.Range(
			new vscode.Position(token.row, token.col),
			new vscode.Position(token.row, token.col + token.length)
		);
	}

}

const selector = { language: 'json', scheme: 'file' }; // register for all json documents from the local file system

export const getSemanticTokensProvider = (): SemanticTokensProvider => {
	const provider = new SemanticTokensProvider();
	vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);
	return provider;
}