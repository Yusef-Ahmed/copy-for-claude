# Copy for Claude

A VS Code extension that copies file references — with or without selected code — directly to your clipboard, formatted for use with [Claude Code](https://claude.ai/code).

## Features

**Copy File & Lines** — copies a `@workspace/path/to/file.ts:line` reference so Claude Code can jump straight to the location.

**Copy File, Lines & Code** — copies the same reference plus the selected code wrapped in a fenced code block, ready to paste into a Claude conversation.

### Example output

Reference only:

```
@my-project/src/utils/auth.ts:42
```

Reference with code:

```
@my-project/src/utils/auth.ts:42-58

export function verifyToken(token: string): boolean {
  ...
}
```

## Usage

| Action | Windows / Linux | macOS |
|--------|----------------|-------|
| Copy reference | `Ctrl+Shift+C` | `Cmd+Shift+C` |
| Copy reference + code | `Ctrl+Shift+X` | `Cmd+Shift+X` |

Both commands are also available in the editor right-click context menu under **Copy for Claude**.

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Yusef-Ahmed.copy-for-claude), or download the `.vsix` from the [releases page](https://github.com/Yusef-Ahmed/copy-for-claude/releases) and run:

```bash
code --install-extension copy-for-claude-*.vsix
```

## License

[MIT](LICENSE.md)