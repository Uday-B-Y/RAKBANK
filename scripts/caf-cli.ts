import fs from 'fs';
import { compileDom } from './dom-compiler';
import { runFullGenerator } from './caf-full-generator';
import { runQualityGate } from './quality-gate';
import { injectLocators } from './locator-injection';
import { runDeduplicator } from './segment-deduplicator';

const rawArgs = process.argv.slice(2);

const SAFE = !rawArgs.includes('--force');
const FORCE = rawArgs.includes('--force');
const DRY_RUN = rawArgs.includes('--dry-run');
const DEDUP = rawArgs.includes('--dedup');

const args = rawArgs.filter(a => !a.startsWith('--'));
const [htmlPath, pageName, domain] = args;

console.log('CAF CLI STARTED');
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN' : FORCE ? 'FORCE' : 'SAFE'}${DEDUP ? ' +DEDUP' : ''}`);

if (!htmlPath || !pageName || !domain) {
  console.error('Usage: npm run caf -- <html> <pageName> <domain> [--force] [--dry-run] [--dedup]');
  process.exit(1);
}

try {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  console.log('Step 1: Compiling DOM...');
  compileDom({ htmlPath, pageName, domain });
  console.log('DOM compilation complete.');

  const analysisPath = `migration-analysis/${domain}/${pageName}.analysis.json`;
  console.log(`Generated analysis: ${analysisPath}`);

  console.log('Step 2: Running Quality Gate...');
  runQualityGate(analysisPath);
  console.log('Quality Gate complete.');

  if (DEDUP) {
    console.log('Step 2.5: Running Segment Deduplication...');
    runDeduplicator(domain);
    console.log('Deduplication complete.');
  }

  console.log('Step 3: Generating framework files...');
  runFullGenerator(analysisPath, {
    force: FORCE,
    dryRun: DRY_RUN
  });
  console.log('Generation complete.');

  console.log('Step 4: Injecting Locators...');
  if (!DRY_RUN) {
    injectLocators(
      htmlContent,
      analysisPath,
      `src/components/${domain}`
    );
  } else {
    console.log('DRY-RUN: Skipping injection.');
  }

  console.log('\n🚀 CAF generation completed successfully.\n');

} catch (error: any) {
  console.error('\n🔥 CAF FAILED:\n');
  console.error(error?.stack || error?.message || error);
  process.exit(1);
}