import * as vscode from 'vscode';
import { cmResponse, cmRequest } from './models';
import axios from 'axios';
import * as cp from 'child_process';

export class ConfigMateProvider {
	check = async (filepath: string): Promise<cmResponse> => {
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

		const goServer = cp.exec('go run ConfigMate.go', { cwd: serverPath }, 
		(error, stdout, stderr) => {
			if (error) {
				void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
				return { dispose: () => goServer.kill() };
			}
			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);
		});
		
		console.log("Go server running!");
		
		return { dispose: () => goServer.kill()	};
	};
}
