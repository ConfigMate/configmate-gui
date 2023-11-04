import * as vscode from 'vscode';
import * as assert from 'assert';
import { rulebookExplorer, configFileExplorer } from '../../extension';
import { RulebookFileProvider, initRulebook } from '../../rulebooks';
import { ConfigFileProvider } from '../../configFiles';

suite('Rulebook Tests', () => {
	let rulebookFileProvider: RulebookFileProvider;
	let configFileProvider: ConfigFileProvider;
	let mockRulebookUri!: vscode.Uri, mockConfigFileUri!: vscode.Uri;
	let rulebookUri!: vscode.Uri, configFileUri: vscode.Uri;
	let testWorkspace!: vscode.WorkspaceFolder;

	suiteSetup(async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		assert.ok(workspaceFolders, "No workspace is open.");
		testWorkspace = workspaceFolders[0];
		const { uri } = testWorkspace;

		rulebookFileProvider = rulebookExplorer.getProvider();
		configFileProvider = configFileExplorer.getProvider();

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


	/*---------------------------------------- TESTS ----------------------------------------*/

	test('Should retrieve rulebook files', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		assert.strictEqual(rulebookFiles.length > 0, true, 'Rulebook files were not retrieved successfully');
	});

	test('Should show only .cmrb files', async () => {
		const rulebookFiles = await rulebookFileProvider.getChildren();
		let invalidFileFound = false;
		rulebookFiles.forEach(rulebookFile => {
			if (!rulebookFile.label.endsWith('.cmrb'))
				invalidFileFound = true;
		});
		assert.strictEqual(invalidFileFound, false, 'Invalid file found in rulebook files');
	});

	test('Should open rulebook on click', async () => {
		const rulebookFile = await rulebookFileProvider.getRulebookFile(rulebookUri)
		await rulebookFileProvider.onRulebookSelectionChanged([rulebookFile]);
		// assert that file was opened
		const activeEditor = vscode.window.activeTextEditor;
		assert.strictEqual(activeEditor?.document.uri.fsPath, rulebookUri.fsPath, 'Rulebook was not opened successfully');
	});

	test('Should create a new rulebook', async () => {
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.cmrb');
		let errorOccurred = false;
		try {
			await rulebookFileProvider.addRulebook(newRulebookUri);
			await vscode.workspace.fs.stat(newRulebookUri);
		} catch (error) {
			errorOccurred = true;
		}
		assert.strictEqual(errorOccurred, false, 'Rulebook was not created successfully');
	});

	test('Should write Rulebook template to new file', async () => {
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.cmrb');
		let errorOccurred = false;
		try {
			await rulebookFileProvider.addRulebook(newRulebookUri);
			await vscode.workspace.fs.stat(newRulebookUri);
		} catch (error) {
			errorOccurred = true;
		}

		const createdRulebook = rulebookFileProvider.getRulebookFile(newRulebookUri);
		const expectedInitialData = initRulebook('new');

		assert.deepStrictEqual(createdRulebook, expectedInitialData, 'New rulebook does not contain the expected initial data');
	});


	test('Should refresh the rulebook and configFiles views', async () => {
		let rulebookFilesBefore = 0, rulebookFilesAfter = 0, numConfigFiles = 0;
		const newRulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'new.cmrb');
		let errorOccurred = false;
		try {
			rulebookFilesBefore = (await rulebookFileProvider.getChildren()).length;
			await rulebookFileProvider.addRulebook(newRulebookUri);
			await vscode.workspace.fs.stat(newRulebookUri);
			rulebookFilesAfter = (await rulebookFileProvider.getChildren()).length;
			numConfigFiles = (await configFileProvider.getChildren()).length;
		} catch (error) {
			errorOccurred = true;
		}
		assert.strictEqual(errorOccurred, false, 'Rulebook was not added successfully');
		assert.strictEqual(rulebookFilesAfter, rulebookFilesBefore + 1, 'Rulebooks were not refreshed successfully');
		assert.strictEqual(numConfigFiles > 0, true, 'Config files were not refreshed successfully');
	});
});