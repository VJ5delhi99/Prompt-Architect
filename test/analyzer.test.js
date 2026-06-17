const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzePrompt } = require("../src/core/analyzer");
const { selectAgent } = require("../src/core/agentSelector");
const { optimizePrompt } = require("../src/core/rewriter");
const { detectContextFromFileList } = require("../src/core/contextDetector");

test("scores vague prompts lower than detailed prompts", () => {
  const vague = analyzePrompt("Create a microservice.");
  const detailed = analyzePrompt("Design a customer order API in .NET with PostgreSQL, authentication, tests, Docker deployment, and response contracts.");

  assert.ok(vague.score < detailed.score);
  assert.ok(vague.issues.some((issue) => issue.includes("business context")));
});

test("detects workspace context from project files", () => {
  const context = detectContextFromFileList([
    "src/App.tsx",
    "package.json",
    "docker-compose.yml",
    ".github/workflows/build.yml",
    "infra/aws/main.tf"
  ]);

  assert.deepEqual(context.languages, ["TypeScript"]);
  assert.ok(context.frameworks.includes("Node.js"));
  assert.equal(context.hasDocker, true);
  assert.equal(context.hasCi, true);
  assert.ok(context.cloud.includes("AWS"));
});

test("rewrites prompts with structure and token metadata", () => {
  const result = optimizePrompt("Create a microservice.", {
    languages: [".NET"],
    frameworks: ["ASP.NET Core"],
    databases: ["PostgreSQL"],
    workspaceNames: ["orders"],
    cloud: ["AWS"],
    hasDocker: true
  });

  assert.match(result.optimized, /Senior Solution Architect/);
  assert.match(result.optimized, /Recommended model: Advanced reasoning coding model/);
  assert.match(result.optimized, /PostgreSQL/);
  assert.equal(result.model.id, "advanced-reasoning-coding-model");
  assert.equal(result.recommendation, "Use Optimized Prompt");
  assert.ok(result.tokens.before > 0);
});

test("keeps normal extension improvement prompts concise with balanced model", () => {
  const result = optimizePrompt("Review the code and improve the VS Code extension. Make suggested prompts smaller.", {
    languages: ["JavaScript"],
    frameworks: ["Node.js"],
    workspaceNames: ["Prompt-Architect"]
  });

  assert.equal(result.template.id, "code-change");
  assert.equal(result.model.id, "balanced-coding-model");
  assert.doesNotMatch(result.optimized, /GPT-5/);
  assert.doesNotMatch(result.optimized, /Endpoint contracts/);
  assert.ok(result.optimized.length < 1400);
});

test("selects appropriate agent roles for task type", () => {
  const backend = selectAgent("Build an order API with database persistence", {}, { id: "api", label: "API" });
  const frontend = selectAgent("Create a React checkout page with loading states", {}, { id: "frontend", label: "Frontend" });
  const rag = selectAgent("Design a RAG chatbot using vector retrieval", {}, { id: "rag", label: "RAG System" });

  assert.equal(backend.primary.id, "principal-backend-engineer");
  assert.equal(frontend.primary.id, "frontend-engineer");
  assert.equal(rag.primary.id, "ai-engineer");
});

test("optimized prompt includes selected agent focus", () => {
  const result = optimizePrompt("Create integration tests for the payment API.");

  assert.equal(result.agent.primary.id, "qa-engineer");
  assert.match(result.optimized, /Act as a Senior QA Automation Engineer/);
  assert.match(result.optimized, /Recommended model/);
  assert.match(result.optimized, /Focus/);
});
