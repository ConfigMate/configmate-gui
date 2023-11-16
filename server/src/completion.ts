import {
	Connection,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind
} from 'vscode-languageserver';

export class CodeCompletionManager {
	constructor(connection: Connection) {
		connection.onCompletion(this.initCodeComplete);
		connection.onCompletionResolve(this.handleCompletionResolve);
	}

	// Provides the initial list of the code completion suggestions.
	private initCodeComplete = (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		console.log(_textDocumentPosition);
		// _textDocumentPosition: position in doc in which code complete got requested.
		// Currently ignores this info and always provides the same completion items.
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

	// Resolves additional information for the item selected in the completion list.
	private handleCompletionResolve = (item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
}