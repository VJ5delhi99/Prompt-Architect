# AI Prompt Architect

AI Prompt Architect is a VS Code and Cursor-compatible extension prototype that reviews weak AI coding prompts before you send them. It scores prompt quality, detects missing details, rewrites the prompt with workspace context, estimates token usage, recommends an agent role, and records local acceptance analytics.
 

## What It Does

- Scores prompt quality from 0-100.
- Detects missing context, constraints, architecture, output format, testing, security, and deployment expectations.
- Enriches prompts using workspace signals such as languages, frameworks, package files, Docker files, database hints, and cloud hints.
- Rewrites prompts using compact specialized templates for prompt engineering, software, AI, testing, and documentation work.
- Selects an appropriate agent role, such as Prompt Architect, Solution Architect, Backend Engineer, Frontend Engineer, DevOps Engineer, Security Engineer, QA Engineer, AI/RAG Engineer, or Technical Writer.
- Estimates token usage before and after optimization, including when a vague prompt expands for clarity.
- Lets the developer choose: use optimized prompt, edit optimized prompt, or use original prompt.
- Provides a pre-send chat panel where prompts are reviewed before being copied into the assistant chat.
- Stores local learning data for accepted, edited, and rejected suggestions.
- Provides a dashboard webview for usage metrics.

## Why This Workflow Exists

VS Code, Cursor, and similar editors do not expose a universal API that can intercept every prompt before it reaches Copilot, Codex, Claude Code, or another assistant. This extension uses the supported workflow:

1. Write or select the prompt.
2. Run Prompt Architect.
3. Review the improved prompt.
4. Copy the selected version into your target assistant.

For a closer pre-send workflow, use `Prompt Architect: Open Pre-Send Chat`. Type your message there, review the optimized prompt, then choose whether to use the optimized, edited, or original version.

## Screenshots

### Pre-Send Chat

Use this panel when you want to review a prompt before sending it to an AI assistant.
 
### Prompt Quality Review

The review panel shows the quality score, recommended agent, recommended assistant type, token estimates, issues found, and the optimized prompt.
 

## Installation

### Option 1: Run From Source

1. Open this repository in VS Code.
2. Install dependencies if needed:

   ```powershell
   npm.cmd install
   ```

3. Press `F5` to start an Extension Development Host.
4. In the new VS Code window, open the Command Palette with `Ctrl+Shift+P`.
5. Run `Prompt Architect: Open Pre-Send Chat`.

### Option 2: Install the VSIX Locally

1. Build or use the packaged `.vsix` file from this repository, for example `ai-prompt-architect-0.1.4.vsix`.
2. In VS Code, open the Command Palette.
3. Run `Extensions: Install from VSIX...`.
4. Select the `.vsix` file.
5. Reload VS Code if prompted.

## Commands

| Command | Use it when |
| --- | --- |
| `Prompt Architect: Open Pre-Send Chat` | You want a full prompt review panel before sending a chat message. |
| `Prompt Architect: Optimize Prompt` | You selected prompt text in an editor and want an optimized version copied to the clipboard. |
| `Prompt Architect: Review Prompt Quality` | You want a detailed review panel without immediately choosing a copied prompt. |
| `Prompt Architect: Open Dashboard` | You want to view local usage metrics for accepted, edited, and original prompts. |

The extension also adds:

- Activity Bar view: `Prompt Architect`
- Status bar shortcut: `$(comment-discussion) Prompt Architect`
- Keyboard shortcut: `Ctrl+Alt+P` on Windows/Linux, `Cmd+Alt+P` on macOS
- Editor context menu actions when text is selected

## How To Use

### A. Pre-Send Chat Workflow

1. Start the extension with `F5`, or install the `.vsix`.
2. Open `Prompt Architect: Open Pre-Send Chat` from the Command Palette.
3. Type the prompt you planned to send.
4. Click `Review Before Sending`.
5. Review:
   - prompt score
   - token estimate
   - recommended agent
   - recommended assistant type
   - model token comparison
   - missing prompt details
   - optimized prompt
6. Choose one action:
   - `Use Optimized Prompt`
   - `Edit Optimized Prompt`
   - `Ignore Suggestion and Use Original`
7. The selected prompt is copied to the clipboard.
8. Paste it into Copilot Chat, Codex, Claude Code, Cursor chat, or another assistant.

### B. Optimize Selected Text

1. Open any file.
2. Select a prompt, for example:

   ```text
   fix login bug
   ```

3. Right-click and choose `Prompt Architect: Optimize Prompt`, or run the command from the Command Palette.
4. Pick one of the options shown in the quick pick:
   - `Use Optimized Prompt`
   - `Edit Optimized Prompt`
   - `Use Original Prompt`
5. Paste the copied prompt into your assistant.

### C. Review Without Copying

1. Select a prompt in the editor.
2. Run `Prompt Architect: Review Prompt Quality`.
3. Read the side-by-side review panel.
4. Copy the optimized prompt manually if you want to use it.

### D. View Local Metrics

1. Run `Prompt Architect: Open Dashboard`.
2. Review accepted, edited, original-used, average score, and template usage counts.

Learning data is stored locally through VS Code extension state. It is not sent to a remote service by this extension.

## Sample Input And Output

### Input Prompt

```text
fix login bug
```

### Review Summary

```text
Prompt Score: 0/100
Recommended agent: Principal Backend Engineer
Recommended assistant type: GPT-5.4
Estimated tokens: 4 -> 206
Token change: Expanded by 5050% for clarity.
```

### Issues Found

```text
Missing business context
Missing technical requirements
Missing expected output
Missing constraints
Missing architecture guidance
Missing testing expectations
Missing security expectations
Missing deployment expectations
Missing sufficient detail
Missing ambiguity reduction
```

### Optimized Prompt

```text
Act as a Principal Backend Engineer.

Agent suggestion:
- Primary: Principal Backend Engineer

Model suggestion:
- Recommended: GPT-5.4
- Why: The request needs code understanding and validation, but not maximum-depth architecture reasoning.

Task: fix login bug

Rewrite or execute this as a clear, scoped request. Preserve intent, remove filler, and avoid adding unrelated work.

Project context:
- Workspace: Prompt-Architect
- Active file: src/extension.js
- Languages: JavaScript
- Frameworks: Node.js

Output (Code Change):
- Goal
- Relevant files or behavior
- Implementation steps
- Tests or validation

Must cover:
- design backend implementation
- define data and API contracts
- Missing business context
- Missing technical requirements
- Missing expected output

Rules:
- Ask only if a missing detail would change the implementation materially.
- Prefer clear architecture boundaries.
- Include tests for user-facing behavior.

Return the smallest useful answer with validation steps and the expected result.
```

## Configuration

You can configure Prompt Architect from VS Code settings.

| Setting | Default | Description |
| --- | --- | --- |
| `promptArchitect.defaultDecision` | `optimized` | Default recommendation shown after prompt optimization. |
| `promptArchitect.organizationStandards` | Clear architecture, tests, security/operations | Standards included when rewriting prompts. |
| `promptArchitect.enableLearning` | `true` | Tracks accepted, edited, and rejected optimizations locally. |
| `promptArchitect.openChatAfterCopy` | `true` | Opens VS Code chat after copying the selected prompt when the editor exposes that command. |

Example settings:

```json
{
  "promptArchitect.organizationStandards": [
    "Follow the existing codebase style.",
    "Include tests for user-facing behavior.",
    "Call out security and operational concerns."
  ],
  "promptArchitect.openChatAfterCopy": true
}
```

## Recommended Assistant Type

For Senior Principal Prompt Architect work, use the strongest available reasoning-capable assistant in your target tool when the prompt needs repository awareness, implementation planning, review, security, testing, deployment, or architecture tradeoffs.

Use a lighter or faster assistant for low-risk prompt cleanup, copy editing, formatting, or shortening. The extension recommends an assistant type instead of naming a specific vendor model so suggestions do not become stale.

## Development

Run tests:

```powershell
npm.cmd run test
```

Run syntax checks:

```powershell
npm.cmd run lint
```

Package the extension:

```powershell
npx.cmd @vscode/vsce package
```

Install locally in VS Code by opening this folder and pressing `F5` from an extension host-capable VS Code environment.
