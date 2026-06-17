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
  assert.doesNotMatch(result.optimized, /Recommended model/);
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
  assert.equal(result.model.selected.label, "GPT-5.4");
  assert.match(result.optimized, /Model suggestion:\n- Recommended: GPT-5.4/);
  assert.doesNotMatch(result.optimized, /Endpoint contracts/);
  assert.ok(result.optimized.length < 1250);
});

test("recognizes prompt engineering tasks and keeps rewrites compact", () => {
  const result = optimizePrompt("As a prompt engineer, make this prmpt better and much smaller.");

  assert.equal(result.template.id, "prompt-engineering");
  assert.equal(result.agent.primary.id, "prompt-architect");
  assert.equal(result.agent.suggestion.primary, "Principal Prompt Architect");
  assert.equal(result.model.selected.label, "GPT-5.4");
  assert.match(result.optimized, /Principal Prompt Architect/);
  assert.match(result.optimized, /Agent suggestion:\n- Primary: Principal Prompt Architect/);
  assert.doesNotMatch(result.optimized, /Recommended model/);
  assert.ok(result.optimized.length < 1100);
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
  assert.equal(result.agent.suggestion.summary, "Senior QA Automation Engineer; collaborate with Principal Backend Engineer where relevant.");
  assert.match(result.optimized, /Act as a Senior QA Automation Engineer/);
  assert.match(result.optimized, /Agent suggestion:\n- Primary: Senior QA Automation Engineer\n- Supporting: Principal Backend Engineer/);
  assert.match(result.optimized, /Model suggestion:/);
  assert.doesNotMatch(result.optimized, /Recommended model/);
  assert.match(result.optimized, /Must cover/);
});

test("agent suggestion travels with prompt output for mixed prompt architecture work", () => {
  const result = optimizePrompt("I am not seeing now it is providing agent suggestion with prompt", {
    languages: ["JavaScript"],
    frameworks: ["Node.js"],
    workspaceNames: ["Prompt-Architect"]
  });

  assert.equal(result.agent.primary.id, "prompt-architect");
  assert.deepEqual(result.agent.suggestion.supporting, ["Principal Backend Engineer", "AI/RAG Systems Engineer"]);
  assert.match(result.optimized, /Agent suggestion:/);
  assert.match(result.optimized, /- Primary: Principal Prompt Architect/);
  assert.match(result.optimized, /- Supporting: Principal Backend Engineer, AI\/RAG Systems Engineer/);
});

test("compares concrete model token estimates for implementation", () => {
  const result = optimizePrompt("Design a production RAG agent with API integration, tests, and deployment.", {
    languages: ["JavaScript"],
    frameworks: ["Node.js"],
    hasDocker: true,
    hasCi: true
  });

  assert.equal(result.model.id, "advanced-reasoning-coding-model");
  assert.equal(result.model.selected.label, "GPT-5.5");
  assert.equal(result.modelComparison.recommended.label, "GPT-5.5");
  assert.equal(result.modelComparison.options.length, 4);
  assert.ok(result.modelComparison.options.every((option) => option.estimatedPromptTokens === result.tokens.after));
  assert.ok(result.modelComparison.options.every((option) => option.estimatedImplementationTokens > 0));
  assert.ok(result.modelComparison.options.some((option) => option.label === "Claude Opus"));
  assert.ok(result.modelComparison.options.some((option) => option.label === "Claude Haiku"));
});
