# ConfigMate GUI

[ConfigMate](https://github.com/ConfigMate/configmate)itself is a open-source CLI tool that allows developers to automate the verification of configuration files.  
This extension aims to make the use of this tool more intuitive and user-friendly, particularly for newer developers.

## Table of Contents

- 🌟 [Features](#features)
- 👏 [Contributors](#contributors)
- :memo: [License](#license)


## Features
- **Access to the ConfigMate CLI**: Easily run configuration checks directly from your command line.
- **Rulebook Management**: Define your own custom rules and manage predefined rulesets to create truly customized configuration checks.
- **Config File Management**: Manage config files within the current project, and select from within your rulebook to limit the scope of your checks.
- **In-Editor Validation and Error Highlighting**:  View in-editor error highlighting and descriptions when writing rulebooks and config files.


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


## Contributors
Thanks go to these wonderful people

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/javier-arango" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/58098790?s=60" width="60px;"/><br />
        <sub><b>Javier Arango</b></sub>
      </a><br />
    </td>
    <td align="center">
      <a href="https://github.com/Jcabza008" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/34218922?s=60" width="60px;"/><br />
        <sub><b>Julio J. Cabrera</b></sub>
      </a><br />
    </td>
    <td align="center">
      <a href="https://github.com/jeangregorfonrose" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/21975726?s=60" width="60px;"/><br />
        <sub><b>Jean Gregor Fonrose</b></sub>
      </a><br />
    </td>
    <td align="center">
      <a href="https://github.com/ktminks" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/19628386?s=60" width="60px;"/><br />
        <sub><b>Katie Minckler</b></sub>
      </a><br />
    </td>
  </tr>
</table>


## License
[MIT](https://github.com/ConfigMate/configmate/blob/master/LICENSE)