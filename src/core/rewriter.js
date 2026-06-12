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

  const needsSeniorReasoning = [
    "architecture",
    "security",
    "deployment",
    "multi-step",
    "refactor",
    "prompt",
    "agent",
    "rag",
    "workflow",
    "testing",
    "production"
  ].some((keyword) => text.includes(keyword));

  if (needsSeniorReasoning || analysis.score < 75 || context.hasDocker || context.hasKubernetes || context.hasCi) {
    return {
      id: "senior-principal-prompt-architect",
      label: "GPT-5 class coding agent model",
      useFor: "Senior Principal Prompt Architect work across architecture, implementation planning, testing, security, deployment, and repository-aware prompt refinement.",
      rationale: "This prompt benefits from strong agentic reasoning, long-context codebase reading, tool use, structured output, and iterative refinement."
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
  const sections = template.sections.map((section, index) => `${index + 1}. ${section}`).join("\n");
  const responsibilities = agent.primary.responsibilities.map((item) => `- ${item}`).join("\n");
  const standardLines = standards.length > 0
    ? standards.map((standard) => `- ${standard}`).join("\n")
    : "- Follow the existing codebase style.\n- Keep changes focused and maintainable.\n- Explain important design decisions.";

  return [
    agent.instruction,
    `Use agentic model: ${model.label}.`,
    `Model rationale: ${model.rationale}`,
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
