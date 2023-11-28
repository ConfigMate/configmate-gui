import * as vscode from 'vscode';

export const openDoc = async (uri: vscode.Uri): Promise<vscode.TextEditor> => {
	let doc: vscode.TextDocument;
	try {
		doc = await vscode.workspace.openTextDocument(uri);
	} catch (error) {
		console.error(error);
		await vscode.window.showWarningMessage(`Couldn't open a ConfigMate response: ${error as string}`);
	}
	return await vscode.window.showTextDocument(doc);
};

export const uriToFilename = (uri: vscode.Uri): string => 
	vscode.Uri.parse(uri.toString()).path.split('/').pop() || '';

export const uriToExtension = (uri: vscode.Uri): string => {
	const split = vscode.Uri.parse(uri.toString()).path.split('.');
	split.shift();
	return split.join('.');
}

export const getBasename = (uri?: vscode.Uri, filename?: string): string => {
	if (filename) return filename.split('.')[0] || '';
	if (uri) return uriToFilename(uri).split('.')[0] || '';
	return '';
}
