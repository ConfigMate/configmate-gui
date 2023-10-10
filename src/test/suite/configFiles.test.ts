import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigFileProvider, ConfigFile } from '../../configFiles';
import { RulebookFile } from '../../rulebooks';

suite('ConfigFile Tests', () => {
	const configFileProvider = new ConfigFileProvider();
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

	test('Should create a new config file', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
		await configFileProvider.addConfigFile(uri);
		const configFile = await vscode.workspace.fs.readFile(uri);
		assert.ok(configFile, 'Config file was not created successfully');
	});

	test('Should delete a config file', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
		const configFile = new ConfigFile('testConfig', uri.fsPath, {
			command: 'configFiles.openConfigFile',
			title: 'Open Config File',
			arguments: [uri.fsPath]
		});
		await configFileProvider.deleteConfigFile(configFile);
		try {
			await vscode.workspace.fs.readFile(uri);
			assert.fail('Config file was not deleted successfully');
		} catch (error) {
			assert.ok(true);
		}
	});

	test('Should refresh config files', async () => {
		const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		const rulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
		const rulebookTreeView = {
			selection: [rulebookFile]
		} as unknown as vscode.TreeView<RulebookFile>;
		configFileProvider.refresh(rulebookTreeView);
		const configFiles = await configFileProvider.getChildren();
		assert.ok(configFiles.length > 0, 'Config files were not refreshed correctly');
	});

	test('Should retrieve config files', async () => {
		const configFiles = await configFileProvider.getConfigFiles();
		assert.ok(configFiles.length > 0, 'Config files were not retrieved correctly');
	});
});