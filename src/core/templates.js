const templates = [
  {
    id: "microservice",
    label: "Microservice",
    keywords: ["microservice", "service", "distributed", "bounded context"],
    sections: [
      "Business capability and ownership boundaries",
      "High-level architecture",
      "API contracts",
      "Data model and persistence strategy",
      "Event-driven communication",
      "Authentication and authorization",
      "Error handling and resilience",
      "Observability",
      "Testing strategy",
      "Deployment and operations"
    ]
  },
  {
    id: "api",
    label: "API",
    keywords: ["api", "endpoint", "rest", "graphql", "controller"],
    sections: [
      "Endpoint contracts",
      "Request and response examples",
      "Validation rules",
      "Authentication and authorization",
      "Error model",
      "Versioning strategy",
      "Unit and integration tests"
    ]
  },
  {
    id: "frontend",
    label: "Frontend",
    keywords: ["frontend", "react", "vue", "angular", "ui", "component", "page"],
    sections: [
      "User workflow",
      "Component structure",
      "State management",
      "Accessibility",
      "Responsive behavior",
      "Error and loading states",
      "Tests"
    ]
  },
  {
    id: "rag",
    label: "RAG System",
    keywords: ["rag", "retrieval", "vector", "embedding", "chatbot", "llm"],
    sections: [
      "Data ingestion",
      "Chunking and embedding strategy",
      "Vector database schema",
      "Retrieval and reranking",
      "Prompt assembly",
      "Evaluation metrics",
      "Security and privacy controls",
      "Observability"
    ]
  },
  {
    id: "testing",
    label: "Testing",
    keywords: ["test", "unit test", "integration test", "performance test", "security test"],
    sections: [
      "Test scope",
      "Critical scenarios",
      "Fixtures and mocks",
      "Edge cases",
      "Failure modes",
      "How to run the tests"
    ]
  },
  {
    id: "documentation",
    label: "Documentation",
    keywords: ["document", "readme", "architecture doc", "api documentation", "technical design"],
    sections: [
      "Audience",
      "Purpose",
      "System context",
      "Design decisions",
      "Operational guidance",
      "Examples",
      "Known limitations"
    ]
  }
];

function detectTemplate(prompt) {
  const lower = prompt.toLowerCase();
  const scored = templates.map((template) => ({
    template,
    score: template.keywords.filter((keyword) => lower.includes(keyword)).length
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].template : templates[1];
}

module.exports = {
  templates,
  detectTemplate
};
