const criteria = [
  {
    id: "objective",
    label: "Clear objective",
    weight: 15,
    test: (prompt) => /\b(create|build|implement|design|fix|refactor|write|generate|review|explain)\b/i.test(prompt)
  },
  {
    id: "businessContext",
    label: "Business context",
    weight: 12,
    test: (prompt) => /\b(user|customer|business|domain|workflow|use case|requirement|stakeholder)\b/i.test(prompt)
  },
  {
    id: "technicalRequirements",
    label: "Technical requirements",
    weight: 14,
    test: (prompt) => /\b(api|database|framework|language|stack|service|component|library|dependency|architecture)\b/i.test(prompt)
  },
  {
    id: "expectedOutput",
    label: "Expected output",
    weight: 12,
    test: (prompt) => /\b(provide|return|include|output|format|deliver|show|list|steps|code|schema|contract)\b/i.test(prompt)
  },
  {
    id: "constraints",
    label: "Constraints",
    weight: 10,
    test: (prompt) => /\b(must|should|avoid|do not|constraint|limit|only|without|compatible|version)\b/i.test(prompt)
  },
  {
    id: "architecture",
    label: "Architecture guidance",
    weight: 10,
    test: (prompt) => /\b(architecture|design|pattern|layer|module|boundary|scalable|resilient)\b/i.test(prompt)
  },
  {
    id: "testing",
    label: "Testing expectations",
    weight: 9,
    test: (prompt) => /\b(test|unit|integration|e2e|coverage|fixture|mock)\b/i.test(prompt)
  },
  {
    id: "security",
    label: "Security expectations",
    weight: 9,
    test: (prompt) => /\b(security|auth|authorization|authentication|privacy|secret|encrypt|owasp)\b/i.test(prompt)
  },
  {
    id: "deployment",
    label: "Deployment expectations",
    weight: 9,
    test: (prompt) => /\b(deploy|docker|kubernetes|ci\/cd|pipeline|cloud|aws|azure|gcp|environment)\b/i.test(prompt)
  }
];

function analyzePrompt(prompt) {
  const normalized = (prompt || "").trim();
  const missing = [];
  const present = [];
  let score = 0;

  for (const criterion of criteria) {
    if (criterion.test(normalized)) {
      score += criterion.weight;
      present.push(criterion.label);
    } else {
      missing.push(criterion.label);
    }
  }

  if (normalized.length < 30) {
    missing.push("Sufficient detail");
    score = Math.max(0, score - 15);
  }

  if (/\b(create|build|make|do|fix)\b\.?$/i.test(normalized) || normalized.split(/\s+/).length < 6) {
    missing.push("Ambiguity reduction");
    score = Math.max(0, score - 10);
  }

  const likelyFollowUps = missing.length >= 4;

  return {
    score: Math.min(100, Math.max(0, score)),
    present,
    missing: [...new Set(missing)],
    likelyFollowUps,
    issues: [...new Set(missing)].map((item) => `Missing ${item.toLowerCase()}`)
  };
}

module.exports = {
  analyzePrompt,
  criteria
};
