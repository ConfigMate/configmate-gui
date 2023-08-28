'use strict';

import * as vscode from 'vscode';

// Define the Pseudoterminal
// https://code.visualstudio.com/api/references/vscode-api#Pseudoterminal

let input = '';
const writeEmitter = new vscode.EventEmitter<string>();
const pty = {
	onDidWrite: writeEmitter.event,
	open: () => writeEmitter.fire(getMenu()),
	close: () => { /* noop*/ },
	handleInput: (keystroke: string) => {
		switch (keystroke) {
			case '\r': { // Enter
				/* Handle user input here
				Pass input to other functions defined outside of activate()
				Currently, just echoes the input colorfully */

				writeEmitter.fire(`\r\necho: "${colorText(input)}"\r\n\n`);
				input = '';
				return;
			}
			case '\x7f': { // Backspace
				if (input.length === 0) return;
				input = input.substr(0, input.length - 1);
				// Move cursor backward
				writeEmitter.fire('\x1b[D');
				// Delete character
				writeEmitter.fire('\x1b[P');
				return;
			}
		}
		input += keystroke;
		writeEmitter.fire(keystroke);
	}
};


export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cliFileParser.create', () => {
		const terminal = vscode.window.createTerminal({ name: `CLI File Parser`, pty });
		terminal.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliFileParser.clear', () => {
		writeEmitter.fire('\x1b[2J\x1b[3J\x1b[;H');
	}));

}

function parseMenu(choice: number, input: string): string {
	switch (choice) {
		case 1: 
			return colorText(input);
		case 2: 
			return `Fetching the file you requested: ${input}\r\n`;
	}
	return 'Something went wrong parsing your menu choice!\r\n';
}

function getMenu(): string {
	const menu = `
*********************************
CHOOSE FROM THE FOLLOWING OPTIONS
	1. Color my text
	2. Fetch a file
	3. Exit
`;
	return menu;
}

function colorText(text: string): string {
	let output = '';
	let colorIndex = 1;
	for (let i = 0; i < text.length; i++) {
		const char = text.charAt(i);
		if (char === ' ' || char === '\r' || char === '\n') output += char;
		else {
			output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
			if (colorIndex > 6) colorIndex = 1;
		}
	}
	return output;
}