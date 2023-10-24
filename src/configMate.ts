'use strict';

import * as vscode from 'vscode';
import { cmResponse, cmRequest } from './models';
import axios from 'axios';
import * as cp from 'child_process';
import { DiagnosticsProvider } from './diagnostics';

export class ConfigMateProvider {

	private cliPath: string;
	private diagnosticsProvider: DiagnosticsProvider;

	constructor(cliPath: string, diagnosticsProvider: DiagnosticsProvider) {
		this.cliPath = cliPath;
		this.diagnosticsProvider = diagnosticsProvider;
	}

	checkConfigFile = async (filepath: string): Promise<cmResponse> => {
		const message = `Checking ${filepath} with ConfigMate`;
		console.log(message);
		void vscode.window.showInformationMessage(message);
		return await this.sendRequest(filepath);
	};

	async sendRequest(filepath: string): Promise<cmResponse> {
		const url: string = 'http://localhost:8080/api/check';
		const request: cmRequest = {
			rulebook: filepath
		};

		await axios({
			method: 'post',
			url: url,
			data: request
		}).then((response) => {
			console.log(response.data);
			return response.data as cmResponse;
		});
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
