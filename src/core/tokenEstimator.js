function estimateTokens(text) {
  if (!text || !text.trim()) {
    return 0;
  }

  const words = text.trim().split(/\s+/).length;
  const punctuation = (text.match(/[{}()[\].,;:<>/\\|-]/g) || []).length;
  return Math.max(1, Math.ceil(words * 1.33 + punctuation * 0.2));
}

function estimateReduction(beforeText, afterText) {
  const before = estimateTokens(beforeText);
  const after = estimateTokens(afterText);
  const change = before === 0 ? 0 : Math.round(((before - after) / before) * 100);
  const reduction = Math.max(0, change);
  const expansion = Math.max(0, -change);

  return {
    before,
    after,
    reduction,
    expansion,
    direction: change >= 0 ? "reduced" : "expanded",
    estimatedCostSaved: change >= 0 ? `${reduction}%` : `0%`
  };
}

module.exports = {
  estimateTokens,
  estimateReduction
};
