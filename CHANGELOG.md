# Changelog

All notable changes to **Copy for Claude** will be documented here.

## [0.1.3] - 2026-05-24

### Added
- Document link support for `@workspace/path/to/file.ts:line` references.
- Clicking a reference opens the target file and highlights the requested line range.
- Supports workspace-prefixed file references and line-range notation.
- Shows confirmation messages when references are copied: `Reference copied` and `Reference with code copied`.

## [0.1.0] - 2025-05-10

### Added
- `Copy for Claude: Copy File & Lines` command (`Ctrl+Shift+C` / `Cmd+Shift+C`) — copies a `@workspace/file:line` reference to the clipboard.
- `Copy for Claude: Copy File, Lines & Code` command (`Ctrl+Shift+X` / `Cmd+Shift+X`) — copies the reference plus the selected code in a fenced code block.
- Both commands available in the editor right-click context menu.
- Handles files outside the workspace root by stripping leading `../` segments.
- Collapses single-line selections to a single line number (`file:42`) rather than a range (`file:42-42`).
