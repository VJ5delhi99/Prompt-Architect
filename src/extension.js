const vscode = require("vscode");
const { optimizePrompt } = require("./core/rewriter");
const { detectWorkspaceContext } = require("./core/contextDetector");
const { LearningStore } = require("./core/learningStore");

function activate(context) {
  const output = vscode.window.createOutputChannel("Prompt Architect");

  context.subscriptions.push(
    output,
    vscode.commands.registerCommand("promptArchitect.openPreSendChat", () => runSafely(output, () => openPreSendChat(context))),
    vscode.commands.registerCommand("promptArchitect.optimizePrompt", () => runSafely(output, () => optimizeSelectedPrompt(context))),
    vscode.commands.registerCommand("promptArchitect.reviewPrompt", () => runSafely(output, () => reviewSelectedPrompt())),
    vscode.commands.registerCommand("promptArchitect.openDashboard", () => runSafely(output, () => openDashboard(context))),
    vscode.window.registerWebviewViewProvider("promptArchitect.actions", new ActionsViewProvider()),
    createStatusBarItem()
  );
}

function openPreSendChat(extensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "promptArchitectPreSendChat",
    "Prompt Architect Pre-Send Chat",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: []
    }
  );

  panel.webview.html = renderPreSendChat(panel.webview);

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      if (!message || !message.type) {
        return;
      }

      if (message.type === "review") {
        const prompt = String(message.prompt || "").trim();
        if (!prompt) {
          panel.webview.postMessage({ type: "error", message: "Enter a chat prompt first." });
          return;
        }

        const optimization = await createOptimization(prompt);
        panel.webview.postMessage({
          type: "reviewResult",
          optimization: serializeOptimization(optimization)
        });
        return;
      }

      if (message.type === "usePrompt") {
        const text = String(message.prompt || "").trim();
        if (!text) {
          panel.webview.postMessage({ type: "error", message: "Selected prompt is empty." });
          return;
        }

        const config = vscode.workspace.getConfiguration("promptArchitect");
        const store = new LearningStore(extensionContext.globalState, config.get("enableLearning", true));
        const optimization = await createOptimization(String(message.original || text));
        await store.record(message.decision || "accepted", optimization);

        await vscode.env.clipboard.writeText(text);
        if (config.get("openChatAfterCopy", true)) {
          await openAssistantChat();
        }

        vscode.window.showInformationMessage("Prompt copied. Paste it into your assistant chat input.");
      }
    } catch (error) {
      panel.webview.postMessage({ type: "error", message: getErrorMessage(error) });
    }
  });
}

async function optimizeSelectedPrompt(extensionContext) {
  const prompt = await getPromptText();
  if (!prompt) {
    vscode.window.showInformationMessage("Select a prompt or enter one to optimize.");
    return;
  }

  const optimization = await createOptimization(prompt);
  const config = vscode.workspace.getConfiguration("promptArchitect");
  const store = new LearningStore(extensionContext.globalState, config.get("enableLearning", true));

  const choice = await vscode.window.showQuickPick(
    [
      { label: "Use Optimized Prompt", decision: "accepted" },
      { label: "Edit Optimized Prompt", decision: "edited" },
      { label: "Use Original Prompt", decision: "original" }
    ],
    {
      title: `Prompt Score: ${optimization.analysis.score}/100`,
      placeHolder: optimization.analysis.issues.slice(0, 3).join("; ") || "Prompt looks strong."
    }
  );

  if (!choice) {
    return;
  }

  await store.record(choice.decision, optimization);

  if (choice.decision === "original") {
    await vscode.env.clipboard.writeText(optimization.original);
    vscode.window.showInformationMessage("Original prompt copied to clipboard.");
    return;
  }

  if (choice.decision === "edited") {
    const edited = await vscode.window.showInputBox({
      title: "Edit optimized prompt",
      value: optimization.optimized,
      ignoreFocusOut: true
    });

    if (edited) {
      await vscode.env.clipboard.writeText(edited);
      vscode.window.showInformationMessage("Edited optimized prompt copied to clipboard.");
    }
    return;
  }

  await vscode.env.clipboard.writeText(optimization.optimized);
  showOptimizationSummary(optimization);
}

async function reviewSelectedPrompt() {
  const prompt = await getPromptText();
  if (!prompt) {
    vscode.window.showInformationMessage("Select a prompt or enter one to review.");
    return;
  }

  const optimization = await createOptimization(prompt);
  const panel = vscode.window.createWebviewPanel(
    "promptArchitectReview",
    "Prompt Quality Review",
    vscode.ViewColumn.Beside,
    { enableScripts: false, localResourceRoots: [] }
  );

  panel.webview.html = renderReview(panel.webview, optimization);
}

async function createOptimization(prompt) {
  const config = vscode.workspace.getConfiguration("promptArchitect");
  const workspaceContext = await detectWorkspaceContext(vscode);
  return optimizePrompt(prompt, workspaceContext, {
    standards: config.get("organizationStandards", [])
  });
}

async function getPromptText() {
  const editor = vscode.window.activeTextEditor;
  if (editor && !editor.selection.isEmpty) {
    return editor.document.getText(editor.selection).trim();
  }

  return vscode.window.showInputBox({
    title: "Prompt Architect",
    prompt: "Enter the prompt to optimize",
    ignoreFocusOut: true
  });
}

function showOptimizationSummary(optimization) {
  const message = [
    `Optimized prompt copied. Score: ${optimization.analysis.score}/100.`,
    `Recommended model: ${optimization.model.label}.`,
    `Estimated tokens: ${optimization.tokens.before} -> ${optimization.tokens.after}.`,
    `Reduction: ${optimization.tokens.reduction}%.`
  ].join(" ");

  vscode.window.showInformationMessage(message);
}

function renderReview(webview, optimization) {
  return htmlPage(webview, "Prompt Quality Review", `
    <h1>Prompt Quality Review</h1>
    <section>
      <h2>Score</h2>
      <p class="score">${optimization.analysis.score}/100</p>
    </section>
    <section>
      <h2>Recommended Agent</h2>
      <p>${escapeHtml(optimization.agent.primary.title)}</p>
    </section>
    <section>
      <h2>Recommended Agentic Model</h2>
      <p><strong>${escapeHtml(optimization.model.label)}</strong></p>
      <p>${escapeHtml(optimization.model.useFor)}</p>
      <p>${escapeHtml(optimization.model.rationale)}</p>
    </section>
    <section>
      <h2>Issues Found</h2>
      <ul>${optimization.analysis.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Token Estimate</h2>
      <p>${optimization.tokens.before} before, ${optimization.tokens.after} after, ${optimization.tokens.reduction}% reduction.</p>
    </section>
    <section>
      <h2>Optimized Prompt</h2>
      <pre>${escapeHtml(optimization.optimized)}</pre>
    </section>
  `);
}

function renderPreSendChat(webview) {
  const nonce = getNonce();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Architect Pre-Send Chat</title>
  <style>
    body { background: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); line-height: 1.5; margin: 0; }
    main { display: grid; gap: 16px; min-height: 100vh; padding: 20px; }
    h1 { font-size: 22px; margin: 0; }
    textarea { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 6px; box-sizing: border-box; color: var(--vscode-input-foreground); font: inherit; min-height: 160px; padding: 12px; resize: vertical; width: 100%; }
    button { background: var(--vscode-button-background); border: 0; border-radius: 4px; color: var(--vscode-button-foreground); cursor: pointer; font: inherit; padding: 9px 13px; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    button.ghost { background: transparent; border: 1px solid var(--vscode-button-border); color: var(--vscode-foreground); }
    button:disabled { cursor: not-allowed; opacity: 0.6; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .panel { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 14px; }
    .meta { color: var(--vscode-descriptionForeground); display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0 0; }
    .hidden { display: none; }
    pre { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px; overflow: auto; padding: 12px; white-space: pre-wrap; }
    ul { margin-top: 8px; }
  </style>
</head>
<body>
  <main>
    <h1>Pre-Send Chat</h1>
    <section>
      <textarea id="prompt" placeholder="Type the chat you want to send..."></textarea>
      <div class="actions">
        <button id="review">Review Before Sending</button>
      </div>
    </section>
    <section id="result" class="panel hidden">
      <strong id="score"></strong>
      <div id="meta" class="meta"></div>
      <div id="agent" class="meta"></div>
      <div id="model" class="meta"></div>
      <div>
        <strong>Issues found</strong>
        <ul id="issues"></ul>
      </div>
      <div>
        <strong>Optimized prompt</strong>
        <pre id="optimized"></pre>
      </div>
      <div class="actions">
        <button id="useOptimized">Use Optimized Prompt</button>
        <button id="editOptimized" class="secondary">Edit Optimized Prompt</button>
        <button id="useOriginal" class="ghost">Ignore Suggestion and Use Original</button>
      </div>
    </section>
    <section id="editPanel" class="panel hidden">
      <strong>Edit optimized prompt</strong>
      <textarea id="edited"></textarea>
      <div class="actions">
        <button id="useEdited">Use Edited Prompt</button>
      </div>
    </section>
  </main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const promptEl = document.getElementById("prompt");
    const reviewEl = document.getElementById("review");
    const resultEl = document.getElementById("result");
    const editPanelEl = document.getElementById("editPanel");
    const scoreEl = document.getElementById("score");
    const metaEl = document.getElementById("meta");
    const agentEl = document.getElementById("agent");
    const modelEl = document.getElementById("model");
    const issuesEl = document.getElementById("issues");
    const optimizedEl = document.getElementById("optimized");
    const editedEl = document.getElementById("edited");
    let current = null;

    reviewEl.addEventListener("click", () => {
      reviewEl.disabled = true;
      reviewEl.textContent = "Reviewing...";
      vscode.postMessage({ type: "review", prompt: promptEl.value });
    });

    document.getElementById("useOptimized").addEventListener("click", () => {
      if (current) sendPrompt(current.optimized, "accepted");
    });

    document.getElementById("editOptimized").addEventListener("click", () => {
      if (!current) return;
      editedEl.value = current.optimized;
      editPanelEl.classList.remove("hidden");
      editedEl.focus();
    });

    document.getElementById("useEdited").addEventListener("click", () => {
      sendPrompt(editedEl.value, "edited");
    });

    document.getElementById("useOriginal").addEventListener("click", () => {
      if (current) sendPrompt(current.original, "original");
    });

    function sendPrompt(prompt, decision) {
      vscode.postMessage({
        type: "usePrompt",
        prompt,
        original: current ? current.original : prompt,
        decision
      });
    }

    window.addEventListener("message", (event) => {
      const message = event.data;
      reviewEl.disabled = false;
      reviewEl.textContent = "Review Before Sending";

      if (message.type === "error") {
        showError(message.message);
        return;
      }

      if (message.type !== "reviewResult") {
        return;
      }

      current = message.optimization;
      scoreEl.textContent = "Prompt Score: " + current.analysis.score + "/100";
      metaEl.textContent = "Estimated tokens: " + current.tokens.before + " -> " + current.tokens.after + " | Reduction: " + current.tokens.reduction + "%";
      agentEl.textContent = "Recommended agent: " + current.agent.primary.title;
      modelEl.textContent = "Recommended agentic model: " + current.model.label + " | " + current.model.rationale;
      issuesEl.innerHTML = "";
      current.analysis.issues.forEach((issue) => {
        const item = document.createElement("li");
        item.textContent = issue;
        issuesEl.appendChild(item);
      });
      optimizedEl.textContent = current.optimized;
      resultEl.classList.remove("hidden");
      editPanelEl.classList.add("hidden");
    });

    function showError(message) {
      resultEl.classList.remove("hidden");
      scoreEl.textContent = "Review needed";
      metaEl.textContent = message;
      agentEl.textContent = "";
      modelEl.textContent = "";
      issuesEl.innerHTML = "";
      optimizedEl.textContent = "";
    }
  </script>
</body>
</html>`;
}

function openDashboard(extensionContext) {
  const config = vscode.workspace.getConfiguration("promptArchitect");
  const store = new LearningStore(extensionContext.globalState, config.get("enableLearning", true));
  const snapshot = store.getSnapshot();
  const panel = vscode.window.createWebviewPanel(
    "promptArchitectDashboard",
    "Prompt Architect Dashboard",
    vscode.ViewColumn.One,
    { enableScripts: false, localResourceRoots: [] }
  );

  panel.webview.html = htmlPage(panel.webview, "Prompt Architect Dashboard", `
    <h1>Prompt Architect Dashboard</h1>
    <div class="grid">
      <article><strong>${snapshot.accepted}</strong><span>Accepted</span></article>
      <article><strong>${snapshot.edited}</strong><span>Edited</span></article>
      <article><strong>${snapshot.original}</strong><span>Original Used</span></article>
      <article><strong>${snapshot.averageScore}</strong><span>Average Score</span></article>
    </div>
    <section>
      <h2>Template Usage</h2>
      <ul>${Object.entries(snapshot.templates).map(([key, value]) => `<li>${escapeHtml(key)}: ${value}</li>`).join("") || "<li>No usage recorded yet.</li>"}</ul>
    </section>
  `);
}

async function openAssistantChat() {
  try {
    await vscode.commands.executeCommand("workbench.action.chat.open");
  } catch (_error) {
    // Some VS Code-compatible editors do not expose the built-in chat command.
  }
}

function serializeOptimization(optimization) {
  return {
    original: optimization.original,
    optimized: optimization.optimized,
    analysis: optimization.analysis,
    agent: optimization.agent,
    model: optimization.model,
    template: optimization.template,
    tokens: optimization.tokens,
    recommendation: optimization.recommendation
  };
}

class ActionsViewProvider {
  resolveWebviewView(webviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };
    webviewView.webview.html = this.render(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message && message.command) {
        vscode.commands.executeCommand(message.command);
      }
    });
  }

  render(webview) {
    const nonce = getNonce();
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Architect</title>
  <style>
    body { color: var(--vscode-foreground); font-family: var(--vscode-font-family); padding: 12px; }
    button { background: var(--vscode-button-background); border: 0; border-radius: 4px; color: var(--vscode-button-foreground); cursor: pointer; margin-bottom: 8px; padding: 8px 10px; width: 100%; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    p { color: var(--vscode-descriptionForeground); margin: 0 0 12px; }
  </style>
</head>
<body>
  <p>Review prompts before they reach your assistant.</p>
  <button id="preSend">Open Pre-Send Chat</button>
  <button id="dashboard" class="secondary">Open Dashboard</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById("preSend").addEventListener("click", () => {
      vscode.postMessage({ command: "promptArchitect.openPreSendChat" });
    });
    document.getElementById("dashboard").addEventListener("click", () => {
      vscode.postMessage({ command: "promptArchitect.openDashboard" });
    });
  </script>
</body>
</html>`;
  }
}

function htmlPage(webview, title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { color: var(--vscode-foreground); font-family: var(--vscode-font-family); line-height: 1.5; padding: 24px; }
    h1 { font-size: 28px; margin: 0 0 20px; }
    h2 { font-size: 16px; margin: 22px 0 8px; }
    pre { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px; overflow: auto; padding: 16px; white-space: pre-wrap; }
    .score { font-size: 32px; font-weight: 700; margin: 0; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    article { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 16px; }
    article strong { display: block; font-size: 28px; }
    article span { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>${body}</body>
</html>`;
}

function createStatusBarItem() {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = "$(comment-discussion) Prompt Architect";
  item.tooltip = "Open Prompt Architect pre-send chat";
  item.command = "promptArchitect.openPreSendChat";
  item.show();
  return item;
}

async function runSafely(output, action) {
  try {
    await action();
  } catch (error) {
    const message = getErrorMessage(error);
    output.appendLine(`[${new Date().toISOString()}] ${message}`);
    if (error && error.stack) {
      output.appendLine(error.stack);
    }
    vscode.window.showErrorMessage(`Prompt Architect failed: ${message}`);
  }
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error || "Unknown error");
}

function getNonce() {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let index = 0; index < 32; index += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
