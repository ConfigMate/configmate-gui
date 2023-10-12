/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as vscode from 'vscode';
import * as assert from 'assert';
import { RulebookFileProvider, RulebookFile } from '../../rulebooks';

suite('Rulebook Tests', () => {
	const rulebookProvider = new RulebookFileProvider();
	let mock1: vscode.Uri, mock2: vscode.Uri, dest1: vscode.Uri, dest2: vscode.Uri;
	let testWorkspace: vscode.WorkspaceFolder;
	const mockRulebook = {
		"Name": "Rulebook name",
		"Description": "Rulebook description",
		"Files": [
			"D:\\KT\\Projects\\Go\\src\\configmate\\configmate\\.github\\events\\bump_version_patch.json"
		],
		"Rules": [
			{
				"Description": "Rule description",
				"CheckName": "Name of check to run",
				"Args": "Arguments to pass to check"
			}
		]
	};

	suiteSetup(async () => {
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

	// Should retrieve rulebook files [BROWSE]
	// Should show welcome message when no rulebooks present [BROWSE]
	// Should show only .rulebook.json files [BROWSE]
	// Should parse rulebook for display data [BROWSE]


	/*---------------------------------------- READ ----------------------------------------*/

	// Should open rulebook [READ]


	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should write to a rulebook [EDIT]', async () => {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
        await rulebookProvider.writeRulebook(uri, mockRulebook);
        const writtenRulebook = await rulebookProvider.parseRulebook(uri.fsPath);
        assert.deepStrictEqual(writtenRulebook, mockRulebook, 'Rulebook was not written successfully');
    });

	// Should refresh rulebooks view [EDIT]

	// ---ON TITLE CHANGE ---

	// Should verify file extension [EDIT]
	// Should handle errors in file extension [EDIT]
	
	// ---ON CONTENTS CHANGE ---

	// Should verify file contents [EDIT]
	// Should handle errors in file contents [EDIT]

	// ---ON CONFIGFILE CHANGE ---

	test('Should add a config file to a rulebook [EDIT]', async () => {
		const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		const configUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
		const rulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
		await rulebookProvider.addConfigFileToRulebook(configUri, rulebookFile);
		const updatedRulebook = await rulebookProvider.parseRulebook(rulebookUri.fsPath);
		assert.ok(updatedRulebook.Files.includes(configUri.fsPath), 'Config file was not added to rulebook');
	});

	test('Should remove a config file from rulebooks [EDIT]', async () => {
		const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		const configUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
		await rulebookProvider.removeConfigFileFromRulebooks(configUri);
		const updatedRulebook = await rulebookProvider.parseRulebook(rulebookUri.fsPath);
		assert.ok(!updatedRulebook.Files.includes(configUri.fsPath), 'Config file was not removed from rulebook');
	});


	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new rulebook', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		await rulebookProvider.addRulebook(uri);
		const rulebook = await rulebookProvider.parseRulebook(uri.fsPath);
		assert.ok(rulebook, 'Rulebook was not created successfully');
	});

	// Should verify file extension [ADD]
	// Should handle errors in file extension [ADD]
	// Should write Rulebook template to new file [ADD]
	// Should refresh rulebook view


	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a rulebook', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		await rulebookProvider.deleteRulebookFile(uri);

		let errorOccurred = false;
		try {
			await vscode.workspace.fs.stat(uri);
		} catch (error) {
			errorOccurred = true;
		}
		assert(errorOccurred, 'Rulebook was not deleted successfully');
	});
	//  Should ask for confirmation [DELETE]
	//  Should refresh the rulebook and configFiles views [DELETE]
});