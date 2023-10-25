'use strict';

import * as vscode from 'vscode';
import { cmResponse, cmRequest } from './models';
import axios from 'axios';
import * as cp from 'child_process';

export class ConfigMateProvider {
	apiUrl: string = 'http://localhost:8080/api/check';

	constructor(private cliPath: string) {}

	checkConfigFile = async (filepath: string): Promise<cmResponse> => {
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

	sendRequest = async(rulebookFilepath: string): Promise<cmResponse> => {
		const request: cmRequest = {
			rulebook: rulebookFilepath
		};
		try {
			await axios({
				method: 'post',
				url: this.apiUrl,
				data: request
			}).then((response) => {
				console.log(response.data);
				return response.data as cmResponse;
			});
		} catch(error) {
			console.error(error);
		}
		return {} as cmResponse;
	}

	runServer = (context: vscode.ExtensionContext) => {
		const serverPath = `${context.extensionPath}/bin`;

		const goServer = cp.exec('go run ConfigMate.go', {
			cwd: serverPath // Set the working directory
		}, (error, stdout, stderr) => {
			if (error) {
				void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
				return;
			}
			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);
		});


		// On VS Code close, close the Go server
		context.subscriptions.push({
			dispose: () => {
				goServer.kill();
			}
		});

		console.log("Go server running!");
	};
}
