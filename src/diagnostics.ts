'use strict'; 

import * as vscode from 'vscode';
import { getSemanticTokensProvider, SemanticTokensProvider } from './semantics';
import { cmResponseNode, Token } from './models';
import * as utils from './utils';
import { RulebookFile } from './rulebooks';

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

	parseResponse = async (response: cmResponseNode[], rulebookFile: RulebookFile) => {
		try {
			const ranges: vscode.Range[] = [];
			const failed = response.filter(node => !node.passed);
			for (const node of failed) {
				const {result_comment, token_list} = node;
				if (!token_list) continue;
				console.log(node);
				if (result_comment) console.log(`ConfigMate: ${result_comment}`);

				token_list.map(token => ranges.push(this.parseToken(token)));
			}
			
			if (!failed || !ranges) return;
			// open the first failed file
			const config = failed[0].token_list[0].file;
			const filepath = rulebookFile.getConfigFilePath(config);
			this.activeEditor = await utils.openDoc(vscode.Uri.file(filepath));
			const doc = this.activeEditor.document;
			if (doc) await this.semanticTokensProvider.trigger(doc, ranges);
		} catch(error) {
			console.error(error);
			await vscode.window.showWarningMessage(`Couldn't parse a ConfigMate response: ${error as string}`);
		}
	}


	private parseToken(token: Token): vscode.Range {
		// console.table(token.location);
		const { start, end } = token.location;
		return new vscode.Range(
			new vscode.Position(start.line - 1, start.column),
			new vscode.Position(end.line - 1, end.column)
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