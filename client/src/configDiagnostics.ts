'use strict'; 

import * as vscode from 'vscode';
import { Check, checkResponseNode, TokenLocation } from './models';
import * as utils from './utils';

export class DiagnosticsProvider {
	diagnostics: vscode.DiagnosticCollection;

	constructor(context: vscode.ExtensionContext) {
		this.diagnostics = vscode.languages.createDiagnosticCollection('ConfigMate');
		context.subscriptions.push(

		);
	}

	parseResponse = async (response: checkResponseNode[]) => {
		try {
			const workspace = vscode.workspace.workspaceFolders?.[0].uri;
			const diags: {[path: string]: vscode.Diagnostic[]} = {};

			for (const node of response) {
				const {status, result_comment, field, check_num, token_list} = node;
				if (!status || !token_list) continue;
				const check: Check = field.checks[check_num];

				for (const token of token_list) {
					const uri = vscode.Uri.joinPath(workspace, token.file);
					const filepath = uri.toString();
					const location: TokenLocation = token.location;
					const range = this.parseToken(location);
					await utils.openDoc(uri);
					const diagnostic: vscode.Diagnostic = this.getDiagnostic(uri, range, [result_comment, check.check]);
					if (!diags[filepath]) diags[filepath] = [diagnostic];
					else diags[filepath].push(diagnostic);
				}
				// console.log(node);
				// if (result_comment) console.log(`ConfigMate: ${result_comment}`);
				// let last_filepath: vscode.Uri;
			}
			for (const filepath of Object.keys(diags)) {
				const uri = vscode.Uri.parse(filepath);
				if (!uri) continue;
				this.setDiagnostics(uri, diags[filepath]);
			}
		} catch (error) {
			console.error(error);
			await vscode.window.showWarningMessage(`Couldn't parse a ConfigMate response: ${error as string}`);
		}
	}


	private parseToken(token: TokenLocation): vscode.Range {
		// console.table(token.location);
		const { start, end } = token;
		return new vscode.Range(
			new vscode.Position(start.line - 1, start.column),
			new vscode.Position(end.line - 1, end.column)
		);
	}
	
	private getDiagnostic(uri: vscode.Uri, range: vscode.Range, messages: string[]): vscode.Diagnostic {
		return {
			code: '',
			message: messages[0] || 'ConfigMate error',
			range,
			severity: vscode.DiagnosticSeverity.Error,
			source: 'ConfigMate',
			relatedInformation: [
				new vscode.DiagnosticRelatedInformation(
					new vscode.Location(uri, range), 
					messages[1] || 'ConfigMate error'
				)
			]
		};
	}

	private setDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
		this.diagnostics.set(uri, diagnostics);
	}

	private clearDiagnostics(): void {
		this.diagnostics.clear();
	}
}