import * as vscode from "vscode";

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