# ConfigMate VS Code Extension

[ConfigMate](#) itself is a open-source CLI tool that allows developers to automate the verification of configuration files.  
This extension aims to make the use of this tool more intuitive user-friendly, particularly for newer developers.

## Development Instructions

### Prerequisites

Node, VS Code

### Installation

Clone the repo and run `npm install` in terminal to install dependencies

### Run the Extension

- `npm run compile` to compile the extension
- `npm run watch` to watch for changes
- `F5` to run the extension in a new VScode window
  - `Ctrl+Shift+P` to open the command palette
    - `Hello World` to run the command
  	- `Developer: Reload Window` to reload the extension in this new window to see any changes you've made

## Planned Features

- [ ] appears as a side tab in the user's editor (View Container)
- [ ] has two sections (Views) in that side tab:
  - [ ] display and allow selection of a predefined 'ruleset'
  - [ ] upon selection of a ruleset, show related files in the user's filesystem

## Resources

### Code Samples

The following are primarily small standalone extensions intended to demonstrate the usage of specific APIs and implementation of certain features. They are on an [official Microsoft repo](https://github.com/Microsoft/vscode-extension-samples) and contain links to documentation for their individually required APIs, contribution points, etc.

In order of relevance:
- [Views & View Containers](https://github.com/microsoft/vscode-extension-samples/tree/main/tree-view-sample)
- [FileSystem (FS) API Usage](https://github.com/microsoft/vscode-extension-samples/tree/main/fsconsumer-sample)
- [Diagnostic Related Information Generator](https://github.com/microsoft/vscode-extension-samples/tree/main/diagnostic-related-information-sample)
- [Document Editing](https://github.com/microsoft/vscode-extension-samples/tree/main/document-editing-sample)
- [Text Decorator](https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample)

Others worth mentioning:

- [Custom Data](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-data-sample)
- [FileSystem Provider (MemFS)](https://github.com/microsoft/vscode-extension-samples/tree/main/fsprovider-sample)
- [Configuration](https://github.com/microsoft/vscode-extension-samples/tree/main/configuration-sample)
- [Tabs API (Manipulate editor tabs)](https://github.com/microsoft/vscode-extension-samples/tree/main/tabs-api-sample)

### Documentation
- [VS Code API](https://code.visualstudio.com/api/references/vscode-api)
- [Contribution Points](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)
