// import * as vscode from 'vscode';
import * as assert from 'assert';
import * as axios from 'axios';
import { cmRequest, cmResponseNode } from '../../models';

suite('ConfigMate Tests', async () => {

	test('Should be able to access configMate at localhost:10007/api', async () => {
		const url: string = 'http://localhost:10007/api/check';
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
	test('Should send request in correct format', async () => {
		const url: string = 'http://localhost:10007/api/check';
		const request: cmRequest = {
			rulebook_path: 'test'
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

	test('Should receive response in correct format', async () => {
		const url: string = 'http://localhost:10007/api/check';
		const request: cmRequest = {
			rulebook_path: 'test'
		};
		await axios.default({
			method: 'post',
			url: url,
			data: request
		}).then((response) => {
			console.log(response.data);
			assert.ok(response.data as cmResponseNode, 'Request not sent in correct format');
		});
	});

	// test.skip('Should handle response received in incorrect format', async () => {

	// });

	// test.skip('Should pass filepath of configFile when check button clicked', async () => {

	// });

});