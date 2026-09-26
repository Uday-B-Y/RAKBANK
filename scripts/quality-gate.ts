import fs from 'fs';

interface SelectorMeta {
  interactive?: boolean;
  semanticId?: boolean;
  dynamicId?: boolean;
  systemId?: boolean;
}

interface Selector {
  primary: string;
  score: number;
  strategy?: string;
  tier?: 'gold' | 'silver' | 'bronze';
  meta?: SelectorMeta;
}

interface Analysis {
  pageName: string;
  selectors: Selector[];
}

const MIN_AVG_SCORE = 85;
const MIN_GOLD_PERCENT = 60;
const MAX_BRONZE_PERCENT = 10;
const MAX_DYNAMIC_IDS = 0;
const MIN_TOTAL_SELECTORS = 20;
const MAX_STRATEGY_DOMINANCE = 98;  // diversity guard — hard fail for non-id-css strategies
const ID_CSS_WARNING_THRESHOLD = 90; // Feature 1.10 — advisory only, never a hard fail

function percent(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}

export function runQualityGate(analysisPath: string) {

  const analysis: Analysis = JSON.parse(
    fs.readFileSync(analysisPath, 'utf-8')
  );

  const selectors = analysis.selectors || [];

  if (selectors.length < MIN_TOTAL_SELECTORS) {
    throw new Error(
      `❌ Quality Gate Failed: Only ${selectors.length} selectors found (minimum ${MIN_TOTAL_SELECTORS})`
    );
  }

  const total = selectors.length;

  const avgScore =
    selectors.reduce((sum, s) => sum + s.score, 0) / total;

  const goldCount = selectors.filter(s => s.tier === 'gold').length;
  const silverCount = selectors.filter(s => s.tier === 'silver').length;
  const bronzeCount = selectors.filter(s => s.tier === 'bronze').length;
  const dynamicCount = selectors.filter(
    s => s.meta?.dynamicId === true
  ).length;

  const goldPercent = percent(goldCount, total);
  const bronzePercent = percent(bronzeCount, total);

  // ===== Strategy Diversity Calculation =====
  const strategyMap: Record<string, number> = {};

  selectors.forEach(s => {
    if (!s.strategy) return;
    strategyMap[s.strategy] =
      (strategyMap[s.strategy] || 0) + 1;
  });

  const dominance = Object.entries(strategyMap)
    .map(([strategy, count]) => ({
      strategy,
      percent: percent(count, total)
    }))
    .sort((a, b) => b.percent - a.percent)[0];

  console.log(`\n🔎 CAF Quality Report for ${analysis.pageName}`);
  console.log(`-----------------------------------------`);
  console.log(`Total Selectors: ${total}`);
  console.log(`Average Score: ${avgScore.toFixed(2)}`);
  console.log(`Gold %: ${goldPercent.toFixed(2)}%`);
  console.log(`Silver Count: ${silverCount}`);
  console.log(`Bronze %: ${bronzePercent.toFixed(2)}%`);
  console.log(`Dynamic IDs: ${dynamicCount}`);

  if (dominance) {
    console.log(
      `Max Strategy Dominance: ${dominance.strategy} (${dominance.percent.toFixed(2)}%)`
    );
  }

  console.log(`-----------------------------------------\n`);

  // ===== Hard Fail Conditions =====

  if (avgScore < MIN_AVG_SCORE) {
    throw new Error(`❌ Average score below threshold (${MIN_AVG_SCORE})`);
  }

  if (goldPercent < MIN_GOLD_PERCENT) {
    throw new Error(`❌ Gold tier below ${MIN_GOLD_PERCENT}%`);
  }

  if (bronzePercent > MAX_BRONZE_PERCENT) {
    throw new Error(`❌ Bronze tier above ${MAX_BRONZE_PERCENT}%`);
  }

  if (dynamicCount > MAX_DYNAMIC_IDS) {
    throw new Error(`❌ Dynamic IDs detected (${dynamicCount})`);
  }

  // Hard fail: non-id-css strategy over-dominance
  if (
    dominance &&
    dominance.percent > MAX_STRATEGY_DOMINANCE &&
    dominance.strategy !== 'id-css'
  ) {
    throw new Error(
      `❌ Strategy "${dominance.strategy}" dominates at ${dominance.percent.toFixed(2)}%`
    );
  }

  // Feature 1.10: Advisory warning — id-css over-reliance.
  // Gate does NOT fail: stable IDs are valid selectors.
  // Warning fires to guide teams toward data-testid diversification before
  // IDs become unstable (e.g., after a framework upgrade or DOM refactor).
  if (
    dominance &&
    dominance.strategy === 'id-css' &&
    dominance.percent > ID_CSS_WARNING_THRESHOLD
  ) {
    console.warn(`\n⚠️  CAF SELECTOR ADVISORY: id-css strategy dominates at ${dominance.percent.toFixed(2)}% (advisory threshold: ${ID_CSS_WARNING_THRESHOLD}%).`);
    console.warn(`   Gate passes — stable element IDs are valid selectors.`);
    console.warn(`   Recommendation: add data-testid attributes to high-frequency interactive elements.`);
    console.warn(`   data-testid scores 100 vs id-css at 90–95. See CAF-Selector-Governance.md.\n`);
  }

  console.log(`✅ CAF Quality Gate PASSED\n`);
}