import * as vscode from 'vscode';
import * as assert from 'assert';
import { RulebookFileProvider, RulebookFile } from '../../rulebooks';

suite('Rulebook Tests', () => {
	const rulebookProvider = new RulebookFileProvider();
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

	test('Should create a new rulebook', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		await rulebookProvider.addRulebook(uri);
		const rulebook = await rulebookProvider.parseRulebook(uri.fsPath);
		assert.ok(rulebook, 'Rulebook was not created successfully');
	});

	test('Should delete a rulebook', async () => {
		const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
		const rulebookFile = new RulebookFile('test', {
			title: 'Open Rulebook',
			command: 'rulebooks.openRulebook'
		}, uri.fsPath, mockRulebook);
		await rulebookProvider.deleteRulebook(rulebookFile);
		const rulebook = await rulebookProvider.parseRulebook(uri.fsPath);
		assert.ok(!rulebook, 'Rulebook was not deleted successfully');
	});

	test('Should write to a rulebook', async () => {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
        const rulebook = {
            Name: "TestRulebook",
            Description: "This is a test rulebook",
            Files: [],
            Rules: []
        };
        await rulebookProvider.writeRulebook(uri, rulebook);
        const writtenRulebook = await rulebookProvider.parseRulebook(uri.fsPath);
        assert.deepStrictEqual(writtenRulebook, rulebook, 'Rulebook was not written successfully');
    });

    test('Should add a config file to a rulebook', async () => {
        const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
        const configUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
        const rulebookFile = new RulebookFile('test', { title: 'Open Rulebook', command: 'rulebooks.openRulebook' }, rulebookUri.fsPath, mockRulebook);
        await rulebookProvider.addConfigFileToRulebook(configUri, rulebookFile);
        const updatedRulebook = await rulebookProvider.parseRulebook(rulebookUri.fsPath);
        assert.ok(updatedRulebook.Files.includes(configUri.fsPath), 'Config file was not added to rulebook');
    });

    test('Should remove a config file from rulebooks', async () => {
        const rulebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test.rulebook.json');
        const configUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'testConfig.json');
        await rulebookProvider.removeConfigFileFromRulebooks(configUri);
        const updatedRulebook = await rulebookProvider.parseRulebook(rulebookUri.fsPath);
        assert.ok(!updatedRulebook.Files.includes(configUri.fsPath), 'Config file was not removed from rulebook');
    });
});