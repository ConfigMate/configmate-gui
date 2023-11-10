import * as vscode from 'vscode';
import { cmResponseNode, cmRequest, Rulebook } from './models';
import axios from 'axios';
import { DiagnosticsProvider } from './diagnostics';
import { RulebookFile } from './rulebooks';
import * as toml from 'toml';

export class ConfigMateProvider {
	// private goServer!: cp.ChildProcess;

	constructor(context: vscode.ExtensionContext,
		diagnosticsProvider: DiagnosticsProvider) {

		// const killServer = this.runServer(context);
		context.subscriptions.push(
			vscode.commands.registerCommand('configMate.check',
				async (node: RulebookFile) => {
					const response = await this.check(node.filepath);
					if (!response) return;
					await diagnosticsProvider.parseResponse(response, node);
				}
			)
			// killServer
		);
	}

	check = async (filepath: string): Promise<cmResponseNode[] | null> => {
		try {
			const message = `Checking ${filepath} with ConfigMate`;
			console.log(message);
			//print working directory
			void vscode.window.showInformationMessage(message);
			return await this.sendRequest(filepath);
		} catch (error) {
			console.error(error);
			return null;
		}
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
			rulebook_path: filepath,
		};
		let data: cmResponseNode[] | null = null;

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
			// console.error(error.response.data);
			const currentLocation = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			console.error("Working path: " + currentLocation);
			console.error("Filepath: " + filepath)
			// switch (error.code.status) {
			// 	case 400:
			// 		await vscode.window.showErrorMessage("Invalid request");
			// 		break;
			// 	case 404:
			// 		await vscode.window.showErrorMessage("Go server not running");
			// 		break;
			// }
		}
		return data;
	}

	// runServer = (context: vscode.ExtensionContext) => {
	// 	const serverPath = vscode.Uri.joinPath(context.extensionUri, "configmate");
	// 	const dispose: vscode.Disposable = { dispose: () => this.goServer.kill() };

	// 	this.goServer = cp.exec(`npm run server`, { cwd: serverPath.fsPath},
	// 	(error, stdout, stderr) => {
	// 		if (error) {
	// 			void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
	// 			return dispose;
	// 		}
	// 		if (stdout) console.log(`stdout: ${stdout}`);
	// 		if (stderr) console.error(`stderr: ${stderr}`);
	// 	});


	// 	// console.log("Go server running!");

	// 	return dispose;
	// };

	createRulebook = async (uri: vscode.Uri): Promise<Rulebook> => {
		// use configmate api to create rulebook
		const mock = `name = "Rulebook for config0"
description = "This is a rulebook for config0"

[files.config0]
path = "./examples/configurations/config0.json"
format = "json"

[[rules]]
field = "config0.server.host"
type = "string"
checks = ["eq('localhost')"]
default = "localhost"
notes = """
This is the host that the server will listen on.
"""

[[rules]]
field = "config0.server.port"
type = "int"
checks = ["range(25, 100)"]
default = 80
notes = """
This is the port that the server will listen on.
"""

[[rules]]
field = "config0.server.ssl_enabled"
type = "bool"
checks = ["eq(false)"]
default = false
notes = """
This is whether or not SSL is enabled.
"""`
		// write to file at uri
		try {
			const rulebook = toml.parse(mock) as Rulebook;
			await vscode.workspace.fs.writeFile(uri, Buffer.from(mock));
			return Promise.resolve(rulebook);
		} catch (error) {
			console.error(`Error creating rulebook: ${error as string}`);
			return Promise.reject(error);
		}
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
		if (uri) console.log(uri.fsPath);
		return Promise.resolve(mock as Rulebook);
	}
}
