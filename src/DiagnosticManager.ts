import * as vscode from 'vscode';

export class DiagnosticManager {
	timeout: NodeJS.Timer | undefined = undefined;
	smallNumberDecorationType!: vscode.TextEditorDecorationType;
	largeNumberDecorationType!: vscode.TextEditorDecorationType;
	activeEditor: vscode.TextEditor | undefined = undefined;

	constructor(context: vscode.ExtensionContext) {
		// this.createDecorators();
		// this.activeEditor = vscode.window.activeTextEditor;
		// this.watchForChanges(context);
	}

	createDecorators (): void {
		this.smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
			borderWidth: '1px',
			borderStyle: 'solid',
			overviewRulerColor: 'blue',
			overviewRulerLane: vscode.OverviewRulerLane.Right,
			light: {
				// this color will be used in light color themes
				borderColor: 'darkblue'
			},
			dark: {
				// this color will be used in dark color themes
				borderColor: 'lightblue'
			}
		});

		this.largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
			cursor: 'crosshair',
			// use a themable color. See package.json for the declaration and default values.
			backgroundColor: { id: 'myextension.largeNumberBackground' }
		});
	}


	updateDecorations = (): void => {
		if (!this.activeEditor) return;
		const regEx = /\d+/g;
		const text = this.activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			const startPos = this.activeEditor.document.positionAt(match.index);
			const endPos = this.activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			if (match[0].length < 3) smallNumbers.push(decoration);
			else largeNumbers.push(decoration);
		}
		this.activeEditor.setDecorations(this.smallNumberDecorationType, smallNumbers);
		this.activeEditor.setDecorations(this.largeNumberDecorationType, largeNumbers);
	};

	triggerUpdateDecorations (throttle = false): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
		if (throttle) 
			this.timeout = setTimeout(this.updateDecorations, 500);
		else this.updateDecorations();
	}

	watchForChanges (context: vscode.ExtensionContext): void {
		if (this.activeEditor) this.triggerUpdateDecorations();

		vscode.window.onDidChangeActiveTextEditor(editor => {
			this.activeEditor = editor;
			if (editor) this.triggerUpdateDecorations();
		}, null, context.subscriptions);

		vscode.workspace.onDidChangeTextDocument(event => {
			if (this.activeEditor && event.document === this.activeEditor.document)
				this.triggerUpdateDecorations(true);
		}, null, context.subscriptions);
	}
}