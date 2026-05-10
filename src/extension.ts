import * as vscode from 'vscode';
import * as path from 'path';

function getReference(editor: vscode.TextEditor, includeCode: boolean): string {
  const document = editor.document;
  const selection = editor.selection;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  let filePath: string;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootFolder = workspaceFolders[0];
    const relativePath = path.relative(rootFolder.uri.fsPath, document.uri.fsPath);
    if (relativePath.startsWith('..')) {
      // File is outside the workspace root — strip leading ../ and use path directly
      filePath = `@${relativePath.replace(/^(\.\.[\\/])+/, '')}`;
    } else {
      filePath = `@${rootFolder.name}/${relativePath}`;
    }
  } else {
    filePath = `@${document.uri.fsPath}`;
  }

  const startLine = selection.start.line + 1;
  const endLine = selection.end.line + 1;

  const lineRef = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
  const reference = `${filePath}:${lineRef}`;

  if (!includeCode || selection.isEmpty) {
    return reference;
  }

  const selectedText = document.getText(selection);
  const lang = document.languageId;
  return `${reference}\n\`\`\`${lang}\n${selectedText}\n\`\`\``;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('copy-for-claude.copyReference', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const text = getReference(editor, false);
      await vscode.env.clipboard.writeText(text);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('copy-for-claude.copyReferenceWithCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const text = getReference(editor, true);
      await vscode.env.clipboard.writeText(text);
    })
  );
}

export function deactivate() {}
