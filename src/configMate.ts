import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { Response } from './models';
// import * as path from 'path';

export class ConfigMateProvider {

	private cliPath: string;

	constructor(cliPath: string) {
		this.cliPath = cliPath;
	}

	checkConfigFile(filepath: string): Response {
		console.log(`Executing ${this.cliPath} with ${filepath}`);
		void vscode.window.showInformationMessage(`Executing ${this.cliPath} with ${filepath}`);

		this.logFilePath(filepath);
		return this.sendRequest(filepath);
	}

	logFilePath(filepath: string): void {
		const child = spawn(this.cliPath, [filepath]);

		child.stdout.on('data', (data: string) => {
			console.log(`stdout: ${data}`);
		}); 

		child.stderr.on('data', (data: string) => {
			console.error(`stderr: ${data}`);
		});

		child.on('close', (code: number) => {
			console.log(`child process exited with code ${code}`);
		}); 
		
		child.on('error', (error) => {
			console.error('Spawn Error: ', error);
		});

	}

	sendRequest(filepath: string): Response {
		// connect to JSON API & send request
		
		// const request: Request = {
		// 	rulebook: filepath
		// };

		const response: Response = {
			passed: true,
			response_comment: "This is a mock response.",
			token_list: [{
				file: filepath,
				row: 1,
				col: 1,
				length: 1
			}]
		};

		return response;
	}
}
