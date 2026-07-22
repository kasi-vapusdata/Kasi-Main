export function normalizeToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function toTokenSet(value: string): Set<string> {
  return new Set(normalizeToken(value).split("_").filter(Boolean));
}

export function scoreNameMatch(target: string, candidate: string): number {
  const targetNorm = normalizeToken(target);
  const candidateNorm = normalizeToken(candidate);

  if (!targetNorm || !candidateNorm) {
    return 0;
  }

  if (targetNorm === candidateNorm) {
    return 1000;
  }

  const targetTokens = toTokenSet(target);
  const candidateTokens = toTokenSet(candidate);

  const intersectionCount = [...targetTokens].filter((token) => candidateTokens.has(token)).length;
  const unionCount = new Set([...targetTokens, ...candidateTokens]).size || 1;

  const jaccardScore = (intersectionCount / unionCount) * 100;
  const containmentBonus = candidateNorm.includes(targetNorm) || targetNorm.includes(candidateNorm) ? 15 : 0;

  return jaccardScore + containmentBonus;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
