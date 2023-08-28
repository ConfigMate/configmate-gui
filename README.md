# CLI File Parser

This extension uses the extension terminal API stabilized in v1.39 that enables an extension to handle a terminal's input and emit output.  
It is based on vscode's [cli-file-parser](https://github.com/Microsoft/vscode-extension-samples/tree/main/cli-file-parser).

## VS Code API

### `vscode` module

- [window.createTerminal](https://code.visualstudio.com/api/references/vscode-api#window.createTerminal)

### Contribution Points

- [`contributes.commands`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)

## Run the Extension

- Run `npm install` in terminal to install dependencies
- `npm run compile` to compile the extension
- `npm run watch` to watch for changes
- `F5` to run the extension in a new VScode window
  - `Ctrl+Shift+P` to open the command palette
    - `Hello World` to run the command
  	- `Developer: Reload Window` to reload the extension in this new window to see any changes you've made
