import * as vscode from 'vscode';
import { cmResponse, cmRequest, Spec } from './models';
import axios from 'axios';
import { SpecFile } from './specFiles';
import * as toml from 'toml';
import { DiagnosticsProvider } from './configDiagnostics';

export class ConfigMateProvider {
	mockSpecFile: string = `file: "./examples/configurations/config0.json" json

spec {
    server <type: object> {
        host <
            type: string,
            default: "localhost",
            notes: "This is the host that the server will listen on."
        > ( eq("localhost"); )

        port <
            type: int,
            default: 80,
            notes: "This is the port that the server will listen on."
        > ( range(25, 100); )

        ssl_enabled <
            type: bool,
            default: false,
            notes: "This is whether or not SSL is enabled."
        > ( eq(false); )
    }
    
    dns_servers <
        type: list<string>,
        optional: false,
        notes: "This is a list of DNS servers."
    > ( len().gte(3); )
}
"""`
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
					if (failed) return; // handle failure
					else await diagnosticsProvider.parseResponse(response.check_results);
				}
			)
		);
	}

	check = async (filepath: string): Promise<cmResponse | null> => {
		try {
			// debug logging:
			// const message = `Checking ${filepath} with ConfigMate`;
			// console.log(message);
			// void vscode.window.showInformationMessage(message);
			return await this.sendRequest(filepath);
		} catch (error) {
			console.error(error);
			return null;
		}
	};

	async sendRequest(filepath: string): Promise<cmResponse> {
		const url: string = 'http://localhost:10007/api/analyze_spec';
		const request: cmRequest = {
			spec_file_path: filepath,
		};
		let data: cmResponse | null = null;

		try {
			const response = await axios({
				method: 'post',
				url: url,
				data: request
			});

			// console.log(response.data);
			data = response.data as cmResponse;
		} catch (error) {
			console.error(error);

			const currentLocation = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			console.error("Working path: " + currentLocation);
			console.error("Filepath: " + filepath);
		}
		return data;
	}

	createSpecFile = async (uri: vscode.Uri): Promise<Spec> => {
		// use configmate api to create specFile
		const mock = this.mockSpecFile;
		// write to file at uri
		try {
			const specFile = await this.parseSpecFile();
			await vscode.workspace.fs.writeFile(uri, Buffer.from(mock));
			return Promise.resolve(specFile);
		} catch (error) {
			console.error(`Error creating specFile: ${error as string}`);
			return Promise.reject(error);
		}
	}

	parseSpecFile = async (uri?: vscode.Uri): Promise<Spec> => {
		let fileContents: string = '';
		if (!uri) fileContents = this.mockSpecFile;
		else {
			const file = await vscode.workspace.fs.readFile(uri);
			fileContents = file.toString();
		}
		return this.getSpecFromContents(fileContents);
	}

	getSpecFromContents = async (contents: string): Promise<Spec> => {
		if (!contents) throw new Error('No contents');
		const mock = {
			"name": "specFile name",
			"description": "specFile description",
			"files": [
				{
					"path": "./examples/configurations/config0.json",
					"format": "json"
				}
			],
			"rules": [
				{
					"description": "Rule description",
					"checkName": "Name of check to run",
					"args": "Arguments to pass to check"
				}
			]
		};
		// if (uri) console.log(uri.fsPath);
		return Promise.resolve(mock as Spec);
	}

	getSpecFromUri = async (): Promise<Spec> => {
		const mock = {
			"name": "specFile name",
			"description": "specFile description",
			"files": [
				{
					"path": "./examples/configurations/config0.json",
					"format": "json"
				}
			],
			"rules": [
				{
					"description": "Rule description",
					"checkName": "Name of check to run",
					"args": "Arguments to pass to check"
				}
			]
		}; 
		// if (uri) console.log(uri.fsPath);
		return Promise.resolve(mock as Spec);
	}
}
