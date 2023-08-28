# writing VScode extensions

## Resources

- [Microsoft repo of sample extensions (that work)](https://github.com/microsoft/vscode-extension-samples)
- [microsoft's "my first extension" tutorial](https://code.visualstudio.com/api/get-started/your-first-extension)
- [short vid on microsoft's "my first extension" tutorial](https://www.youtube.com/watch?v=4tk0Ak-dEjs)
- [longer vid on a larger svelte extension](https://www.youtube.com/watch?v=a5DX5pQ9p5M)

## Prerequisites

- node/npm
- git
- yeoman
- VScode extension generator

```bash
npm install -g yo generator-code
```

*Note: This **does not work**! Code generated this way doesn't compile/run -- likely due to broken dependencies. For now, use sample extensions from the link above. Leaving this info here because this tool does generate test files that the sample extensions don't have.*

## Create a new extension

```bash
yo code
```

### File structure generated

```bash
.
├── .vscode
│   └── launch.json
├── .gitignore
├── .vscodeignore
├── CHANGELOG.md
├── README.md
├── package.json
├── src
│   └── extension.ts
├── test
│   └── extension.test.ts
└── tsconfig.json
```

## extension.ts code structure

Majority of code will be in `extension.ts`, in the `activate` function, within the callback of the `vscode.commands.registerCommand` function. This command is defined in the `package.json` file, and must be implemented here. Every time your command is executed, this callback will be called.

## Run the extension

- `npm run compile` to compile the extension
- `npm run watch` to watch for changes
- `F5` to run the extension in a new VScode window
  - `Ctrl+Shift+P` to open the command palette
    - `Hello World` to run the command
  - Note that if you make changes to the extension, you will need to reload the window to see the changes

## Examples

### Hello World

```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "hello-world" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World!");
    }
  );

  context.subscriptions.push(disposable);
}
```

### Get selected text

```typescript
import fetch from "node-fetch";
...
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "synonym-finder" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "extension.synonymFinder",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("editor does not exist");
        return;
      }

      const text = editor.document.getText(editor.selection);
      // vscode.window.showInformationMessage(`selected text: ${text}`);
      const response = await fetch(
        `https://api.datamuse.com/words?ml=${text.replace(" ", "+")}`
      );
      const data = await response.json();
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = data.map((x: any) => ({ label: x.word }));
      quickPick.onDidChangeSelection(([item]) => {
        if (item) {
          // vscode.window.showInformationMessage(item.label);
          editor.edit(edit => {
            edit.replace(editor.selection, item.label);
          });
          quickPick.dispose();
        }
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}
```
