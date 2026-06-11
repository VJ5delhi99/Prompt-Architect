const { analyzePrompt } = require("./analyzer");
const { selectAgent } = require("./agentSelector");
const { detectTemplate } = require("./templates");
const { estimateReduction } = require("./tokenEstimator");

function optimizePrompt(prompt, context = {}, options = {}) {
  const original = (prompt || "").trim();
  const analysis = analyzePrompt(original);
  const template = detectTemplate(original);
  const agent = selectAgent(original, context, template);
  const standards = options.standards || [];
  const optimized = buildOptimizedPrompt(original, analysis, template, context, standards, agent);
  const tokens = estimateReduction(original, optimized);

  return {
    original,
    optimized,
    analysis,
    agent,
    template,
    tokens,
    recommendation: "Use Optimized Prompt"
  };
}

function buildOptimizedPrompt(original, analysis, template, context, standards, agent) {
  const detected = describeContext(context);
  const sections = template.sections.map((section, index) => `${index + 1}. ${section}`).join("\n");
  const responsibilities = agent.primary.responsibilities.map((item) => `- ${item}`).join("\n");
  const standardLines = standards.length > 0
    ? standards.map((standard) => `- ${standard}`).join("\n")
    : "- Follow the existing codebase style.\n- Keep changes focused and maintainable.\n- Explain important design decisions.";

  return [
    agent.instruction,
    "",
    "Agent focus:",
    responsibilities,
    "",
    "Improve and execute the following developer request while preserving the original intent:",
    `"${original}"`,
    "",
    "Use the detected project context when it is relevant:",
    detected,
    "",
    `Apply the ${template.label} prompt structure and provide:`,
    sections,
    "",
    "Requirements:",
    "- Clarify assumptions before making risky choices; otherwise make conservative, codebase-aligned decisions.",
    "- Include architecture guidance, implementation steps, and expected output format.",
    "- Address scalability, reliability, security, observability, and operational concerns where applicable.",
    "- Include unit, integration, or validation tests appropriate to the requested change.",
    "- Avoid unnecessary verbosity and duplicate instructions.",
    "",
    "Coding standards:",
    standardLines,
    "",
    "Return a complete, actionable answer with concise explanations for significant decisions."
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
  describeContext
};
