#!/usr/bin/env node
/**
 * clear-traces.js — Bulk delete all timestamped trace run directories.
 *
 * Deletes every test-results/run-* subdirectory created by scripts/run-test.js.
 * Run this once all failing tests are fixed and traces are no longer needed.
 *
 * Usage:
 *   npm run test:clear-traces
 *   node scripts/clear-traces.js
 *
 * Safe: only deletes run-* directories, never touches junit.xml or other root artifacts.
 */

const fs = require('fs');
const path = require('path');

const TRACE_ROOT = 'test-results';

if (!fs.existsSync(TRACE_ROOT)) {
  console.log('[clear-traces] No test-results directory — nothing to clean.');
  process.exit(0);
}

const entries = fs.readdirSync(TRACE_ROOT, { withFileTypes: true });
const runDirs = entries
  .filter((e) => e.isDirectory() && e.name.startsWith('run-'))
  .map((e) => e.name);

if (runDirs.length === 0) {
  console.log('[clear-traces] No run-* trace directories found — already clean.');
  process.exit(0);
}

console.log(`[clear-traces] Found ${runDirs.length} run(s) to delete:`);
for (const dir of runDirs) {
  const fullPath = path.join(TRACE_ROOT, dir);
  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`[clear-traces] ✓ Deleted ${fullPath}`);
  } catch (err) {
    console.error(`[clear-traces] ✗ Failed to delete ${fullPath}: ${err.message}`);
  }
}

console.log(`[clear-traces] Done — ${runDirs.length} trace run(s) cleared.`);
