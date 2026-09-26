#!/usr/bin/env node
/**
 * run-test.js — Playwright runner with timestamped, isolated trace directories.
 *
 * Problem: parallel agent runs writing to the same test-results/<test-name>/trace.zip
 * overwrite each other. This wrapper creates a unique output directory per run so
 * traces from different agents (or sequential debugging runs) never collide.
 *
 * Each invocation creates:
 *   test-results/run-YYYYMMDD-HHmmss/
 *     └── <test-safe-title>/
 *         ├── trace.zip
 *         ├── test-failed-1.png
 *         └── video.webm
 *
 * Usage (drop-in replacement for `npx playwright test`):
 *   node scripts/run-test.js [playwright args...]
 *   DOSETUP=0 node scripts/run-test.js tests/field/field-cgm.spec.ts --project=chromium
 *   DOSETUP=0 node scripts/run-test.js tests/field/ --trace on --project=chromium
 *
 * Clean up ALL trace runs when tests are fixed:
 *   npm run test:clear-traces
 */

require('dotenv').config();

const { spawnSync } = require('child_process');
const path = require('path');

// ── Generate timestamp-based run ID ──────────────────────────────────────────
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const runId = [
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
].join('-');

const outputDir = path.join('test-results', `run-${runId}`);

console.log(`[run-test] ─────────────────────────────────────────`);
console.log(`[run-test] Run ID  : run-${runId}`);
console.log(`[run-test] Output  : ${outputDir}`);
console.log(`[run-test] Args    : ${process.argv.slice(2).join(' ')}`);
console.log(`[run-test] ─────────────────────────────────────────`);

// Pre-create output dir AND all worker artifact subdirs (0–7) so Playwright trace
// recording never hits ENOENT when writing .playwright-artifacts-{N}/traces/*.trace
const fs = require('fs');
fs.mkdirSync(outputDir, { recursive: true });
for (let i = 0; i < 8; i++) {
  fs.mkdirSync(path.join(outputDir, `.playwright-artifacts-${i}`, 'traces'), { recursive: true });
}

// ── Invoke Playwright CLI with isolated output directory ──────────────────────
const playwrightCli = path.join('node_modules', '@playwright', 'test', 'cli.js');
const args = [
  playwrightCli,
  'test',
  `--output=${outputDir}`,
  ...process.argv.slice(2),
];

const result = spawnSync('node', args, {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

// ── Report trace location for easy reference ──────────────────────────────────
console.log(`\n[run-test] Traces saved to: ${outputDir}`);
console.log(`[run-test] View a trace   : npx playwright show-trace ${outputDir}/<test-name>/trace.zip`);
console.log(`[run-test] Clear all runs : npm run test:clear-traces`);

process.exit(result.status ?? 0);
