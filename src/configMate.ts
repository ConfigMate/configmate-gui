import * as vscode from 'vscode';
import { cmResponse, cmRequest } from './models';
import axios from 'axios';
import * as cp from 'child_process';

export class ConfigMateProvider {
	check = async (filepath: string): Promise<cmResponse> => {
		const message = `Checking ${filepath} with ConfigMate`;
		console.log(message);
		void vscode.window.showInformationMessage(message);
		// const response = await this.sendRequest(filepath);
		const response = await this.mockRequest(filepath);
		return response;
	};

	mockRequest = async (rulebookFilepath: string, configFilepath?: string): Promise<cmResponse> => {
		const mockConfigFiles = await vscode.workspace.findFiles('**/testConfig.json', '**/node_modules/**', 1);
		// const mockRequest: cmRequest = {rulebook: mockRulebook.fsPath};
		if (mockConfigFiles.length < 1) {
			console.error("No mock config files found");
			return {} as cmResponse;
		}
		const mockResponse: cmResponse = {
			passed: false,
			result_comment: "This is a mock response",
			token_list: [
				{
					file: configFilepath || mockConfigFiles[0].fsPath,
					row: 0,
					col: 0,
					length: 22,
				},
				{
					file: configFilepath || mockConfigFiles[0].fsPath,
					row: 3,
					col: 4,
					length: 8,
				}
			]
		};
		return mockResponse;
	};

	async sendRequest(filepath: string): Promise<cmResponse> {
		const url: string = 'http://localhost:10007/api/check';
		const request: cmRequest = {
			rulebook_path: filepath
		};
		let data = {} as cmResponse;

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
		}	

		return data;
	}

	runServer = (context: vscode.ExtensionContext) => {
		const serverPath = vscode.Uri.joinPath(context.extensionUri, "configmate");

		const goServer = cp.exec(`./bin/configm serve`, { cwd: serverPath.fsPath},
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
