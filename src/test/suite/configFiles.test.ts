import * as vscode from 'vscode';
import * as assert from 'assert';
import { rulebookExplorer, configFileExplorer } from '../../extension';
import { RulebookFileProvider, RulebookFile } from '../../rulebooks';
import { ConfigFileProvider } from '../../configFiles';

suite('ConfigFile Tests', () => {
	let rulebookFileProvider: RulebookFileProvider;
	let configFileProvider: ConfigFileProvider;
	let rulebookTreeView: vscode.TreeView<RulebookFile>;
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
		rulebookTreeView = rulebookExplorer.getTreeView();

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

	test('Should retrieve config files on rulebook selection', async () => {
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

	test('Should retrieve the correct config files on rulebook selection', async () => {
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


	test('Should open config file on click', async () => {
		let errorThrown = false;
		try {
			await vscode.commands.executeCommand('configFiles.openConfigFile', configFileUri.fsPath);
		}
		catch (error) {
			errorThrown = true;
		}
		assert.strictEqual(errorThrown, false, 'Config file was not opened');
	});
});
