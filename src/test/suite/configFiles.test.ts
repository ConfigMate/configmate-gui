import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigFileProvider } from '../../configFiles';
import { RulebookFile } from '../../rulebooks';

suite('ConfigFile Tests', () => {
	const configFileProvider = new ConfigFileProvider();
	let mock1: vscode.Uri, mock2: vscode.Uri, dest1: vscode.Uri, dest2: vscode.Uri;
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

	test('Should refresh config files [BROWSE]', async () => {
		const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		const rulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
		const rulebookTreeView = {
			selection: [rulebookFile]
		} as unknown as vscode.TreeView<RulebookFile>;
		configFileProvider.refresh(rulebookTreeView);
		const configFiles = await configFileProvider.getChildren();
		assert.ok(configFiles.length > 0, 'Config files were not refreshed correctly');
	});

	test.skip('Should show all .json files when no rulebooks present [BROWSE]', async () => {});
	test.skip('Should show all .json files when no rulebooks selected [BROWSE]', async () => {});
	test.skip('Should show welcome message when no .json files present in workspace [BROWSE]', async () => {});
	test.skip('Should show welcome message when no .json files present in selected rulebook [BROWSE]', async () => {});
	test.skip('Should show all files listed in Files when rulebook selected [BROWSE]', async () => {});

	/*---------------------------------------- READ ----------------------------------------*/

	test.skip('Should open config file on click [READ]', async () => {   }); // TO DO


	/*---------------------------------------- EDIT ----------------------------------------*/

	test.skip('Should update a config file on save [EDIT]', async () => { }); // TO DO

	// ---ON TITLE CHANGE ---
	test.skip('Should only accept .json [EDIT]', async () => {});
	test.skip('Should handle errors in file extension [EDIT]', async () => {});
	test.skip('Should refresh configFiles view [EDIT]', async () => {});
	test.skip('Should update all rulebooks containing the previous filename [EDIT]', async () => {});

	
	/*---------------------------------------- ADD ----------------------------------------*/

	test('Should create a new config file [ADD]', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test2.json');
		await configFileProvider.addConfigFile(uri);
		const configFile = await vscode.workspace.fs.readFile(uri);
		assert.ok(configFile, 'Config file was not created successfully');
	});

	test.skip('Should only accept .json [EDIT]', async () => {});
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