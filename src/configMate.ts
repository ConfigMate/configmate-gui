import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

export class ConfigMateProvider {
	private cliPath: string;

	constructor(cliPath: string) {
		this.cliPath = cliPath;
	}

	runCommand(filePath: string): void {
		console.log(`Executing ${this.cliPath} with ${filePath}`);

		const child = spawn(this.cliPath, [filePath]);

		child.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		}); 

		child.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});

		child.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		}); 
		
		child.on('error', (error) => {
			console.error('Spawn Error: ', error);
		});

	}
}
