import * as vscode from 'vscode';
import { cmResponse, cmRequest, Spec, Config } from './models';
import axios from 'axios';
import { SpecFile } from './specFiles';
import { DiagnosticsProvider } from './configDiagnostics';
import path = require('path');

export class ConfigMateProvider {
	constructor(
		context: vscode.ExtensionContext,
		private diagnosticsProvider: DiagnosticsProvider
	) {
		context.subscriptions.push(
			vscode.commands.registerCommand('configMate.check',
				async (node: SpecFile) => {
					const response = await this.check(node.filepath);
					if (!response) return;
					// console.log(response);
					const failed = (response.spec_error === null) ? false : true;
					if (failed) {
						const { spec_error } = response;
						const { analyzer_msg, error_msgs } = spec_error;
						await vscode.window.showErrorMessage(
							`ConfigMate could not check configs:\n
							${analyzer_msg}: ${error_msgs[0]}`
						);
						return; 
					}
					else await diagnosticsProvider.parseResponse(response.check_results);
				}
			)
		);
	}

	check = async (filepath: string): Promise<cmResponse> => {
		try {
			return Promise.resolve(this.sendRequest(filepath));
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
	};

	async sendRequest(filepath: string): Promise<cmResponse> {
		const url: string = 'http://localhost:10007/api/analyze_spec';
		const uri = vscode.Uri.file(filepath);
		const content = await this.readFile(uri);
		const request: cmRequest = {
			spec_file_path: filepath,
			spec_file_content: content
		};

		try {
			const response = await axios({
				method: 'post',
				url: url,
				data: request
			});

			return Promise.resolve(response.data as cmResponse);
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
	}

	readFile = async (uri: vscode.Uri): Promise<number[]> => {
		const file = await vscode.workspace.fs.readFile(uri);
		const buffer = Buffer.from(file);
		return Array.from(buffer);
	}

	createSpecFile = async (uri: vscode.Uri): Promise<null> => {
		// create empty file
		// TODO: add template for new specFiles
		try {
			await vscode.workspace.fs.writeFile(uri, Buffer.from([]));
		} catch (error) {
			console.error(`Error creating specFile: ${error as string}`);
			return Promise.reject(error);
		}
	}

	parseSpecFile = async (uri: vscode.Uri): Promise<Spec> => {
		const pattern = /\b(config)\b(: ")([A-Za-z0-9/_.]+)(" )\b(?:json|toml)\b$/g;
		const file = await vscode.workspace.openTextDocument(uri);
		const filename = file.fileName;
		const numLines = file.lineCount;
		const matches: Config[] = [];
		for (let i = 0; i < numLines; i++) {
			const line = file.lineAt(i).text;
			const match = pattern.exec(line);
			const filepath = match ? match[3] : '';
			// const absPath = path.join(path.dirname(filename), filepath);
			// console.log(absPath);

			if (match) matches.push({
				// convert to absolute path
				path: filepath,
				format: match[5]
			});
		}
		if (!matches.length) console.error("Config filepath unrecognized.");
		return this.getSpecFromContents(filename, matches);
	}

	getSpecFromContents = async (filepath: string, matches: Config[]): Promise<Spec> => {
		const filename = path.basename(filepath);
		const spec: Spec = {
			name: filename,
			description: filepath,
			files: [...matches]
		};
		
		return Promise.resolve(spec);
	}

	getSpecFromUri = async (uri?: vscode.Uri): Promise<Spec> => {
		const mock = {
			"name": "specFile name",
			"description": "specFile description",
			"files": [
				{
					"path": "./examples/configurations/config0.json",
					"format": "json"
				}
			]
		}; 
		if (!uri) return Promise.resolve(mock as Spec);
		return this.parseSpecFile(uri);
	}
}
