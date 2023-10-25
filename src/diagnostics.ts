'use strict'; 

import * as vscode from 'vscode';
import { getSemanticTokensProvider, SemanticTokensProvider } from './semantics';
import { cmResponse } from './models';
import * as utils from './utils';

export class DiagnosticsProvider {
	activeEditor: vscode.TextEditor | undefined = undefined;
	semanticTokensProvider: SemanticTokensProvider;

	constructor() {
		this.semanticTokensProvider = getSemanticTokensProvider();
		vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
			this.activeEditor = editor;
		});
	}

	parseResponse = async (response: cmResponse) => {
		const {token_list} = response;
		const filepath = token_list[0].file;
		const uri = vscode.Uri.file(filepath);
		await utils.openDoc(uri);
		if (this.activeEditor) {
			const doc = this.activeEditor.document;
			if (doc) await this.semanticTokensProvider.trigger(doc, token_list);
		}
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