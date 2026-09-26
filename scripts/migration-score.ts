export function calculateMigrationScore(options: {
  hasBusinessSeparation: boolean;
  minimalWaits: boolean;
  reusableFlows: boolean;
  noDuplicatedLocators: boolean;
  clearAssertions: boolean;
  stableSelectors: boolean;
}): number {
  let score = 0;

  if (options.hasBusinessSeparation) score += 20;
  if (options.minimalWaits) score += 15;
  if (options.reusableFlows) score += 15;
  if (options.noDuplicatedLocators) score += 15;
  if (options.clearAssertions) score += 20;
  if (options.stableSelectors) score += 15;

  return score;
}