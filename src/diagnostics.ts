'use strict'; 

import * as vscode from 'vscode';
import { getSemanticTokensProvider, SemanticTokensProvider } from './semantics';
import { cmResponseNode, Token } from './models';
import * as utils from './utils';
import { RulebookFile } from './rulebooks';
// import path = require('path');

export class DiagnosticsProvider {
	activeEditor: vscode.TextEditor | undefined = undefined;
	activeDoc: vscode.TextDocument | undefined = undefined;
	semanticTokensProvider: SemanticTokensProvider;
	diagnostics: vscode.DiagnosticCollection;

	constructor(context: vscode.ExtensionContext) {
		this.semanticTokensProvider = getSemanticTokensProvider();
		this.diagnostics = vscode.languages.createDiagnosticCollection('ConfigMate');
		if (vscode.window.activeTextEditor) {
			this.activeEditor = vscode.window.activeTextEditor;
			this.activeDoc = this.activeEditor.document;
			// this.updateDiagnostics(this.activeDoc);
		}

		context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
				if (!editor) return;
				this.activeEditor = editor;
				this.activeDoc = editor.document;
				// if (editor) this.updateDiagnostics(editor.document);
			})
		);
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
				token_list.map(async token => {
					const range = this.parseToken(token);

					const filepath = rulebookFile.getConfigFilePath(token.file);
					this.activeEditor = await utils.openDoc(vscode.Uri.file(filepath));
					this.updateDiagnostics(result_comment, range);
					ranges.push(range);
				});
				// token_list.map(token => ranges.push(this.parseToken(token)));
			}
			
			if (!failed || !ranges) return;
			// open the first failed file
			const config = failed[0].token_list[0].file;
			// const doc = this.activeEditor.document;
			// if (doc) await this.semanticTokensProvider.trigger(doc, ranges);
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
	
	public updateDiagnostics(message: string, range: vscode.Range): void {
		if (this.activeDoc) {
			this.diagnostics.set(this.activeDoc.uri, [{
				code: '',
				message,
				range,
				severity: vscode.DiagnosticSeverity.Error,
				source: 'ConfigMate',
				relatedInformation: [
					new vscode.DiagnosticRelatedInformation(new vscode.Location(this.activeDoc.uri, range), message)
				]
			}]);
		} else {
			this.diagnostics.clear();
		}
	}
}