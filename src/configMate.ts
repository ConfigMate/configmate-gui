import * as vscode from 'vscode';
import { cmResponse, cmRequest } from './models';
import axios from 'axios';
// import * as path from 'path';

export class ConfigMateProvider {

	private cliPath: string;

	constructor(cliPath: string) {
		this.cliPath = cliPath;
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
}
