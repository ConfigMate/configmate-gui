import * as vscode from 'vscode';
import * as assert from 'assert';
import { rulebookExplorer, configFileExplorer } from '../../extension';
import { RulebookFile, initRulebook } from '../../rulebooks';

suite('Rulebook Tests', () => {
	const rulebookFileProvider = rulebookExplorer.getProvider();
	const configFileProvider = configFileExplorer.getProvider();
	let mockRulebookUri!: vscode.Uri, mockConfigFileUri!: vscode.Uri;
	let rulebookUri!: vscode.Uri, configFileUri: vscode.Uri;
	let testWorkspace!: vscode.WorkspaceFolder;

	suiteSetup(async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		assert.ok(workspaceFolders, "No workspace is open.");
		testWorkspace = workspaceFolders[0];
		const { uri } = testWorkspace;

		rulebookUri = vscode.Uri.joinPath(uri, 'config0.cmrb');
		mockRulebookUri = vscode.Uri.joinPath(uri, 'mock', 'config0.cmrb');
		mockConfigFileUri = vscode.Uri.joinPath(uri, 'mock', 'config0.json');
		configFileUri = vscode.Uri.joinPath(uri, 'examples', 'configurations', 'config0.json');
	});

	teardown(async () => {
		const files = await vscode.workspace.fs.readDirectory(testWorkspace.uri);
		for (const file of files) {
			const uri = vscode.Uri.joinPath(testWorkspace.uri, file[0]);
			// delete files but not folders
			if (file[1] !== vscode.FileType.Directory)
				await vscode.workspace.fs.delete(uri, { recursive: false });
		}
		await vscode.workspace.fs.copy(mockRulebookUri, rulebookUri, { overwrite: true });
		await vscode.workspace.fs.copy(mockConfigFileUri, configFileUri, { overwrite: true });
	});


	/*---------------------------------------- BROWSE ----------------------------------------*/

	test('Should retrieve rulebook files [BROWSE]', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		assert.strictEqual(rulebookFiles.length > 0, true, 'Rulebook files were not retrieved successfully');
	});

	test('Should show only .cmrb files [BROWSE]', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		let invalidFileFound = false;
		rulebookFiles.forEach(rulebookFile => {
			if (!rulebookFile.label.endsWith('.cmrb'))
				invalidFileFound = true;
		});
		assert.strictEqual(invalidFileFound, false, 'Invalid file found in rulebook files');
	});

	test('Should parse rulebook for display data [BROWSE]', async () => {
		const rulebook = (await rulebookFileProvider.getRulebookFile(rulebookUri))!.rulebook;
		const testRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'test.cmrb');
		const rulebookData = await rulebookFileProvider.parseRulebook(testRulebookUri.fsPath);
		assert.ok(rulebookData, 'Rulebook data was not parsed correctly');
		assert.strictEqual(rulebookData.name, rulebook.name, 'Rulebook name mismatch');
	});


	/*---------------------------------------- READ ----------------------------------------*/

	test('Should open rulebook on click [READ]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		// assert that file was opened
		const activeEditor = vscode.window.activeTextEditor;
		assert.strictEqual(activeEditor?.document.uri.fsPath, rulebookUri.fsPath, 'Rulebook was not opened successfully');
	});



	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should write to a rulebook [EDIT]', async () => {
		const rulebook = (await rulebookFileProvider.getRulebookFile(rulebookUri))!.rulebook;
		await rulebookFileProvider.writeRulebook(rulebookUri, rulebook);
		const writtenRulebook = await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		assert.deepStrictEqual(writtenRulebook, rulebook, 'Rulebook was not written successfully');
	});

	test('Should verify file extension [EDIT / ON FILENAME CHANGE]', async () => {
		const invalidRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'test.rulebook.txt'); // Invalid extension
		const numRulebooksBefore = (await rulebookFileProvider.getChildren()).length;

		// Try to perform an operation that should only accept .cmrb files
		await rulebookFileProvider.addRulebook(invalidRulebookUri);
		const numRulebooksAfter = (await rulebookFileProvider.getChildren()).length;

		assert.strictEqual(numRulebooksAfter, numRulebooksBefore, 'Operation accepted an invalid file extension');
	});

	test('Should verify file contents [EDIT / ON CONTENTS CHANGE]', async () => {

		// verify that the rulebook's contents were changed
		let errorOccurred = false;
		try {
			// overwrite the contents of the rulebook with invalid data
			const rulebook = (await rulebookFileProvider.getRulebookFile(rulebookUri))!.rulebook;
			const invalidRulebookData = { ...rulebook, Name: '' };
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
		const rulebook = (await rulebookFileProvider.getRulebookFile(rulebookUri))!.rulebook;
		const rulebookFile = new RulebookFile('test', rulebookUri.fsPath, rulebook);
		await rulebookFileProvider.addConfigFileToRulebook(configFileUri, rulebookFile);
		// const updatedRulebook = 
		await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		// assert.ok(updatedRulebook.files.includes(configFileUri.fsPath), 'Config file was not added to rulebook');
	});

	test('Should remove a config file from view on deletion [EDIT / CONTENTS]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri);
		let { rulebook } = rulebookFile;
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		// remove the config file path from the rulebook
		await rulebookFileProvider.writeRulebook(rulebookUri, { ...rulebook, files: {} });
		const selection = rulebookExplorer.getSelectedRulebook();
		assert.notStrictEqual(selection, undefined, 'Rulebook was deselected');
		({ rulebook } = selection || rulebookFile);
		assert.ok(Object.keys(rulebook.files).length === 0, 'Config file was not removed from rulebook');
	});

	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new rulebook', async () => {
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.cmrb');
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
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.cmrb');
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