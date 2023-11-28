# Contributing to ConfigMate GUI

Thank you for considering contributing to ConfigMate GUI! 🎉 This document outlines the process and guidelines for contributing.

[ConfigMate](https://github.com/ConfigMate/configmate) itself is a open-source CLI tool that allows developers to automate the verification of configuration files. This extension aims to make the use of this tool more intuitive and user-friendly.

## Setup for Development

### Prerequisites

To be able to compile and run properly, development must occur on a Linux machine or a Windows machine with WSL setup. VS Code can be installed anywhere, but this project and its dependencies must be located on a Linux distro.

- **VS Code
- [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) with:
	- an updated OS [`sudo apt-get [update/upgrade]`]
	- [Node](https://nodejs.org/)
	- [GoLang v1.19](https://go.dev/doc/install)
	- Java JDK [`sudo apt install default-jre`]

### Getting Started

1. **Clone Language Extension**: `git clone https://github.com/ConfigMate/configmate-gui.git`
	then, from a terminal in this project root directory:
2. **Install Dependencies**: `npm install`
3. **Clone ConfigMate**: `npm run clone-api`
4. **Build ConfigMate**: `npm run build-api`

See the wiki for more information regarding these steps as well as solutions to known errors.

### Running & Compiling

- **Compile & Run in New Window (Extension Host)**: `F5`, or:
	- Run > Start Debugging
	- Run & Debug panel (`Ctrl+Shift+D`) > Launch Extension
- To see the changes you make to the code, recompile by closing the Extension Host window and rerunning.
	- If changes are made to bundling or compilation, delete /client/out and /server/out before recompiling.
- Launch configurations are located in `.vscode/launch.json`.

### Debugging

- Add breakpoints to any client-side code to debug the Extension Host. 
	- Results are visible in the Run and Debug sidebar.
	- Server-side breakpoints will not trigger.
- Debug log messages appear in different places depending on their source.
	- Client-side `console.log` messages appear in the Debug Console of the primary editor.
	- Server-side `console.log` messages appear in Output > ConfigMateServer in the Extension Host.
	- Server-side `connection.console.log` messages appear in the Debug Console of the Extension Host.
	- Additional debug logs from VS Code can be seen via Help > Toggle Developer Tools.

## Coding Standards and Style Guidelines

### General Principles

- **Readability**: Code should be self-explanatory. Use meaningful variable and function names.
- **Consistency**: Stick to the established coding patterns already in the project.
- **Comments**: Comment your code where necessary, but avoid obvious comments. Instead, aim for making the code self-documenting.

### Language-Specific Guidelines

#### JavaScript/TypeScript

- Use ES6+ syntax where possible.
- Use `const` and `let` over `var`.
- Prefer arrow functions unless you have a specific need for the `this` context of a regular function.
- Use template literals instead of string concatenation.

### Code Formatting Tools

We use [ESLint](https://eslint.org/) to enforce code formatting. These tools are run automatically on commit, but you can also run them manually from the command line with `npm run lint`.

## Reporting Bugs or Suggesting Features

Please use the [GitHub issue tracker](https://github.com/ConfigMate/configmate-gui/issues) to report bugs or suggest features.

## Pull Request Process

1. Before submitting a pull request, ensure your code has test coverage and matches the coding standards and style guidelines outlined above.
2. When you submit a pull request, CI will automatically run tests and checks on your code. Ensure all tests pass before requesting a review.
3. After submitting a pull request, one of the maintainers will review your code. Address any feedback or changes requested during the review process.
4.  Upon approval, a maintainer will update the `CHANGELOG.md` with details of changes, including:
    - New features
    - Bug fixes
    - Breaking changes  


Thank you for your contributions!