import * as vscode from 'vscode';
import * as assert from 'assert';
import * as myExtension from '../../extension';

import { ConfigFileProvider } from '../../configFiles';
import { RulebookFileProvider, RulebookFile, initRulebook } from '../../rulebooks';
import { Rulebook } from '../../models';

suite('Rulebook Tests', () => {
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

	test('Should retrieve rulebook files [BROWSE]', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		assert.strictEqual(rulebookFiles.length > 0, true, 'Rulebook files were not retrieved successfully');
	});

	test('Should show only .rulebook.json files [BROWSE]', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		let invalidFileFound = false;
		rulebookFiles.forEach(rulebookFile => {
			if (!rulebookFile.label.endsWith('.rulebook.json'))
				invalidFileFound = true;
		});
		assert.strictEqual(invalidFileFound, false, 'Invalid file found in rulebook files');
	});

	test('Should parse rulebook for display data [BROWSE]', async () => {
		const rulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'test.rulebook.json');
		const rulebookData = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		assert.ok(rulebookData, 'Rulebook data was not parsed correctly');
		assert.strictEqual(rulebookData.Name, mockRulebook.Name, 'Rulebook name mismatch');
	});


	/*---------------------------------------- READ ----------------------------------------*/

	test('Should open rulebook on click [READ]', async () => {
		await rulebookFileProvider.onRulebookSelectionChanged([mockRulebookFile]);
		// assert that file was opened
		const activeEditor = vscode.window.activeTextEditor;
		assert.strictEqual(activeEditor?.document.uri.fsPath, rulebookUri.fsPath, 'Rulebook was not opened successfully');
	});



	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should write to a rulebook [EDIT]', async () => {
		await rulebookFileProvider.writeRulebook(rulebookUri, mockRulebook);
		const writtenRulebook = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		assert.deepStrictEqual(writtenRulebook, mockRulebook, 'Rulebook was not written successfully');
	});

	test('Should verify file extension [EDIT / ON FILENAME CHANGE]', async () => {
		const invalidRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'test.rulebook.txt'); // Invalid extension
		const numRulebooksBefore = (await rulebookFileProvider.getChildren()).length;

		// Try to perform an operation that should only accept .rulebook.json files
		await rulebookFileProvider.addRulebook(invalidRulebookUri);
		const numRulebooksAfter = (await rulebookFileProvider.getChildren()).length;

		assert.strictEqual(numRulebooksAfter, numRulebooksBefore, 'Operation accepted an invalid file extension');
	});

	test('Should verify file contents [EDIT / ON CONTENTS CHANGE]', async () => {

		// verify that the rulebook's contents were changed
		let errorOccurred = false;
		try {
			// overwrite the contents of the rulebook with invalid data
			const invalidRulebookData = { ...mockRulebook, Name: '' };
			await rulebookFileProvider.writeRulebook(rulebookUri, invalidRulebookData);
			const rulebookData = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
			assert.ok(rulebookData, 'Rulebook data was not parsed correctly');
		}
		catch (error) {
			errorOccurred = true;
		}
		assert.strictEqual(errorOccurred, true, 'Rulebook contents were not verified successfully');
	});

	// ---ON CONFIGFILE CHANGE ---

	test('Should add a config file to a rulebook [EDIT]', async () => {
		// const rulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
		await rulebookFileProvider.addConfigFileToRulebook(configFileUri, mockRulebookFile);
		const updatedRulebook = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		assert.ok(updatedRulebook.Files.includes(configFileUri.fsPath), 'Config file was not added to rulebook');
	});

	test('Should remove a config file from rulebooks [EDIT]', async () => {
		await rulebookFileProvider.removeConfigFileFromRulebooks(configFileUri);
		const updatedRulebook = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		assert.ok(!updatedRulebook.Files.includes(configFileUri.fsPath), 'Config file was not removed from rulebook');
	});


	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new rulebook', async () => {
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.rulebook.json');
		await rulebookFileProvider.addRulebook(newRulebookUri);

		let errorOccurred = false;
		try {
			await vscode.workspace.fs.stat(newRulebookUri);
		} catch (error) {
			errorOccurred = true;
		}
		assert.strictEqual(errorOccurred, false, 'Rulebook was not created successfully');
	});

	test('Should write Rulebook template to new file [ADD]', async () => {
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.rulebook.json');
		await rulebookFileProvider.addRulebook(newRulebookUri);

		const createdRulebook = await rulebookFileProvider.parseRulebook(newRulebookUri.fsPath);
		const expectedInitialData = initRulebook('new');

		assert.deepStrictEqual(createdRulebook, expectedInitialData, 'New rulebook does not contain the expected initial data');
	});


	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a rulebook [DELETE]', async () => {
		await rulebookFileProvider.deleteRulebookFile(rulebookUri);

		let errorOccurred = false;
		try {
			await vscode.workspace.fs.stat(rulebookUri);
		} catch (error) {
			errorOccurred = true;
		}
		assert.strictEqual(errorOccurred, true, 'Rulebook was not deleted successfully');
	});

	test('Should refresh the rulebook and configFiles views [DELETE]', async () => {
		const rulebookFilesBefore = (await rulebookFileProvider.getChildren()).length;
		await rulebookFileProvider.deleteRulebookFile(rulebookUri);
		const rulebookFilesAfter = (await rulebookFileProvider.getChildren()).length;

		assert.strictEqual(rulebookFilesAfter, rulebookFilesBefore - 1, 'Rulebooks were not refreshed successfully');

		const configFiles = (await configFileProvider.getChildren()).length;
		assert.strictEqual(configFiles > 0, true, 'Config files were not refreshed successfully');
	});
});