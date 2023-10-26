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
		const url: string = 'http://localhost:10007/api/check';
		const request: cmRequest = {
			rulebook_path: filepath
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
		const serverPath = `${context.extensionPath}/configmate`;

		const goServer = cp.exec('go run .', { cwd: serverPath }, 
		(error, stdout, stderr) => {
			if (error) void vscode.window.showErrorMessage(`Error running Go server: ${error.message}`);
			if (stderr) console.error(`stderr: ${stderr}`);
			console.log(stdout);
		});
		
		console.log("Go server running!");
		
		return { dispose: () => goServer.kill()	};
	};
}
