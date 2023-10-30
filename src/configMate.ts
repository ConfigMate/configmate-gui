import * as vscode from 'vscode';
import { cmResponseNode, cmRequest, Rulebook } from './models';
import axios from 'axios';
import * as cp from 'child_process';
import { DiagnosticsProvider } from './diagnostics';
import { RulebookFile } from './rulebooks';

export class ConfigMateProvider {
	private goServer!: cp.ChildProcess;

	constructor(context: vscode.ExtensionContext, 
		diagnosticsProvider: DiagnosticsProvider) {

		context.subscriptions.push(
			vscode.commands.registerCommand('configMate.check',
				async (node: RulebookFile) => {
					const response = await this.check(node.filepath);
					await diagnosticsProvider.parseResponse(response, node);
				}),
			this.runServer(context)
		);
	}

	check = async (filepath: string): Promise<cmResponseNode[]> => {
		if (!this.goServer) {
			await vscode.window.showErrorMessage("Go server not running");
			return {} as cmResponseNode[];
		}
		const message = `Checking ${filepath} with ConfigMate`;
		console.log(message);
		void vscode.window.showInformationMessage(message);
		return await this.sendRequest(filepath);
	};

	mockRequest = async (rulebookFilepath: string, configFilepath?: string): Promise<cmResponseNode> => {
		const mockConfigFiles = await vscode.workspace.findFiles('**/testConfig.json', '**/node_modules/**', 1);
		// const mockRequest: cmRequest = {rulebook: mockRulebook.fsPath};
		if (mockConfigFiles.length < 1) {
			console.error("No mock config files found");
			return {} as cmResponseNode;
		}
		const mockResponse: cmResponseNode = {
			passed: false,
			result_comment: "This is a mock response",
			token_list: [
				{
					file: configFilepath || mockConfigFiles[0].fsPath,
					location: {
						start: {
							column: 0,
							line: 0,
						},
						end: {
							column: 17,
							line: 5
						}
					}
				}
			]
		};
		return mockResponse;
	};

	async sendRequest(filepath: string): Promise<cmResponseNode[]> {
		const url: string = 'http://localhost:10007/api/check';
		const request: cmRequest = {
			rulebook_path: filepath
		};
		let data = [{}] as cmResponseNode[];

		try {
			const response = await axios({
				method: 'post',
				url: url,
				data: request
			});

			console.log(response.data);
			data = response.data as cmResponseNode[];
		} catch (error) {
			console.error(error);
		}	

		return data;
	}

	runServer = (context: vscode.ExtensionContext) => {
		const serverPath = vscode.Uri.joinPath(context.extensionUri, "configmate");

		this.goServer = cp.exec(`./bin/configm serve`, { cwd: serverPath.fsPath},
		(error, stdout, stderr) => {
			if (error) void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);
		});

				
		// console.log("Go server running!");
		
		return { dispose: () => {
			this.goServer.kill();
	}	};
	};

	createRulebook = async (uri: vscode.Uri): Promise<void> => {
		// use configmate api to create rulebook
	}

	getRulebook = async (uri: vscode.Uri): Promise<Rulebook> => {
		// use configmate api to get rulebook
		const mock = {
			"name": "Rulebook name",
			"description": "Rulebook description",
			"files": {
				"config0": {
					"path": "./examples/configurations/config0.json",
					"format": "json"
				}
			},
			"rules": [
				{
					"description": "Rule description",
					"checkName": "Name of check to run",
					"args": "Arguments to pass to check"
				}
			]
		};
		return Promise.resolve(mock as Rulebook);
	}
}
