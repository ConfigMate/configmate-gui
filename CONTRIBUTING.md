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

### Running the Extension Locally

- Press `F5` to run the extension in a new VS Code window.
- To see the changes you make to files in this instance of the extension, use `Developer: Reload Window`, which is accessed from the Command Palette (`Ctrl+Shift+P`).

### NPM Scripts
From a terminal, navigate to the project directory and run
- `npm run compile` to compile the extension (builds without running).
- `npm run watch` to watch for changes (builds without running, will rebuild on file change).
- `npm run test` to watch for changes and run tests against the compiled extension.

## Reporting Bugs or Suggesting Features

Please use the [GitHub issue tracker](https://github.com/ConfigMate/configmate-gui/issues) to report bugs or suggest features.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the `CHANGELOG.md` with details of changes, including:
    - New features
    - Bug fixes
    - Breaking changes
3. Your PR will be reviewed by one of the maintainers, who might suggest some changes or improvements.

Thank you for your contributions!