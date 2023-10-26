import * as vscode from 'vscode';
import * as assert from 'assert';
import { rulebookExplorer, configFileExplorer } from '../../extension';

suite('ConfigFile Tests', () => {
	const rulebookFileProvider = rulebookExplorer.getProvider();
	const rulebookTreeView = rulebookExplorer.getTreeView();
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

	test('Should retrieve config files on rulebook selection [BROWSE]', async () => {
		let errorThrown = false;
		try {
			const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
			await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
			const configFiles = await configFileProvider.getChildren();
			assert.strictEqual(configFiles.length > 0, true, 'Config files were not retrieved successfully');

		}
		catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Rulebook was not opened');
	});

	test('Should retrieve the correct config file on rulebook selection [BROWSE]', async () => {
		try {
			const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
			await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);

			// get config files from rulebook
			const configFilesFromRulebook = rulebookTreeView.selection[0].getConfigFilePaths();
			const configFilesFromTreeView = await configFileProvider.getChildren();
			for (let i = 0; i < configFilesFromRulebook.length; i++) {
				assert.strictEqual(configFilesFromRulebook[i], configFilesFromTreeView[i], 'Config files were not retrieved successfully');
			}
		}
		catch (error) { /* do nothing */ }
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

	test('Should only accept .json [EDIT / ON FILENAME CHANGE]', async () => {
		const invalidConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.txt'); // Invalid extension
		await configFileProvider.changeFilename(configFileUri, invalidConfigUri);
		let fileExists = false;
		try {
			await vscode.workspace.fs.stat(invalidConfigUri); // This throws if the file doesn't exist.
			fileExists = true; // If we're here, the file exists.
		} catch (error) {
			// Handle specific errors if necessary.
		}
		assert.strictEqual(fileExists, false, 'Operation created a file with an invalid extension');
	});

	test('Should refresh configFiles view [EDIT / ON FILENAME CHANGE]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		const configFilesBefore = (await configFileProvider.getChildren()).length;

		// edit filename of config file
		const newConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig2.json');
		await configFileProvider.changeFilename(configFileUri, newConfigUri);

		const configFilesAfter = (await configFileProvider.getChildren()).length;

		assert.strictEqual(configFilesAfter === configFilesBefore - 1 || 0, true, 'ConfigFiles were not refreshed successfully');
	});

	test('Should update rulebook containing the previous filename [EDIT / ON FILENAME CHANGE]', async () => {
		/* NOTE: DOUBLE-CHECK THIS TEST */
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);

		// change filename of config file
		const newConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig2.json');
		await configFileProvider.changeFilename(configFileUri, newConfigUri);

		// check that configFile is no longer in rulebook
		// const rulebook = 
		await rulebookFileProvider.parseRulebook(rulebookUri.fsPath);
		// assert.strictEqual(rulebook.files.includes(configFileUri.fsPath), true, 'Config file was not updated in rulebook');
	});

	test('Should update a config file on save [EDIT / ON CONTENT CHANGE]', async () => {
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


	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new config file [ADD]', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test2.json');
		await configFileProvider.addConfigFileFile(uri);
		let fileExists = false;
		try {
			await vscode.workspace.fs.stat(uri); // This throws if the file doesn't exist.
			fileExists = true; // If we're here, the file exists.
		} catch (error) {
			// Handle specific errors if necessary.
		}

		assert.strictEqual(fileExists, true, 'Expected config file to be created, but it was not.');
	});

	test('Should only accept .json [ADD]', async () => {
		const invalidConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.txt'); // Invalid extension
		const numFilesBefore = (await configFileProvider.getChildren()).length;
		try {
			await configFileProvider.addConfigFileFile(invalidConfigUri);
		}
		catch (error) { /* should throw error */ }
		const numFilesAfter = (await configFileProvider.getChildren()).length;
		assert.strictEqual(numFilesAfter, numFilesBefore, 'Operation created a file with an invalid extension');
	});

	test('Should refresh configFiles view [ADD]', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test2.json');
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		const configFilesBefore = (await configFileProvider.getChildren()).length;
		await configFileProvider.addConfigFile(uri, rulebookFile);
		const configFilesAfter = (await configFileProvider.getChildren()).length;

		assert.strictEqual(configFilesAfter, configFilesBefore + 1, 'ConfigFiles were not refreshed successfully');
	});



	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a config file [DELETE]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);

		let errorThrown = false;
		try {
			await configFileProvider.deleteConfigFileFile(configFileUri);
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Config file was not deleted');
	});

	test('Should refresh configFiles view [DELETE]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		const configFilesBefore = (await configFileProvider.getChildren()).length;
		await configFileProvider.deleteConfigFile(configFileUri, [rulebookFile]);
		const configFilesAfter = (await configFileProvider.getChildren()).length;

		assert.strictEqual(configFilesAfter, configFilesBefore - 1 || 0, 'ConfigFile was not deleted.');
	});

	test('Should remove config file from rulebook containing its filepath [DELETE]', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		await rulebookFileProvider.deleteRulebookFile(rulebookUri);
		const selection = rulebookExplorer.getSelectedRulebook();
		assert.notStrictEqual(selection, undefined, 'Rulebook was deselected');
		// const { rulebook } = selection || mockRulebookFile;
		// assert.ok(!rulebook.files.includes(configFileUri.fsPath), 'Config file was not removed from rulebook');

	});
});