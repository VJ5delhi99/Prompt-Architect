const agents = [
  {
    id: "solution-architect",
    title: "Senior Solution Architect",
    keywords: ["architecture", "design", "microservice", "system", "scalable", "distributed", "cloud"],
    responsibilities: [
      "define architecture boundaries",
      "identify major components and integrations",
      "explain design tradeoffs"
    ]
  },
  {
    id: "principal-backend-engineer",
    title: "Principal Backend Engineer",
    keywords: ["api", "backend", "service", "database", "endpoint", "controller", "worker"],
    responsibilities: [
      "design backend implementation",
      "define data and API contracts",
      "handle reliability and maintainability concerns"
    ]
  },
  {
    id: "frontend-engineer",
    title: "Senior Frontend Engineer",
    keywords: ["frontend", "react", "vue", "angular", "ui", "component", "css", "page"],
    responsibilities: [
      "design ergonomic user workflows",
      "implement accessible UI behavior",
      "cover responsive and interactive states"
    ]
  },
  {
    id: "devops-engineer",
    title: "DevOps and Platform Engineer",
    keywords: ["docker", "kubernetes", "deployment", "ci/cd", "pipeline", "terraform", "helm", "infrastructure"],
    responsibilities: [
      "define deployment and automation steps",
      "include environment and operational requirements",
      "address release safety and rollback strategy"
    ]
  },
  {
    id: "security-engineer",
    title: "Application Security Engineer",
    keywords: ["security", "auth", "authorization", "authentication", "secret", "privacy", "owasp", "encrypt"],
    responsibilities: [
      "identify threat and abuse cases",
      "define security controls",
      "include validation and privacy requirements"
    ]
  },
  {
    id: "qa-engineer",
    title: "Senior QA Automation Engineer",
    keywords: ["test", "unit", "integration", "e2e", "performance", "coverage", "fixture", "mock"],
    responsibilities: [
      "define test scope",
      "cover edge cases and failure modes",
      "include execution and validation steps"
    ]
  },
  {
    id: "ai-engineer",
    title: "AI/RAG Systems Engineer",
    keywords: ["rag", "llm", "vector", "embedding", "retrieval", "agent", "mcp", "chatbot"],
    responsibilities: [
      "design retrieval and prompt assembly",
      "define evaluation and observability",
      "address safety, privacy, and grounding"
    ]
  },
  {
    id: "prompt-architect",
    title: "Principal Prompt Architect",
    keywords: ["prompt", "prmpt", "prompt engineer", "prompt architect", "instruction", "system prompt", "rewrite"],
    responsibilities: [
      "clarify the user's intent",
      "remove ambiguity and unnecessary length",
      "produce a concise, high-signal prompt"
    ]
  },
  {
    id: "technical-writer",
    title: "Senior Technical Writer",
    keywords: ["document", "readme", "documentation", "guide", "architecture doc", "api docs"],
    responsibilities: [
      "structure content for the intended audience",
      "include examples and operational guidance",
      "make assumptions and limitations clear"
    ]
  }
];

function selectAgent(prompt, context = {}, template = {}) {
  const lower = [
    prompt,
    template.id,
    template.label,
    ...(context.languages || []),
    ...(context.frameworks || []),
    ...(context.databases || []),
    ...(context.cloud || [])
  ].join(" ").toLowerCase();

  const scored = agents.map((agent) => ({
    agent,
    score: agent.keywords.reduce((total, keyword) => total + (lower.includes(keyword) ? 1 : 0), 0)
  }));

  if (context.hasDocker || context.hasKubernetes || context.hasCi) {
    addScore(scored, "devops-engineer", 1);
  }

  if ((context.frameworks || []).some((framework) => /react|vite|next|vue|angular/i.test(framework))) {
    addScore(scored, "frontend-engineer", 1);
  }

  if ((context.frameworks || []).some((framework) => /\.net|node|java|maven/i.test(framework))) {
    addScore(scored, "principal-backend-engineer", 1);
  }

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return agents.indexOf(left.agent) - agents.indexOf(right.agent);
  });

  const primary = scored[0].score > 0 ? scored[0].agent : agents[1];
  const supporting = scored
    .filter((item) => item.agent.id !== primary.id && item.score > 0)
    .slice(0, 2)
    .map((item) => item.agent);

  return {
    primary,
    supporting,
    suggestion: buildAgentSuggestion(primary, supporting),
    instruction: buildAgentInstruction(primary, supporting)
  };
}

function addScore(scored, id, amount) {
  const match = scored.find((item) => item.agent.id === id);
  if (match) {
    match.score += amount;
  }
}

function buildAgentInstruction(primary, supporting) {
  const supportText = supporting.length > 0
    ? ` Collaborate with ${supporting.map((agent) => agent.title).join(" and ")} perspectives where relevant.`
    : "";

  return `Act as a ${primary.title}.${supportText}`;
}

function buildAgentSuggestion(primary, supporting) {
  const supportTitles = supporting.map((agent) => agent.title);

  return {
    primary: primary.title,
    supporting: supportTitles,
    summary: supportTitles.length > 0
      ? `${primary.title}; collaborate with ${supportTitles.join(" and ")} where relevant.`
      : primary.title
  };
}

module.exports = {
  agents,
  selectAgent,
  buildAgentInstruction,
  buildAgentSuggestion
};
