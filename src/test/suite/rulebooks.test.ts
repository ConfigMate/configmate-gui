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

	test.skip('Should retrieve rulebook files [BROWSE]', async () => {});
	test.skip('Should show welcome message when no rulebooks present [BROWSE]', async () => {});
	test.skip('Should show only .rulebook.json files [BROWSE]', async () => {});
	test.skip('Should parse rulebook for display data [BROWSE]', async () => {});


	/*---------------------------------------- READ ----------------------------------------*/

	test.skip('Should open rulebook [READ]', async () => {});


	/*---------------------------------------- EDIT ----------------------------------------*/

	test('Should write to a rulebook [EDIT]', async () => {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
        await rulebookProvider.writeRulebook(uri, mockRulebook);
        const writtenRulebook = await rulebookProvider.parseRulebook(uri.fsPath);
        assert.deepStrictEqual(writtenRulebook, mockRulebook, 'Rulebook was not written successfully');
    });

	test.skip('Should refresh rulebooks view [EDIT]', async () => {});

	// ---ON TITLE CHANGE ---

	test.skip('Should verify file extension [EDIT]', async () => {});
	test.skip('Should handle errors in file extension [EDIT]', async () => {});
	
	// ---ON CONTENTS CHANGE ---

	test.skip('Should verify file contents [EDIT]', async () => {});
	test.skip('Should handle errors in file contents [EDIT]', async () => {});

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

	test.skip('Should verify file extension [ADD]', async () => {});
	test.skip('Should handle errors in file extension [ADD]', async () => {});
	test.skip('Should write Rulebook template to new file [ADD]', async () => {});
	test.skip('Should refresh rulebook view [ADD]', async () => {});


	/*---------------------------------------- DELETE ----------------------------------------*/

	test('Should delete a rulebook [DELETE]', async () => {
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
	test.skip('Should ask for confirmation [DELETE]', async () => {});
	test.skip('Should refresh the rulebook and configFiles views [DELETE]', async () => {});
});