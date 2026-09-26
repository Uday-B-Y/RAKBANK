export enum FlakeCategory {
  SelectorInstability = 'Selector Instability',
  TimingIssue = 'Timing Issue',
  EnvironmentLatency = 'Environment Latency',
  DataCollision = 'Data Collision',
  StateLeakage = 'State Leakage'
}

export function classifyFlake(error: string): FlakeCategory {
  if (error.includes('not found')) return FlakeCategory.SelectorInstability;
  if (error.includes('Timeout')) return FlakeCategory.TimingIssue;
  if (error.includes('network')) return FlakeCategory.EnvironmentLatency;
  return FlakeCategory.StateLeakage;
}