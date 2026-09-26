import fs from 'fs';

if (!fs.existsSync('test-results.json')) {
  console.log('No test results file found.');
  process.exit(0);
}

const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

const summary: Record<string, number> = {};

function classify(errorMessage: string) {
  if (errorMessage.includes('Timeout')) return 'timeout';
  if (errorMessage.includes('not visible')) return 'visibility';
  if (errorMessage.includes('detached')) return 'detached';
  if (errorMessage.includes('strict mode violation')) return 'strict';
  return 'other';
}

for (const suite of results.suites || []) {
  for (const test of suite.tests || []) {
    for (const result of test.results || []) {
      if (result.status === 'failed') {
        const error = result.error?.message || '';
        const category = classify(error);
        summary[category] = (summary[category] || 0) + 1;
      }
    }
  }
}

fs.writeFileSync('flake-summary.json', JSON.stringify(summary, null, 2));
console.log('Flake summary generated.');