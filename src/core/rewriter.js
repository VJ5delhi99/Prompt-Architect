const { analyzePrompt } = require("./analyzer");
const { selectAgent } = require("./agentSelector");
const { detectTemplate } = require("./templates");
const { estimateReduction } = require("./tokenEstimator");

const modelCatalog = [
  {
    id: "gpt-5-5",
    label: "GPT-5.5",
    tier: "advanced",
    tokenMultiplier: 1.3,
    fit: "Deep implementation, architecture, RAG, security, and complex multi-file changes."
  },
  {
    id: "claude-opus",
    label: "Claude Opus",
    tier: "advanced",
    tokenMultiplier: 1.2,
    fit: "Long-context analysis, careful refactoring, and nuanced implementation tradeoffs."
  },
  {
    id: "gpt-5-4",
    label: "GPT-5.4",
    tier: "balanced",
    tokenMultiplier: 1,
    fit: "General implementation work where quality and token efficiency both matter."
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku",
    tier: "fast",
    tokenMultiplier: 0.65,
    fit: "Small edits, prompt cleanup, quick reviews, and low-risk changes."
  }
];

function optimizePrompt(prompt, context = {}, options = {}) {
  const original = (prompt || "").trim();
  const analysis = analyzePrompt(original);
  const template = detectTemplate(original);
  const agent = selectAgent(original, context, template);
  const model = recommendAgenticModel(original, analysis, context, template);
  const standards = options.standards || [];
  const optimized = buildOptimizedPrompt(original, analysis, template, context, standards, agent, model);
  const tokens = estimateReduction(original, optimized);
  const modelComparison = compareModelConsumption(model, tokens.after, analysis, context, template);
  model.selected = modelComparison.recommended;
  model.comparison = modelComparison.options;

  return {
    original,
    optimized,
    analysis,
    agent,
    model,
    modelComparison,
    template,
    tokens,
    recommendation: "Use Optimized Prompt"
  };
}

function recommendAgenticModel(original, analysis, context = {}, template = {}) {
  const text = [
    original,
    template.id,
    template.label,
    ...(context.languages || []),
    ...(context.frameworks || []),
    ...(context.databases || []),
    ...(context.cloud || [])
  ].join(" ").toLowerCase();

  const seniorSignals = [
    "architecture",
    "security",
    "deployment",
    "multi-step",
    "agent",
    "rag",
    "production",
    "migration",
    "distributed",
    "scalable",
    "microservice",
    "cloud",
    "compliance",
    "threat model"
  ].some((keyword) => text.includes(keyword));

  const mediumSignals = [
    "refactor",
    "testing",
    "workflow",
    "api",
    "database",
    "extension",
    "maintainability",
    "reliability"
  ].some((keyword) => text.includes(keyword));

  if (seniorSignals || context.hasKubernetes || (context.hasDocker && context.hasCi)) {
    return {
      id: "advanced-reasoning-coding-model",
      tier: "advanced",
      selectedModelId: "gpt-5-5",
      label: "GPT-5.5",
      useFor: "Architecture-heavy, security-sensitive, production, migration, RAG, or multi-system changes.",
      rationale: "The request includes complexity signals that benefit from deeper planning, repository context, and careful tradeoff analysis."
    };
  }

  if (mediumSignals || analysis.score < 45 || context.hasDocker || context.hasCi) {
    return {
      id: "balanced-coding-model",
      tier: "balanced",
      selectedModelId: "gpt-5-4",
      label: "GPT-5.4",
      useFor: "Normal feature work, bug fixes, refactors, tests, and repository-aware implementation tasks.",
      rationale: "The request needs code understanding and validation, but not maximum-depth architecture reasoning."
    };
  }

  return {
    id: "fast-prompt-editor",
    tier: "fast",
    selectedModelId: "claude-haiku",
    label: "Claude Haiku",
    useFor: "Low-risk prompt cleanup, copy editing, formatting, and simple instruction tightening.",
    rationale: "The prompt appears narrow enough that a lighter model can handle it without deep architecture or repository reasoning."
  };
}

function compareModelConsumption(model, promptTokens, analysis, context = {}, template = {}) {
  const complexity = estimateImplementationComplexity(analysis, context, template);
  const options = modelCatalog.map((candidate) => {
    const implementationTokens = Math.max(1, Math.ceil(promptTokens * complexity * candidate.tokenMultiplier));
    const totalTokens = promptTokens + implementationTokens;

    return {
      id: candidate.id,
      label: candidate.label,
      tier: candidate.tier,
      fit: candidate.fit,
      estimatedPromptTokens: promptTokens,
      estimatedImplementationTokens: implementationTokens,
      estimatedTotalTokens: totalTokens,
      recommended: candidate.id === model.selectedModelId
    };
  });

  options.sort((left, right) => {
    if (left.recommended !== right.recommended) {
      return left.recommended ? -1 : 1;
    }

    return left.estimatedTotalTokens - right.estimatedTotalTokens;
  });

  return {
    recommended: options.find((option) => option.recommended) || options[0],
    options
  };
}

function estimateImplementationComplexity(analysis, context = {}, template = {}) {
  let multiplier = 4;

  if (analysis.likelyFollowUps || analysis.score < 45) multiplier += 1;
  if (["microservice", "rag", "api"].includes(template.id)) multiplier += 1;
  if (context.hasDocker || context.hasCi) multiplier += 0.5;
  if (context.hasKubernetes) multiplier += 1;
  if ((context.databases || []).length > 0) multiplier += 0.5;
  if ((context.cloud || []).length > 0) multiplier += 0.5;

  return multiplier;
}

function buildOptimizedPrompt(original, analysis, template, context, standards, agent, model) {
  const detected = describeContext(context);
  const sections = template.sections.slice(0, 4).map((section) => `- ${section}`).join("\n");
  const responsibilities = agent.primary.responsibilities.slice(0, 2).map((item) => `- ${item}`).join("\n");
  const agentSuggestion = formatAgentSuggestion(agent);
  const standardLines = (standards.length > 0
    ? standards
    : ["Follow the existing codebase style.", "Keep changes focused and maintainable."])
    .slice(0, 2)
    .map((standard) => `- ${standard}`)
    .join("\n");
  const topIssues = analysis.issues.slice(0, 3).map((issue) => `- ${issue}`).join("\n");

  return [
    agent.instruction,
    "",
    "Agent suggestion:",
    agentSuggestion,
    "",
    "Model suggestion:",
    `- Recommended: ${model.label}`,
    `- Why: ${model.rationale}`,
    "",
    `Task: ${toSingleLine(original)}`,
    "",
    "Rewrite or execute this as a clear, scoped request. Preserve intent, remove filler, and avoid adding unrelated work.",
    "",
    "Project context:",
    trimContext(detected),
    "",
    `Output (${template.label}):`,
    sections,
    "",
    "Must cover:",
    responsibilities,
    topIssues ? topIssues : "- No major gaps detected.",
    "",
    "Rules:",
    "- Ask only if a missing detail would change the implementation materially.",
    standardLines,
    "",
    "Return the smallest useful answer with validation steps and the expected result."
  ].join("\n");
}

function formatAgentSuggestion(agent) {
  const lines = [`- Primary: ${agent.suggestion.primary}`];

  if (agent.suggestion.supporting.length > 0) {
    lines.push(`- Supporting: ${agent.suggestion.supporting.join(", ")}`);
  }

  return lines.join("\n");
}

function toSingleLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimContext(contextText) {
  const lines = String(contextText || "").split("\n").filter(Boolean);
  return lines.slice(0, 5).join("\n") || "- No project metadata detected; keep assumptions explicit.";
}

function describeContext(context) {
  const lines = [];
  addLine(lines, "Workspace", context.workspaceNames);
  addLine(lines, "Active file", context.activeFile ? [context.activeFile] : []);
  addLine(lines, "Languages", context.languages);
  addLine(lines, "Frameworks", context.frameworks);
  addLine(lines, "Databases", context.databases);
  addLine(lines, "Cloud", context.cloud);

  if (context.hasDocker) lines.push("- Docker: detected");
  if (context.hasKubernetes) lines.push("- Kubernetes: detected");
  if (context.hasCi) lines.push("- CI/CD: detected");

  return lines.length > 0 ? lines.join("\n") : "- No project metadata detected; keep assumptions explicit.";
}

function addLine(lines, label, values) {
  if (values && values.length > 0) {
    lines.push(`- ${label}: ${values.join(", ")}`);
  }
}

module.exports = {
  optimizePrompt,
  buildOptimizedPrompt,
  compareModelConsumption,
  describeContext,
  formatAgentSuggestion,
  modelCatalog,
  recommendAgenticModel
};
