import * as vscode from 'vscode';

export const openDoc = async (uri: vscode.Uri) => {
	const doc = await vscode.workspace.openTextDocument(uri);
	await vscode.window.showTextDocument(doc);
};