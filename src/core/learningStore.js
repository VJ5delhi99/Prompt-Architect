class LearningStore {
  constructor(globalState, enabled = true) {
    this.globalState = globalState;
    this.enabled = enabled;
    this.key = "promptArchitect.learning";
  }

  getSnapshot() {
    return this.globalState.get(this.key, {
      accepted: 0,
      edited: 0,
      original: 0,
      templates: {},
      averageScore: 0,
      samples: 0
    });
  }

  async record(decision, optimization) {
    if (!this.enabled || !this.globalState) {
      return this.getSnapshot();
    }

    const snapshot = this.getSnapshot();
    snapshot[decision] = (snapshot[decision] || 0) + 1;
    snapshot.samples += 1;
    snapshot.averageScore = Math.round(
      ((snapshot.averageScore * (snapshot.samples - 1)) + optimization.analysis.score) / snapshot.samples
    );

    const templateId = optimization.template.id;
    snapshot.templates[templateId] = (snapshot.templates[templateId] || 0) + 1;

    await this.globalState.update(this.key, snapshot);
    return snapshot;
  }
}

module.exports = {
  LearningStore
};
