const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

test("extension manifest exposes required commands", () => {
  const commandIds = packageJson.contributes.commands.map((command) => command.command);

  assert.ok(commandIds.includes("promptArchitect.openPreSendChat"));
  assert.ok(commandIds.includes("promptArchitect.optimizePrompt"));
  assert.ok(commandIds.includes("promptArchitect.reviewPrompt"));
  assert.ok(commandIds.includes("promptArchitect.openDashboard"));
});

test("extension manifest uses marketplace-safe categories", () => {
  const allowed = new Set([
    "Programming Languages",
    "Snippets",
    "Linters",
    "Themes",
    "Debuggers",
    "Formatters",
    "Keymaps",
    "SCM Providers",
    "Other",
    "Extension Packs",
    "Language Packs",
    "Data Science",
    "Machine Learning",
    "Visualization",
    "Testing",
    "Notebooks",
    "Education"
  ]);

  for (const category of packageJson.categories) {
    assert.equal(allowed.has(category), true, `${category} is not a valid VS Code category`);
  }
});

test("activity view has matching activation and view provider contribution", () => {
  assert.ok(packageJson.activationEvents.includes("onStartupFinished"));
  assert.equal(packageJson.contributes.views.promptArchitect[0].id, "promptArchitect.actions");
});
