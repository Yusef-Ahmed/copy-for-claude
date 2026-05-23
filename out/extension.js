"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
function getReference(editor, includeCode) {
    const document = editor.document;
    const selection = editor.selection;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let filePath;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const rootFolder = workspaceFolders[0];
        const relativePath = path.relative(rootFolder.uri.fsPath, document.uri.fsPath);
        if (relativePath.startsWith('..')) {
            // File is outside the workspace root — strip leading ../ and use path directly
            filePath = `@${relativePath.replace(/^(\.\.[\\/])+/, '')}`;
        }
        else {
            filePath = `@${rootFolder.name}/${relativePath}`;
        }
    }
    else {
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
class ReferenceLinkProvider {
    provideDocumentLinks(document) {
        const text = document.getText();
        // @my-project/src/app.ts:10-15
        const regex = /@([^:\n]+):(\d+)(?:-(\d+))?/g;
        const links = [];
        let match;
        while ((match = regex.exec(text))) {
            const fullMatch = match[0];
            const fileRef = match[1];
            const startLine = parseInt(match[2], 10);
            const endLine = parseInt(match[3] || match[2], 10);
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                continue;
            }
            // split:
            // my-project/src/app.ts
            const firstSlash = fileRef.indexOf('/');
            if (firstSlash === -1) {
                continue;
            }
            const workspaceName = fileRef.slice(0, firstSlash);
            const relativePath = fileRef.slice(firstSlash + 1);
            const workspaceFolder = workspaceFolders.find(f => f.name === workspaceName);
            if (!workspaceFolder) {
                continue;
            }
            const fullPath = path.join(workspaceFolder.uri.fsPath, relativePath);
            const commandUri = vscode.Uri.parse(`command:copy-for-claude.openReference?${encodeURIComponent(JSON.stringify([
                fullPath,
                startLine,
                endLine
            ]))}`);
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + fullMatch.length);
            const link = new vscode.DocumentLink(new vscode.Range(startPos, endPos), commandUri);
            links.push(link);
        }
        return links;
    }
}
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('copy-for-claude.copyReference', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const text = getReference(editor, false);
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Reference copied');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('copy-for-claude.copyReferenceWithCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const text = getReference(editor, true);
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Reference with code copied');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('copy-for-claude.openReference', async (filePath, startLine, endLine) => {
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        const selection = new vscode.Selection(startLine - 1, 0, endLine - 1, Number.MAX_SAFE_INTEGER);
        editor.selection = selection;
        editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
    }));
    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider({ scheme: '*' }, new ReferenceLinkProvider()));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map