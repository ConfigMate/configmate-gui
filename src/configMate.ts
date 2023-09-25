import * as vscode from 'vscode';
import { spawn } from 'child_process';
// import * as path from 'path';

export class ConfigMateProvider {
	private cliPath: string;

	constructor(cliPath: string) {
		this.cliPath = cliPath;
	}

	checkConfigFile(filepath: string): void {
		console.log(`Executing ${this.cliPath} with ${filepath}`);
		void vscode.window.showInformationMessage(`Executing ${this.cliPath} with ${filepath}`);

		this.logFilePath(filepath);
	}

	checkAllConfigFiles(): void {
		// get all ConfigFile nodes
		// for each node, call checkConfigFile
	}

	checkRulebook(filepath: string): void {
		console.log(`Executing ${this.cliPath} with ${filepath}`);
		void vscode.window.showInformationMessage(`Executing ${this.cliPath} with ${filepath}`);

		this.logFilePath(filepath);
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
}
