import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigFile, ConfigFileProvider } from '../../configFiles';
import { RulebookFileProvider, RulebookFile } from '../../rulebooks';
import * as myExtension from '../../extension';

suite('ConfigFile Tests', () => {
	let configFileProvider: ConfigFileProvider;
	let configFiles: ConfigFile[];
	let rulebookTreeView: vscode.TreeView<RulebookFile>;
	let rulebookFileProvider: RulebookFileProvider;
	let testWorkspace: vscode.WorkspaceFolder;
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
	let mockRulebookFile: RulebookFile;
	let mock1: vscode.Uri, mock2: vscode.Uri, dest1: vscode.Uri, dest2: vscode.Uri;

	suiteSetup(async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		assert.ok(workspaceFolders, "No workspace is open.");
		testWorkspace = workspaceFolders[0];
	
		// Initialize ConfigFileProvider
		({rulebookFileProvider, configFileProvider, rulebookTreeView} = myExtension);
	
		// Prepare mock RulebookFile
		const rulebookUri = vscode.Uri.joinPath(testWorkspace.uri, 'test.rulebook.json');
		mockRulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
		
		testWorkspace = vscode.workspace.workspaceFolders![0];
		
		mock1 = (await vscode.workspace.findFiles('**/mock/test.rulebook.json', '**/node_modules/**', 1))[0];
		mock2 = (await vscode.workspace.findFiles('**/mock/testConfig.json', '**/node_modules/**', 1))[0];
		dest1 = vscode.Uri.joinPath(testWorkspace.uri, 'test.rulebook.json');
		dest2 = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.json');
	});

	teardown(async () => {
		// reset the workspace to its original state
		await vscode.workspace.fs.copy(mock1, dest1, { overwrite: true });
		await vscode.workspace.fs.copy(mock2, dest2, { overwrite: true });
	});

	
	/*---------------------------------------- BROWSE ----------------------------------------*/

	test('Should refresh config files [BROWSE]', async () => {
		configFileProvider.refresh(rulebookTreeView);
		configFiles = await configFileProvider.getChildren();
		await rulebookTreeView.reveal(mockRulebookFile);
		
		assert.strictEqual(configFiles.length > 0, true, 'Config files were not refreshed correctly');
	});


	/*---------------------------------------- READ ----------------------------------------*/

	test('Should open config file on click [READ]', async () => {
		// Trigger the openConfigFile command
		await vscode.commands.executeCommand('configFiles.openConfigFile', configFiles[0]);
		const editor = vscode.window.activeTextEditor;
		assert.strictEqual(editor?.document.uri.fsPath, configFiles[0].filepath, 'Config file was not opened');
	});
	


	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should update a config file on save [EDIT]', async () => {
		const configUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.json');
		const originalContent = (await vscode.workspace.fs.readFile(configUri)).toString();
		const newContent = '{"new": "content"}';
	
		// Simulate the user editing and saving the file
		const document = await vscode.workspace.openTextDocument(configUri);
		const editor = await vscode.window.showTextDocument(document);
		await editor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 0), newContent);
		});
		await document.save();
	
		const updatedContent = (await vscode.workspace.fs.readFile(configUri)).toString();
		assert.notStrictEqual(updatedContent, originalContent, 'Config file was not updated');
		assert.strictEqual(updatedContent, newContent, 'Config file content mismatch after update');
	});
	

	// ---ON TITLE CHANGE ---
	test('Should only accept .json [EDIT]', async () => {
		const invalidConfigUri = vscode.Uri.joinPath(testWorkspace.uri, 'testConfig.txt'); // Invalid extension
		let errorThrown = false;
		try {
			// Try to perform an operation that should only accept .json files
			await configFileProvider.openConfigFile(invalidConfigUri);
		} catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, true, 'Operation accepted an invalid file extension');
	});
	
	test.skip('Should handle errors in file extension [EDIT]', async () => {});
	test.skip('Should refresh configFiles view [EDIT]', async () => {});
	test.skip('Should update all rulebooks containing the previous filename [EDIT]', async () => {});

	
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

	test.skip('Should handle errors in file extension [ADD]', async () => {});


	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a config file [DELETE]', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
		await configFileProvider.deleteConfigFileFile(uri);

		let errorOccurred = false;
		try {
			await vscode.workspace.fs.stat(uri);
		} catch (error) {
			errorOccurred = true;
		}
		assert(errorOccurred, 'Config file was not deleted successfully');
	});

	test.skip('Should ask for confirmation [DELETE]', async () => {});
	test.skip('Should refresh the configFiles View [DELETE]', async () => {});
});