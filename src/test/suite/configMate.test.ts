import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigFileProvider } from '../../configFiles';
import * as axios from 'axios';
import { RulebookFile } from '../../rulebooks';
import { cmRequest, cmResponse } from '../../models';

suite('ConfigMate Tests', () => {


	const configFileProvider = new ConfigFileProvider();
	const mockRulebook = {
		"Name": "test",
		"Description": "Rulebook description",
		"Files": [
			"d:\\KT\\Projects\\Go\\src\\configmate\\go-server-extension\\src\\testConfig.json"
		],
		"Rules": [
			{
				"Description": "Rule description",
				"CheckName": "Name of check to run",
				"Args": "Arguments to pass to check"
			}
		]
	};


	test.skip('Should be able to access configMate at localhost:8080/api', async () => {	
		const url: string = 'http://localhost:8080/api/check';
		await axios.default({
			method: 'post',
			url: url,
			data: {
				rulebook: 'test'
			}
		}).then((response) => {
			console.log(response.data);
			assert.ok(response.data, 'ConfigMate API not found');
		});
	});
	test.skip('Should send request in correct format', async () => {
		const url: string = 'http://localhost:8080/api/check';
		const request: cmRequest = {
			rulebook: 'test'
		};
		await axios.default({
			method: 'post',
			url: url,
			data: request
		}).then((response) => {
			console.log(response.data);
			assert.ok(response.data, 'Request not sent in correct format');
		});
	});

	test.skip('Should receive response in correct format', async () => {
		const url: string = 'http://localhost:8080/api/check';
		const request: cmRequest = {
			rulebook: 'test'
		};
		await axios.default({
			method: 'post',
			url: url,
			data: request
		}).then((response) => {
			console.log(response.data);
			assert.ok(response.data as cmResponse, 'Request not sent in correct format');
		});
	});

	// test.skip('Should handle response received in incorrect format', async () => {
		
	// });

	// test.skip('Should pass filepath of configFile when check button clicked', async () => {
		
	// });

});