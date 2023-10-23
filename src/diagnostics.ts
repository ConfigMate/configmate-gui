'use strict'; 

import * as vscode from 'vscode';
import { getSemanticTokensProvider } from './semantics';

export class DiagnosticsProvider {
	timeout: NodeJS.Timer | undefined = undefined;
	smallNumberDecorationType!: vscode.TextEditorDecorationType;
	largeNumberDecorationType!: vscode.TextEditorDecorationType;
	activeEditor: vscode.TextEditor | undefined = undefined;
	semanticTokensProvider: vscode.DocumentSemanticTokensProvider | undefined = undefined;

	constructor() {
		this.semanticTokensProvider = getSemanticTokensProvider();
	}


}