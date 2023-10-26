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
