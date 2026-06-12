# AI Prompt Architect

AI Prompt Architect is a VS Code and Cursor-compatible extension prototype that reviews weak AI coding prompts, scores them, rewrites them with project context, estimates token savings, and records local acceptance analytics.

## What It Does

- Scores prompt quality from 0-100.
- Detects missing context, constraints, architecture, output format, testing, security, and deployment expectations.
- Enriches prompts using workspace signals such as languages, frameworks, package files, Docker files, database hints, and cloud hints.
- Rewrites prompts using specialized templates for software, AI, testing, and documentation work.
- Selects an appropriate agent role for the task, such as Solution Architect, Backend Engineer, Frontend Engineer, DevOps Engineer, Security Engineer, QA Engineer, AI/RAG Engineer, or Technical Writer.
- Estimates token usage before and after optimization.
- Lets the developer choose: use optimized prompt, edit optimized prompt, or use original prompt.
- Provides a pre-send chat panel where prompts are reviewed before being copied into the assistant chat.
- Stores local learning data for accepted, edited, and rejected suggestions.
- Provides a dashboard webview for usage metrics.

## Platform Notes

VS Code, Cursor, and similar editors do not expose a universal API that can intercept every prompt before it reaches Copilot, Codex, Claude Code, or another assistant. This extension implements the safe, supported pattern: select or enter a prompt, run `Prompt Architect: Optimize Prompt`, then paste the result into the target assistant.

For a closer pre-send workflow, run `Prompt Architect: Open Pre-Send Chat`. Type your chat there, review the optimized prompt, then choose `Use Optimized Prompt` or `Ignore Suggestion and Use Original`. The chosen prompt is copied to the clipboard and VS Code Chat is opened when the editor exposes that command.

For Copilot, Codex CLI, Claude Code, or other assistant integrations, the reusable core in `src/core` can be wrapped by each platform's supported command, pre-submit hook, chat participant, or CLI workflow.

## Recommended Agentic Model

For Senior Principal Prompt Architect work, use the strongest available agentic reasoning model in your target assistant, with support for tool use, long context, codebase reading, structured output, and iterative refinement. In Codex, prefer a GPT-5 class coding agent model for repository-aware prompt architecture, implementation planning, and review workflows.

Use a lighter or faster model only for low-risk prompt cleanup, copy editing, or formatting. Use the senior agentic model when the prompt must reason across architecture, security, testing, deployment, product requirements, or multi-step coding changes.

## Commands

- `Prompt Architect: Open Pre-Send Chat`
- `Prompt Architect: Optimize Prompt`
- `Prompt Architect: Review Prompt Quality`
- `Prompt Architect: Open Dashboard`

## Production Workflow

1. Start the extension with `F5`.
2. Use the Prompt Architect Activity Bar icon, the status bar item, `Ctrl+Alt+P`, or the command palette.
3. Open `Prompt Architect: Open Pre-Send Chat`.
4. Enter the chat you planned to send.
5. Select `Use Optimized Prompt`, `Edit Optimized Prompt`, or `Ignore Suggestion and Use Original`.
6. Paste the copied prompt into the target assistant chat.

The extension also registers an Activity Bar view and a status bar shortcut so it is visible after startup, not only after a command has been searched manually.

## Development

Run tests:

```powershell
npm.cmd run test
```

Run syntax checks:

```powershell
npm.cmd run lint
```

Install locally in VS Code by opening this folder and pressing `F5` from an extension host-capable VS Code environment.
