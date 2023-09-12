# ConfigMate GUI

[ConfigMate](https://github.com/ConfigMate/configmate)itself is a open-source CLI tool that allows developers to automate the verification of configuration files.  
This extension aims to make the use of this tool more intuitive and user-friendly, particularly for newer developers.

## Table of Contents

- 🌟 [Features](#features)
- :rainbow: [Development](#development)
- :crown: [Production](#production)
- 👏 [Contributors](#contributors)
- :memo: [License](#license)


## Features
- **Access to the ConfigMate CLI**: Easily run configuration checks directly from your Terminal.
- **Rulebook Management**: Define your own custom rules and manage predefined rulesets to create truly customized configuration checks.
- **Config File Management**: Manage config files within the current project, and select from within your rulebook to limit the scope of your checks.
- **In-Editor Validation and Error Highlighting**:  View in-editor error highlighting and descriptions when writing rulebooks and config files.


## Development

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

## Production

### Publishing the Extension

All deployment and hosting is handled by Azure DevOps, which is a requirement for publishing an extension to the [VS Code Marketplace](https://marketplace.visualstudio.com/).  
Deployment to the VS Code Marketplace is handled by the [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) CLI tool.  
Running `vsce publish` pushes an update to the Marketplace via Azure DevOps.  
This link is established behind the scenes using a [Personal Access Token](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops), which serves as a password when logging in as a VS Code Publisher via `vsce login <publisher name>`.  

### CI/CD

Azure DevOps Pipelines are used to automate the build and deployment of the extension.  
The pipeline is triggered by a commit to the `main` branch of the repo.  
Building the ConfigMate GUI requires a series of tasks:
- Import, compile, run, and host the ConfigMate core program
- Install dependencies for the extension itself
- Compile the extension
- Publish the extension to the VS Code Marketplace


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