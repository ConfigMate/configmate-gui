import * as vscode from 'vscode';
import { cmResponseNode, cmRequest, Rulebook } from './models';
import axios from 'axios';
import { RulebookFile } from './rulebooks';
import * as toml from 'toml';
import { DiagnosticsProvider } from './configDiagnostics';

export class ConfigMateProvider {
	constructor(
		context: vscode.ExtensionContext, 
		private diagnosticsProvider: DiagnosticsProvider
	) {
		context.subscriptions.push(
			vscode.commands.registerCommand('configMate.check',
				async (node: RulebookFile) => {
					const response = await this.check(node.filepath);
					if (!response) return;
					await diagnosticsProvider.parseResponse(response, node);
				}
			)
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

			const currentLocation = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			console.error("Working path: " + currentLocation);
			console.error("Filepath: " + filepath);
		}
		return data;
	}

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

	getRulebookFromUri = async (uri: vscode.Uri): Promise<Rulebook> => {
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
		// if (uri) console.log(uri.fsPath);
		return Promise.resolve(mock as Rulebook);
	}
}
