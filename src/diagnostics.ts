'use strict'; 

import * as vscode from 'vscode';
import { getSemanticTokensProvider, SemanticTokensProvider } from './semantics';
import { cmResponseNode, Token } from './models';
import * as utils from './utils';

export class DiagnosticsProvider {
	activeEditor: vscode.TextEditor | undefined = undefined;
	activeDoc: vscode.TextDocument | undefined = undefined;
	semanticTokensProvider: SemanticTokensProvider;

	constructor() {
		this.semanticTokensProvider = getSemanticTokensProvider();
		vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
			this.activeEditor = editor;
		});
	}

	parseResponse = async (response: cmResponseNode[]) => {
		try {
			this.activeEditor = vscode.window.activeTextEditor;
			this.activeDoc = this.activeEditor?.document;

			for (const node of response) {
				const {passed, result_comment, token_list} = node;
				if (passed || !token_list) continue;
				console.log(node);
				if (result_comment) console.log(`ConfigMate: ${result_comment}`);

				const ranges = token_list.map(token => this.parseToken(token));
				if (this.activeEditor) {
					const doc = this.activeEditor.document;
					if (doc) await this.semanticTokensProvider.trigger(doc, ranges);
				}
			}
		} catch(error) {
			console.error(error);
			await vscode.window.showWarningMessage(`Couldn't parse a ConfigMate response: ${error as string}`);
		}
	}


	private parseToken(token: Token): vscode.Range {
		// console.table(token.location);
		const { start, end } = token.location;
		return new vscode.Range(
			new vscode.Position(start.line, start.column),
			new vscode.Position(end.line, end.column)
		);
	}
} 
/*
cmResponse {
	passed: boolean,
	result_comment: string,
	token_list: Token[]
}
Token {
	file: string,
	row: number,
	col: number,
	length: number
}
TextMate Token {
	startIndex: number,
	endIndex: number,
	scopes: string[]
}
vscode Position {
	line: number,
	character: number
}
*/