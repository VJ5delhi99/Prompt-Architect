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
      label: "Advanced reasoning coding model",
      useFor: "Architecture-heavy, security-sensitive, production, migration, RAG, or multi-system changes.",
      rationale: "The request includes complexity signals that benefit from deeper planning, repository context, and careful tradeoff analysis."
    };
  }

  if (mediumSignals || analysis.score < 45 || context.hasDocker || context.hasCi) {
    return {
      id: "balanced-coding-model",
      label: "Balanced coding model",
      useFor: "Normal feature work, bug fixes, refactors, tests, and repository-aware implementation tasks.",
      rationale: "The request needs code understanding and validation, but not maximum-depth architecture reasoning."
    };
  }

  return {
    id: "fast-prompt-editor",
    label: "Fast coding assistant model",
    useFor: "Low-risk prompt cleanup, copy editing, formatting, and simple instruction tightening.",
    rationale: "The prompt appears narrow enough that a lighter model can handle it without deep architecture or repository reasoning."
  };
}

function buildOptimizedPrompt(original, analysis, template, context, standards, agent, model) {
  const detected = describeContext(context);
  const sections = template.sections.slice(0, 5).map((section) => `- ${section}`).join("\n");
  const responsibilities = agent.primary.responsibilities.slice(0, 2).map((item) => `- ${item}`).join("\n");
  const standardLines = (standards.length > 0
    ? standards
    : ["Follow the existing codebase style.", "Keep changes focused and maintainable."])
    .slice(0, 3)
    .map((standard) => `- ${standard}`)
    .join("\n");
  const topIssues = analysis.issues.slice(0, 4).map((issue) => `- ${issue}`).join("\n");

  return [
    agent.instruction,
    `Recommended model: ${model.label} (${model.rationale})`,
    "",
    "Original request:",
    original,
    "",
    "Improve the request into a clear, executable task. Preserve intent and avoid extra scope.",
    "",
    "Focus:",
    responsibilities,
    "",
    "Missing details to cover:",
    topIssues || "- No major gaps detected.",
    "",
    "Project context:",
    detected,
    "",
    `Output structure (${template.label}):`,
    sections,
    "",
    "Guardrails:",
    "- Ask only if a missing detail would change the implementation materially.",
    "- Include tests or validation steps for user-facing behavior.",
    "- Call out reliability, security, or operational risks only when relevant.",
    standardLines,
    "",
    "Return concise implementation steps and the expected final result."
  ].join("\n");
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
