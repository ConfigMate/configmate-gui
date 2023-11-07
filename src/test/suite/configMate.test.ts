// import * as vscode from 'vscode';
import * as assert from 'assert';
import * as axios from 'axios';
import * as vscode from 'vscode';
import { cmRequest, cmResponseNode } from '../../models';
import { ConfigMateProvider } from '../../configMate';
import { configMateProvider } from '../../extension';

suite('ConfigMate Tests', () => {
	let rulebookFilepath!: string;
	let testWorkspace!: vscode.WorkspaceFolder;
	let mockRequest!: cmRequest;

	suiteSetup(async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		assert.ok(workspaceFolders, "No workspace is open.");
		testWorkspace = workspaceFolders[0];
		const { uri } = testWorkspace;
		rulebookFilepath = vscode.Uri.joinPath(uri, 'config0.cmrb').fsPath;
		mockRequest = {
			rulebook_path: rulebookFilepath
		};
	});

	test('Should be able to access configMate at localhost:10007/api', async () => {
		const url: string = 'http://localhost:10007/api/check';
		let errorThrown = false;
		try {
			const response = await axios.default({
				method: 'post',
				url: url,
				data: mockRequest
			});
			assert.ok(response.data, 'ConfigMate API not found');
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'ConfigMate API not found');
	});

	test('Should send request in correct format', async () => {
		let errorThrown = false;
		try {
			const response = await configMateProvider.sendRequest(rulebookFilepath);
			assert.ok(response as cmResponseNode[], 'Request not sent in correct format');
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Request not sent in correct format');
	});

	test('Should receive response in correct format', async () => {
		let errorThrown = false;
		try {
			const response = await configMateProvider.sendRequest(rulebookFilepath);
			assert.ok(response as cmResponseNode[], 'Response not received in correct format');
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Response not received in correct format');
	});

	// test.skip('Should handle response received in incorrect format', async () => {

	// });

	// test.skip('Should pass filepath of configFile when check button clicked', async () => {

	// });

});