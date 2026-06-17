const { analyzePrompt } = require("./analyzer");
const { selectAgent } = require("./agentSelector");
const { detectTemplate } = require("./templates");
const { estimateReduction } = require("./tokenEstimator");

function optimizePrompt(prompt, context = {}, options = {}) {
  const original = (prompt || "").trim();
  const analysis = analyzePrompt(original);
  const template = detectTemplate(original);
  const agent = selectAgent(original, context, template);
  const model = recommendAgenticModel(original, analysis, context, template);
  const standards = options.standards || [];
  const optimized = buildOptimizedPrompt(original, analysis, template, context, standards, agent, model);
  const tokens = estimateReduction(original, optimized);

  return {
    original,
    optimized,
    analysis,
    agent,
    model,
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
      label: "Advanced reasoning coding assistant",
      useFor: "Architecture-heavy, security-sensitive, production, migration, RAG, or multi-system changes.",
      rationale: "The request includes complexity signals that benefit from deeper planning, repository context, and careful tradeoff analysis."
    };
  }

  if (mediumSignals || analysis.score < 45 || context.hasDocker || context.hasCi) {
    return {
      id: "balanced-coding-model",
      label: "Balanced coding assistant",
      useFor: "Normal feature work, bug fixes, refactors, tests, and repository-aware implementation tasks.",
      rationale: "The request needs code understanding and validation, but not maximum-depth architecture reasoning."
    };
  }

  return {
    id: "fast-prompt-editor",
    label: "Fast prompt editor",
    useFor: "Low-risk prompt cleanup, copy editing, formatting, and simple instruction tightening.",
    rationale: "The prompt appears narrow enough that a lighter model can handle it without deep architecture or repository reasoning."
  };
}

function buildOptimizedPrompt(original, analysis, template, context, standards, agent, model) {
  const detected = describeContext(context);
  const sections = template.sections.slice(0, 4).map((section) => `- ${section}`).join("\n");
  const responsibilities = agent.primary.responsibilities.slice(0, 2).map((item) => `- ${item}`).join("\n");
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
  describeContext,
  recommendAgenticModel
};
