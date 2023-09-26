import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Rulebook } from './models';

export class RulebookManager {
	rulebooks: Rulebook[];
	constructor(rulebooks?: Rulebook[]) {
		this.rulebooks = rulebooks ? rulebooks : [];
	}

	addRulebook(filepath: string): void {
		const rulebook: (Rulebook | undefined) = this.parseRulebook(filepath);
		if (rulebook != undefined) this.rulebooks.push(rulebook);
	}

	parseRulebook(filepath: string): (Rulebook | undefined) {
		const fileContents: string = fs.readFileSync(filepath, 'utf8');
		const fileExtension: string = path.extname(filepath);
		const fileName: string = path.basename(filepath);
		const fileContentsAreValid: boolean = fileContents !== '' && fileContents !== undefined;

		if (!fileExtension || !fileContents || !fileName || !fileContentsAreValid) {
			if (!fileExtension) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid file extension`);
			if (!fileContents) void vscode.window.showErrorMessage(`Rulebook file ${fileName} is empty`);
			if (!fileName) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid file name`);
			return undefined;
		}


		const contents: Rulebook = JSON.parse(fileContents) as Rulebook;
		const { Name, Description, Files, Rules } = contents;
		if (!Name || !Description || !Files || !Rules) {
			if (!Name) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid name`);
			if (!Description) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid description`);
			if (!Files) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid files`);
			if (!Rules) void vscode.window.showErrorMessage(`Rulebook file ${fileName} has no valid rules`);
			return undefined;
		}

		return contents;
	}
}