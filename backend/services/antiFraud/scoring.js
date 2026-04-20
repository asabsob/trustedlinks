export function getRiskLevel(score = 0) {
  if (score >= 80) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function getFraudAction(score = 0) {
  if (score >= 80) return "block";
  if (score >= 50) return "hold";
  return "allow";
}

export function calculateRiskScore(signals = []) {
  let score = 0;
  const reasonCodes = [];

  for (const signal of signals) {
    if (!signal || !signal.code || !signal.weight) continue;
    score += Number(signal.weight);
    reasonCodes.push(signal.code);
  }

  return {
    score,
    reasonCodes,
    riskLevel: getRiskLevel(score),
    action: getFraudAction(score),
  };
}
