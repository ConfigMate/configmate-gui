import * as vscode from 'vscode';
import { cmResponseNode, cmRequest } from './models';
import axios from 'axios';
import * as cp from 'child_process';

export class ConfigMateProvider {
	check = async (filepath: string): Promise<cmResponseNode[]> => {
		const message = `Checking ${filepath} with ConfigMate`;
		console.log(message);
		void vscode.window.showInformationMessage(message);
		const response = await this.sendRequest(filepath);
		// const response = await this.mockRequest(filepath);
		return response;
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

		const goServer = cp.exec(`npm run server`, { cwd: serverPath.fsPath},
		(error, stdout, stderr) => {
			if (error) void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
			if (stderr) console.error(`stderr: ${stderr}`);
			console.log(stdout);
		});

				
		// console.log("Go server running!");
		
		return { dispose: () => {
			goServer.kill();
	}	};
	};
}
