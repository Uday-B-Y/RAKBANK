import fs from 'fs';
import * as cheerio from 'cheerio';

/** H3 — Orphan Tracking: warn when unowned orphan % exceeds this threshold.
 *  Not a CI failure — advisory only. Indicates segmentation gaps. */
const ORPHAN_WARNING_THRESHOLD = 30;

interface Selector {
  primary: string;
  score: number;
}

interface Segment {
  id: string;
  type: string;
  selectorHint: string;
  semanticName?: string;
}

interface Analysis {
  pageName: string;
  domain: string;
  selectors: Selector[];
  segments: Segment[];
}

interface LocatorDefinition {
  name: string;
  selector: string;
}

/* ============================================
   Utility: Derive Stable Locator Name
============================================ */

function deriveLocatorName(selector: string): string {
  if (selector.startsWith('#')) {
    const clean = selector.replace('#', '');
    return clean.replace(/[^a-zA-Z0-9]/g, '');
  }

  if (selector.includes('[data-testid=')) {
    const match = selector.match(/"(.*?)"/);
    if (match) {
      return match[1].replace(/[^a-zA-Z0-9]/g, '');
    }
  }

  return selector.replace(/[^a-zA-Z0-9]/g, '');
}

/* ============================================
   Utility: Ensure Locator Import Exists
============================================ */

/** Feature 1.2: Add `Locator` to the @playwright/test import in the target file
 *  before writing typed locator properties. No-ops if already present. */
function ensureLocatorImport(fileContent: string): string {
  if (/import\s+\{[^}]*\bLocator\b[^}]*\}\s+from\s+'@playwright\/test'/.test(fileContent)) {
    return fileContent; // Locator already imported
  }
  return fileContent.replace(
    /import\s+\{([^}]+)\}\s+from\s+'@playwright\/test'/,
    (_: string, imports: string) =>
      `import { ${imports.trim()}, Locator } from '@playwright/test'`
  );
}

/* ============================================
   Injection: Component
============================================ */

function injectIntoComponent(
  componentPath: string,
  locators: LocatorDefinition[]
) {
  if (!fs.existsSync(componentPath)) return;
  if (!locators.length) return;

  let content = fs.readFileSync(componentPath, 'utf-8');

  const injection = locators
    .map(
      l =>
        `  readonly ${l.name}: Locator = this.root.locator('${l.selector}');`
    )
    .join('\n');

  if (content.includes(injection)) return;

  content = content.replace(
    /(constructor\(.*?\{[\s\S]*?\}\n)/,
    `$1\n${injection}\n`
  );

  content = ensureLocatorImport(content);
  fs.writeFileSync(componentPath, content);
}

/* ============================================
   Injection: Page (Orphans Only)
============================================ */

function injectIntoPage(
  pagePath: string,
  locators: LocatorDefinition[]
) {
  if (!fs.existsSync(pagePath)) return;
  if (!locators.length) return;

  let content = fs.readFileSync(pagePath, 'utf-8');

  const injection = locators
    .map(
      l =>
        `  readonly ${l.name}: Locator = this.page.locator('${l.selector}');`
    )
    .join('\n');

  if (content.includes(injection)) return;

  content = content.replace(
    /(constructor\(.*?\{[\s\S]*?super\(page\);\n[\s\S]*?\})/,
    `$1\n\n${injection}\n`
  );

  content = ensureLocatorImport(content);
  fs.writeFileSync(pagePath, content);
}

/* ============================================
   STRICT SINGLE-OWNER INJECTION ENGINE
============================================ */

export function injectLocators(
  html: string,
  analysisPath: string,
  componentDir: string
) {
  const analysis: Analysis = JSON.parse(
    fs.readFileSync(analysisPath, 'utf-8')
  );

  const $ = cheerio.load(html);

  // 🔒 Deterministic selector order
  const selectors = [...analysis.selectors]
    .sort((a, b) => a.primary.localeCompare(b.primary));

  const ownershipMap: Record<string, LocatorDefinition[]> = {};
  const pageOrphans: LocatorDefinition[] = [];

  // H3: Orphan category counters — role-orphans are expected (too broad for
  // components), structural orphans indicate gaps in dom-segmenter rules.
  let roleOrphanCount = 0;
  let structuralOrphanCount = 0;

  selectors.forEach(sel => {

    // 🚫 Skip generic role selectors (too broad for component ownership)
    if (sel.primary.startsWith('[role=')) {
      pageOrphans.push({
        name: deriveLocatorName(sel.primary),
        selector: sel.primary
      });
      roleOrphanCount++; // H3: expected orphan — role selectors always go to page
      return;
    }

    const element = $(sel.primary).first();
    if (!element.length) return;

    let assigned = false;

    // 🔒 Strict Single Owner Logic
    for (const segment of analysis.segments) {

      const closestMatch = element.closest(segment.selectorHint);

      if (closestMatch.length) {

        const baseName =
          segment.semanticName || segment.id;

        const componentPath =
          `${componentDir}/${analysis.pageName}.${baseName}.component.ts`;

        if (!ownershipMap[componentPath]) {
          ownershipMap[componentPath] = [];
        }

        ownershipMap[componentPath].push({
          name: deriveLocatorName(sel.primary),
          selector: sel.primary
        });

        assigned = true;
        break; // STRICT single-owner
      }
    }

    if (!assigned) {
      pageOrphans.push({
        name: deriveLocatorName(sel.primary),
        selector: sel.primary
      });
      structuralOrphanCount++; // H3: unexpected orphan — no segment matched this element
    }
  });

  // Inject into Components
  Object.entries(ownershipMap).forEach(
    ([componentPath, locators]) =>
      injectIntoComponent(componentPath, locators)
  );

  // Inject true orphans into Page
  const pagePath =
    `src/pages/${analysis.domain}/${analysis.pageName}.page.ts`;

  injectIntoPage(pagePath, pageOrphans);

  /* ============================================
     REPORTING & ORPHAN TRACKING (H3)
  ============================================ */

  const componentOwnedCount =
    Object.values(ownershipMap)
      .reduce((sum, arr) => sum + arr.length, 0);

  const totalOrphans = roleOrphanCount + structuralOrphanCount;
  const orphanPercent = selectors.length > 0
    ? Math.round((totalOrphans / selectors.length) * 100)
    : 0;

  // H3: Persist injection metrics to migration-analysis output directory.
  // Metrics are written alongside analysis.json for CI and tooling consumption.
  const metricsPath =
    `migration-analysis/${analysis.domain}/${analysis.pageName}.injection-metrics.json`;

  const metrics = {
    pageName: analysis.pageName,
    domain: analysis.domain,
    generatedAt: new Date().toISOString(),
    totalSelectors: selectors.length,
    componentOwned: componentOwnedCount,
    roleOrphans: roleOrphanCount,
    structuralOrphans: structuralOrphanCount,
    totalOrphans,
    orphanPercent
  };

  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  console.log('\n📊 CAF Ownership Injection Report');
  console.log('-----------------------------------');
  console.log(`Total Selectors  : ${selectors.length}`);
  console.log(`Component Owned  : ${componentOwnedCount}`);
  console.log(`Role Orphans     : ${roleOrphanCount}  (expected — role selectors are page-level)`);
  console.log(`Structural Orphans: ${structuralOrphanCount} (review if high — indicates segmentation gaps)`);
  console.log(`Total Orphans    : ${totalOrphans} (${orphanPercent}%)`);
  console.log(`Metrics File     : ${metricsPath}`);
  console.log('-----------------------------------\n');

  // H3: Advisory warning — not a failure, indicates segmentation improvement opportunity.
  if (orphanPercent > ORPHAN_WARNING_THRESHOLD) {
    console.warn(`⚠️  CAF ORPHAN WARNING: ${orphanPercent}% of selectors are unowned orphans (threshold: ${ORPHAN_WARNING_THRESHOLD}%).`);
    console.warn(`   Structural orphans (${structuralOrphanCount}) indicate elements not covered by any segment in dom-segmenter.ts.`);
    console.warn(`   Role orphans (${roleOrphanCount}) are normal and expected.`);
    console.warn(`   Consider adding or widening segment detection rules to reduce structural orphans.`);
  }

  console.log('✅ Strict Single-Owner Injection Complete\n');
}