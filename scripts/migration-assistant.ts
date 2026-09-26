// CAF Migration Adapter — Feature 2.6
// Converts legacy POM (Page Object Model) files into analysis.json for the CAF pipeline.
//
// Usage:
//   npx ts-node scripts/migration-assistant.ts <legacyFile.ts> [--out <output.json>]
//
// What it does:
//   1. Reads a legacy POM .ts file
//   2. Extracts all locator definitions (page.locator, getByRole, getByTestId, etc.)
//   3. Classifies and scores each selector
//   4. Infers component segments from locator naming conventions
//   5. Outputs a valid analysis.json consumable by caf-full-generator.ts
//   6. Reports migration issues (XPath, hard waits, raw page.click, etc.)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { toPascalCase } from './naming';

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractedLocator {
  name: string;
  rawSelector: string;
  method: 'locator' | 'getByRole' | 'getByTestId' | 'getByText' | 'getByLabel' | 'getByPlaceholder';
  isDynamic: boolean;
}

interface ScoredSelector {
  primary: string;
  fallback: string[];
  score: number;
  strategy: 'testid' | 'id-css' | 'attr-css' | 'role';
  tier: 'gold' | 'silver' | 'bronze';
  meta: {
    interactive: boolean;
    semanticId: boolean;
    dynamicId: boolean;
    systemId: boolean;
  };
}

interface Segment {
  id: string;
  type: string;
  selectorHint: string;
  semanticName: string;
  contentHash: string;
}

interface MigrationIssue {
  line: number;
  issue: string;
  suggestion: string;
}

interface MigrationReport {
  analysis: {
    pageName: string;
    domain: string;
    generatedAt: string;
    selectors: ScoredSelector[];
    segments: Segment[];
  };
  issues: MigrationIssue[];
  stats: {
    totalLocators: number;
    dynamicLocators: number;
    xpathCount: number;
    hardWaits: number;
    avgScore: number;
  };
}

// ── Selector Classification ──────────────────────────────────────────────────

const SYSTEM_ID_PREFIXES = ['_', 'mui-', 'react-', 'ng-', 'wfx', 'ember', '__'];
const GUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}/i;
const INTERACTIVE_TAGS = ['button', 'input', 'select', 'textarea', 'a'];

function isSystemId(id: string): boolean {
  return SYSTEM_ID_PREFIXES.some(p => id.startsWith(p));
}

function isDynamicId(id: string): boolean {
  return GUID_PATTERN.test(id) || /^\d{5,}$/.test(id);
}

function isInteractiveSelector(selector: string): boolean {
  const lower = selector.toLowerCase();
  return INTERACTIVE_TAGS.some(tag =>
    lower.startsWith(tag) || lower.includes(`"${tag}"`) || lower.includes(`'${tag}'`)
  );
}

function scoreSelector(rawSelector: string, method: string): ScoredSelector {
  let score = 0;
  let strategy: ScoredSelector['strategy'] = 'attr-css';
  const selector = rawSelector.trim();

  // data-testid
  if (method === 'getByTestId' || selector.includes('data-testid')) {
    score = 100;
    strategy = 'testid';
  }
  // ID-based CSS selector: #someId
  else if (/^#[a-zA-Z]/.test(selector) && !isDynamicId(selector.replace('#', ''))) {
    const id = selector.replace('#', '');
    if (isSystemId(id)) {
      score = 60;
    } else {
      score = isInteractiveSelector(selector) ? 95 : 90;
    }
    strategy = 'id-css';
  }
  // Role-based
  else if (method === 'getByRole' || selector.includes('[role=')) {
    score = 80;
    strategy = 'role';
  }
  // getByPlaceholder — converted to [placeholder="..."] attr CSS selector
  else if (method === 'getByPlaceholder') {
    score = 85;
    strategy = 'attr-css';
  }
  // getByText
  else if (method === 'getByText') {
    score = 70;
    strategy = 'attr-css';
  }
  // name attribute: input[name="..."]
  else if (selector.includes('[name=')) {
    score = 85;
    strategy = 'attr-css';
  }
  // href-based
  else if (selector.includes('[href')) {
    score = 80;
    strategy = 'attr-css';
  }
  // XPath — low score, flagged
  else if (selector.startsWith('//') || selector.startsWith('//*')) {
    score = 50;
    strategy = 'attr-css';
  }
  // Generic CSS selector
  else {
    score = 75;
    strategy = 'attr-css';
  }

  const interactive = isInteractiveSelector(selector);
  const idMatch = selector.match(/^#([a-zA-Z][a-zA-Z0-9_-]*)/);
  const idValue = idMatch ? idMatch[1] : '';

  const tier: ScoredSelector['tier'] = score >= 90 ? 'gold' : score >= 75 ? 'silver' : 'bronze';

  return {
    primary: selector,
    fallback: [],
    score,
    strategy,
    tier,
    meta: {
      interactive,
      semanticId: idValue ? !isDynamicId(idValue) && !isSystemId(idValue) : false,
      dynamicId: idValue ? isDynamicId(idValue) : false,
      systemId: idValue ? isSystemId(idValue) : false,
    },
  };
}

// ── Locator Extraction ───────────────────────────────────────────────────────

function extractLocators(content: string): { locators: ExtractedLocator[]; issues: MigrationIssue[] } {
  const locators: ExtractedLocator[] = [];
  const issues: MigrationIssue[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect hard waits
    if (line.includes('waitForTimeout')) {
      issues.push({
        line: lineNum,
        issue: 'Hard wait (waitForTimeout)',
        suggestion: 'Replace with NetworkWatcher.actionWithApiWait() or Playwright auto-waiting',
      });
    }

    // Detect raw page.click / page.fill outside POM
    if (/page\.(click|fill|type)\s*\(/.test(line) && !line.includes('locator')) {
      issues.push({
        line: lineNum,
        issue: 'Raw page interaction (bypasses POM)',
        suggestion: 'Move to page object locator + action method',
      });
    }

    // Extract page.locator('...') — use quote-aware regex to handle nested quotes
    // e.g., page.locator('[data-testid="foo"]') where single-quoted string contains double quotes
    const locatorMatch =
      line.match(/readonly\s+(\w+)\s*=\s*this\.page\.locator\(\s*'([^']+)'/) ||
      line.match(/readonly\s+(\w+)\s*=\s*this\.page\.locator\(\s*"([^"]+)"/) ||
      line.match(/readonly\s+(\w+)\s*=\s*this\.page\.locator\(\s*`([^`]+)`/);
    if (locatorMatch) {
      const isDynamic = line.includes('${');
      locators.push({
        name: locatorMatch[1],
        rawSelector: locatorMatch[2],
        method: 'locator',
        isDynamic,
      });

      // Flag XPath
      if (locatorMatch[2].startsWith('//')) {
        issues.push({
          line: lineNum,
          issue: `XPath locator: ${locatorMatch[1]}`,
          suggestion: 'Replace with CSS selector or role-based locator for stability',
        });
      }
      continue;
    }

    // Extract getByRole('role', { name: ... })
    const roleMatch = line.match(
      /readonly\s+(\w+)\s*=\s*this\.page\.getByRole\(\s*['"`]([^'"`]+)['"`]/
    );
    if (roleMatch) {
      locators.push({
        name: roleMatch[1],
        rawSelector: `[role="${roleMatch[2]}"]`,
        method: 'getByRole',
        isDynamic: false,
      });
      continue;
    }

    // Extract getByTestId('...')
    const testIdMatch = line.match(
      /readonly\s+(\w+)\s*=\s*this\.page\.getByTestId\(\s*['"`]([^'"`]+)['"`]/
    );
    if (testIdMatch) {
      locators.push({
        name: testIdMatch[1],
        rawSelector: `[data-testid="${testIdMatch[2]}"]`,
        method: 'getByTestId',
        isDynamic: false,
      });
      continue;
    }

    // Extract getByText('...') — text-based locators cannot be reliably converted
    // to CSS selectors, so record as a migration issue and skip adding to selectors.
    const textMatch = line.match(
      /readonly\s+(\w+)\s*=\s*this\.page\.getByText\(\s*['"`]([^'"`]+)['"`]/
    );
    if (textMatch) {
      issues.push({
        line: lineNum,
        issue: `getByText locator "${textMatch[1]}" cannot be converted to a CSS selector`,
        suggestion: `Replace with a data-testid or role-based locator: page.getByTestId('${textMatch[1]}')`,
      });
      continue;
    }

    // Extract getByLabel('...') — label-based locators cannot be reliably converted
    // to CSS selectors, so record as a migration issue and skip adding to selectors.
    const labelMatch = line.match(
      /readonly\s+(\w+)\s*=\s*this\.page\.getByLabel\(\s*['"`]([^'"`]+)['"`]/
    );
    if (labelMatch) {
      issues.push({
        line: lineNum,
        issue: `getByLabel locator "${labelMatch[1]}" cannot be converted to a CSS selector`,
        suggestion: `Replace with a data-testid or role-based locator: page.getByTestId('${labelMatch[1]}')`,
      });
      continue;
    }

    // Extract getByPlaceholder('...') — convert to [placeholder="..."] CSS selector
    const placeholderMatch = line.match(
      /readonly\s+(\w+)\s*=\s*this\.page\.getByPlaceholder\(\s*['"`]([^'"`]+)['"`]/
    );
    if (placeholderMatch) {
      locators.push({
        name: placeholderMatch[1],
        rawSelector: `[placeholder="${placeholderMatch[2]}"]`,
        method: 'getByPlaceholder',
        isDynamic: false,
      });
      continue;
    }
  }

  return { locators, issues };
}

// ── Segment Inference ────────────────────────────────────────────────────────

function inferSegments(locators: ExtractedLocator[]): Segment[] {
  // Group locators by naming prefix to infer components.
  // E.g., "filterNameInput", "filterSearchButton", "filterResetButton" → "Filter" segment
  const groups = new Map<string, ExtractedLocator[]>();

  for (const loc of locators) {
    if (loc.isDynamic) continue; // Skip dynamic locators

    // Try to extract a prefix from camelCase name
    const prefixMatch = loc.name.match(/^([a-z]+)/);
    const prefix = prefixMatch ? prefixMatch[1] : 'misc';
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(loc);
  }

  const segments: Segment[] = [];
  let idx = 0;

  for (const [prefix, locs] of groups) {
    if (locs.length < 2) continue; // Skip singletons — not meaningful segments

    const semanticName = toPascalCase(prefix);

    // Infer type from locator content
    let type = 'panel';
    const allSelectors = locs.map(l => l.rawSelector.toLowerCase()).join(' ');
    if (allSelectors.includes('nav') || allSelectors.includes('[href')) type = 'navigation';
    else if (allSelectors.includes('form') || allSelectors.includes('input') || allSelectors.includes('select')) type = 'form';
    else if (allSelectors.includes('table') || allSelectors.includes('grid')) type = 'table';
    else if (allSelectors.includes('[role="dialog"]') || allSelectors.includes('modal')) type = 'modal';
    else if (allSelectors.includes('tab')) type = 'tabcontainer';

    // Use first locator's selector as hint
    const selectorHint = locs[0].rawSelector;

    // Compute content hash
    const hashInput = `${type}|${selectorHint}|${semanticName}`;
    const contentHash = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 8);

    segments.push({
      id: `${type}_${idx}`,
      type,
      selectorHint,
      semanticName,
      contentHash,
    });
    idx++;
  }

  // If no segments were inferred, create a single catch-all
  if (segments.length === 0 && locators.length > 0) {
    const hashInput = 'panel|*|MainContent';
    const contentHash = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 8);
    segments.push({
      id: 'panel_0',
      type: 'panel',
      selectorHint: locators[0].rawSelector,
      semanticName: 'MainContent',
      contentHash,
    });
  }

  return segments;
}

// ── Page Name Derivation ─────────────────────────────────────────────────────

function derivePageName(filePath: string, content: string): string {
  // Try to extract class name from the file
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  if (classMatch) {
    let name = classMatch[1];
    // Remove "Page" suffix if present (generator adds it)
    name = name.replace(/Page$/, '');
    return name;
  }
  // Fall back to filename
  const base = path.basename(filePath, path.extname(filePath));
  return toPascalCase(base.replace(/\.page$/, ''));
}

function deriveDomain(filePath: string): string {
  // Try to extract from path: src/pages/<domain>/...
  const parts = filePath.replace(/\\/g, '/').split('/');
  const pagesIdx = parts.indexOf('pages');
  if (pagesIdx !== -1 && pagesIdx + 1 < parts.length) {
    return parts[pagesIdx + 1];
  }
  // Fallback: use parent directory name
  return path.basename(path.dirname(filePath)).toLowerCase();
}

// ── Main ─────────────────────────────────────────────────────────────────────

function migrate(filePath: string): MigrationReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const pageName = derivePageName(filePath, content);
  const domain = deriveDomain(filePath);

  const { locators, issues } = extractLocators(content);

  // Score all selectors
  const selectors: ScoredSelector[] = locators
    .filter(l => !l.isDynamic)
    .map(l => scoreSelector(l.rawSelector, l.method));

  // Infer segments
  const segments = inferSegments(locators);

  // Compute stats
  const xpathCount = locators.filter(l => l.rawSelector.startsWith('//')).length;
  const dynamicCount = locators.filter(l => l.isDynamic).length;
  const hardWaits = (content.match(/waitForTimeout/g) || []).length;
  const avgScore = selectors.length > 0
    ? Math.round(selectors.reduce((sum, s) => sum + s.score, 0) / selectors.length)
    : 0;

  return {
    analysis: {
      pageName,
      domain,
      generatedAt: new Date().toISOString(),
      selectors,
      segments,
    },
    issues,
    stats: {
      totalLocators: locators.length,
      dynamicLocators: dynamicCount,
      xpathCount,
      hardWaits,
      avgScore,
    },
  };
}

// ── CLI Entry Point ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outFlagIdx = args.indexOf('--out');
const outputPath = outFlagIdx !== -1 ? args[outFlagIdx + 1] : null;
const inputFile = args.find((_, i) => i !== outFlagIdx && i !== outFlagIdx + 1);

if (!inputFile) {
  console.error('Usage: npx ts-node scripts/migration-assistant.ts <legacyFile.ts> [--out <output.json>]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

const report = migrate(inputFile);

// Write analysis.json
const analysisOut = outputPath || inputFile.replace(/\.ts$/, '.analysis.json');
fs.writeFileSync(analysisOut, JSON.stringify(report.analysis, null, 2));
console.log(`\nAnalysis written: ${analysisOut}`);

// Print migration report
console.log(`\n── Migration Report for "${report.analysis.pageName}" ──`);
console.log(`  Domain:          ${report.analysis.domain}`);
console.log(`  Locators found:  ${report.stats.totalLocators}`);
console.log(`  Dynamic (skip):  ${report.stats.dynamicLocators}`);
console.log(`  XPath (⚠):       ${report.stats.xpathCount}`);
console.log(`  Hard waits (⚠):  ${report.stats.hardWaits}`);
console.log(`  Avg score:       ${report.stats.avgScore}`);
console.log(`  Segments:        ${report.analysis.segments.length}`);
console.log(`  Selectors:       ${report.analysis.selectors.length}`);

if (report.issues.length > 0) {
  console.log(`\n── Issues (${report.issues.length}) ──`);
  for (const issue of report.issues) {
    console.log(`  L${issue.line}: ${issue.issue}`);
    console.log(`         → ${issue.suggestion}`);
  }
}

console.log(`\nNext steps:`);
console.log(`  1. Review the analysis file: ${analysisOut}`);
console.log(`  2. Generate CAF artifacts: npx ts-node scripts/caf-full-generator.ts ${analysisOut}`);
console.log(`  3. Or scaffold a test flow:  npm run new-flow -- <module> <FlowName> --analysis ${analysisOut}`);
