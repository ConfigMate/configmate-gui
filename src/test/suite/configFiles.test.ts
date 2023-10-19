import * as vscode from 'vscode';
import * as assert from 'assert';
import * as myExtension from '../../extension';

import { ConfigFile, ConfigFileProvider } from '../../configFiles';
import { RulebookFileProvider, RulebookFile, initRulebook } from '../../rulebooks';
import { Rulebook } from '../../models';

suite('ConfigFile Tests', () => {
	let rulebookFileProvider: RulebookFileProvider;
	let configFileProvider: ConfigFileProvider;
	let mock1: vscode.Uri, mock2: vscode.Uri;
	let testWorkspace: vscode.WorkspaceFolder;
	let mockRulebookFile: RulebookFile;
	let rulebookUri: vscode.Uri, configFileUri: vscode.Uri;
	let rulebookTreeView: vscode.TreeView<RulebookFile>;
	let mockRulebook: Rulebook;

	suiteSetup(async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		assert.ok(workspaceFolders, "No workspace is open.");
		testWorkspace = workspaceFolders[0];

		({ rulebookTreeView, rulebookFileProvider, configFileProvider } = myExtension);

		// Prepare mock RulebookFile
		mockRulebookFile = (await rulebookFileProvider.getChildren())[0];
		mockRulebook = mockRulebookFile.rulebook;
		rulebookUri = vscode.Uri.file(mockRulebookFile.filepath);
		configFileUri = vscode.Uri.file(mockRulebook.Files[0]);

		testWorkspace = vscode.workspace.workspaceFolders![0];

		mock1 = (await vscode.workspace.findFiles('**/mock/test.rulebook.json', '**/node_modules/**', 1))[0];
		mock2 = (await vscode.workspace.findFiles('**/mock/testConfig.json', '**/node_modules/**', 1))[0];
	});

	teardown(async () => {
		// reset the workspace to its original state

		// delete everything in test-workspace, then copy mock files back in
		const files = await vscode.workspace.fs.readDirectory(testWorkspace.uri);
		for (const file of files) {
			const uri = vscode.Uri.joinPath(testWorkspace.uri, file[0]);
			// delete files but not folders
			if (file[1] !== vscode.FileType.Directory)
				await vscode.workspace.fs.delete(uri, { recursive: false });
		}
		await vscode.workspace.fs.copy(mock1, rulebookUri, { overwrite: true });
		await vscode.workspace.fs.copy(mock2, configFileUri, { overwrite: true });
	});


	/*---------------------------------------- BROWSE ----------------------------------------*/

	test('Should retrieve config files on rulebook selection [BROWSE]', async () => {
		let errorThrown = false;
		try {
			await vscode.commands.executeCommand('rulebooks.openRulebook', rulebookUri);
			assert.strictEqual(rulebookTreeView.selection.length > 0, true, 'Rulebook was not selected successfully');

			const configFiles = await configFileProvider.getChildren();
			assert.strictEqual(configFiles.length > 0, true, 'Config files were not retrieved successfully');

		}
		catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Rulebook was not opened');
	});


	/*---------------------------------------- READ ----------------------------------------*/

	test('Should open config file on click [READ]', async () => {
		let errorThrown = false;
		try {
			await vscode.commands.executeCommand('configFiles.openConfigFile', configFileUri.fsPath);
		}
		catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Config file was not opened');
	});
	


	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should update a config file on save [EDIT]', async () => {
		const configUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.json');
		const originalContent = (await vscode.workspace.fs.readFile(configUri)).toString();
		const newContent = `{\n    "new": "content"\n}`;
	
		// Simulate the user editing and saving the file
		const document = await vscode.workspace.openTextDocument(configUri);
		const editor = await vscode.window.showTextDocument(document);
		await editor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 0), newContent);
		});
		await document.save();
	
		const updatedContent = (await vscode.workspace.fs.readFile(configUri)).toString();
		assert.notStrictEqual(updatedContent, originalContent, 'Config file was not updated');
		assert.deepStrictEqual(updatedContent, newContent, 'Config file content mismatch after update');
	});
	

	// ---ON TITLE CHANGE ---
	test('Should only accept .json [EDIT]', async () => {
		const invalidConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.txt'); // Invalid extension
		let errorThrown = false;
		const numFilesBefore = (await configFileProvider.getChildren()).length;
		try {
			await configFileProvider.addConfigFile(invalidConfigUri);
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, true, 'Operation accepted an invalid file extension');
		const numFilesAfter = (await configFileProvider.getChildren()).length;
		assert.strictEqual(numFilesAfter, numFilesBefore, 'Operation created a file with an invalid extension');
	});
	
	// test.skip('Should refresh configFiles view [EDIT]', async () => {});
	// test.skip('Should update all rulebooks containing the previous filename [EDIT]', async () => {});

	
	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new config file [ADD]', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test2.json');
		await configFileProvider.addConfigFile(uri);
		let fileExists = false;
		try {
			await vscode.workspace.fs.stat(uri); // This throws if the file doesn't exist.
			fileExists = true; // If we're here, the file exists.
		} catch (error) {
			// Handle specific errors if necessary.
		}
	
		assert.strictEqual(fileExists, true, 'Expected config file to be created, but it was not.');
	});


	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a config file [DELETE]', async () => {
		await configFileProvider.deleteConfigFileFile(configFileUri);

		let errorOccurred = false;
		try {
			await vscode.workspace.fs.stat(configFileUri);
		} catch (error) {
			errorOccurred = true;
		}
		assert(errorOccurred, 'Config file was not deleted successfully');
	});
});