import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigFileProvider } from '../../configFiles';
import * as axios from 'axios';
import { RulebookFile } from '../../rulebooks';

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


	test('Should be able to access configMate at localhost:8080/api', async () => {	
		const url: string = 'http://localhost:8080/api';
		await axios.default({
			method: 'get',
			url: url
		}).then((response) => {
			console.log(response.data);
			assert.ok(response.data === 'ConfigMate API', 'ConfigMate API not found');
		});
	});
	// Should send request in correct format
	// Should receive response in correct format
	// Should handle response received in incorrect format
	// Should pass filepath of configFile when 'check' button clicked

});