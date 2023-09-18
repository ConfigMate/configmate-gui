# Contributing to ConfigMate GUI

Thank you for considering contributing to ConfigMate GUI! 🎉 This document outlines the process and guidelines for contributing.

[ConfigMate](https://github.com/ConfigMate/configmate) itself is a open-source CLI tool that allows developers to automate the verification of configuration files. This extension aims to make the use of this tool more intuitive and user-friendly, particularly for newer developers.  

## Setup for Development

### Prerequisites

- **VS Code
- **Node**: Required for managing dependencies and running scripts.

### Getting Started

1. **Clone the Repository**: `git clone https://github.com/ConfigMate/configmate-gui.git`
2. **Install Dependencies**: From a terminal, navigate to the project directory and run `npm install`.

### Running & Testing the Extension Locally

Due to the nature of developing a VS Code extension within VS Code, there are some known limitations and bugs. The following instructions should work regardless of your personal setup.

Run > Start Debugging (`F5`) will run the extension in a new VS Code window.
- This is the same as opening the Run & Debug panel (`Ctrl+Shift+D`) and hitting the play button. From here, though, you can choose which launch configuration will be triggered.
	- `Launch Extension` will compile and launch the extension.
		- To see the changes you make in this window, use `Developer: Reload Window`, which is accessed from the Command Palette (`Ctrl+Shift+P`).
	- `Test Extension` will compile and launch the extension, then run all tests before closing.
		- Results are visible in the Debug Console.
		- Add breakpoints to code (in the extension or tests) to debug.
- Launch configurations are located in `.vscode/launch.json`.

Alternatively, some npm scripts are available, but should be avoided unless necessary. Particularly, testing from the CLI is discouraged. From a terminal, navigate to the project directory and run:
- `npm run compile` to compile the extension (builds without running).
- `npm run watch` to watch for changes (builds without running, will rebuild on file change).
- `npm run test` to run tests against the compiled extension.


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

We use [ESLint](https://eslint.org/) to enforce code formatting. These tools are run automatically on commit, but you can also run them manually from the command line.

## Tests and Checks

### Writing Tests

- Write unit tests for all new functions and methods.
- For bug fixes, write a regression test to ensure the bug doesn't reappear.
- Use descriptive test case names.

### Running Tests

From the Run & Debug panel (`Ctrl+Shift+D`):
- Choose `Test Extension` from the dropdown menu of launch configurations. 
- Click the play button next to this dropdown menu, or press `F5`. This will compile and launch the extension, then run all tests before closing.
- Results are visible in the Debug Console.
- Add breakpoints to code (in the extension or tests) to debug.

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