import * as vscode from 'vscode';
import * as path from 'path';
import { Rulebook } from './models';
import { DiagnosticManager } from './DiagnosticManager';
import { RulebookFile } from './rulebooks';

export class RulebookManager {
	rulebooks!: Rulebook[];
	rulebookFiles!: RulebookFile[];
	diagnosticProvider!: DiagnosticManager;
	constructor(diagnosticManager: DiagnosticManager) {
		this.rulebooks = [];
		this.rulebookFiles = [];
		this.diagnosticProvider = diagnosticManager;
	}

	addRulebook(newRulebookFile: RulebookFile): void {
		const {filepath} = newRulebookFile;
		this.parseRulebook(filepath)
		.then((rulebook: Rulebook | undefined) => {
			if (rulebook) {
				this.rulebooks.push(rulebook);
				this.rulebookFiles.push(newRulebookFile);
				this.diagnosticProvider.updateDecorations();
			}
		})
		.catch((err: Error) => console.error('Error adding new rulebook: ', err));
	}

}