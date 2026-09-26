/**
 * CAF Segment Deduplication Engine (TIER 1 — Feature 1.8)
 *
 * Scans all analysis.json files under migration-analysis/{domain}/
 * and identifies DOM segments that appear on multiple pages (same
 * contentHash across different pageName values).
 *
 * Outputs a shared-components.manifest.json for each domain that the
 * generator consults at runtime. When a segment hash is present in the
 * manifest, the generator emits a re-export/import of the shared
 * component instead of generating a duplicate class.
 *
 * Usage (called from caf-cli.ts --dedup, or standalone):
 *   npx ts-node scripts/segment-deduplicator.ts <domain>
 */

import fs from 'fs';
import path from 'path';

// ── Types ──────────────────────────────────────────────────────

interface AnalysisSegment {
  id: string;
  type: string;
  selectorHint: string;
  semanticName?: string;
  contentHash?: string;
}

interface Analysis {
  pageName: string;
  domain: string;
  segments: AnalysisSegment[];
}

export interface SharedComponent {
  /** Stable 8-char hex hash from computeSegmentHash(). */
  contentHash: string;
  /** PascalCase class name, e.g. SharedNavigationComponent. */
  sharedClassName: string;
  /** Import path relative to src/, e.g. components/shared/SharedNavigation.component. */
  sharedPath: string;
  /** Pages on which this segment was first seen (informational). */
  sourcePages: string[];
}

export interface SharedComponentsManifest {
  domain: string;
  generatedAt: string;
  /** Map from contentHash → SharedComponent metadata. */
  components: Record<string, SharedComponent>;
}

// ── Utilities ───────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c: string) => c.toUpperCase());
}

/** Collect all *.analysis.json files under migration-analysis/{domain}/ */
function loadAnalysisFiles(domain: string): Analysis[] {
  const dir = path.join('migration-analysis', domain);
  if (!fs.existsSync(dir)) {
    throw new Error('Analysis directory not found: ' + dir);
  }

  return fs
    .readdirSync(dir)
    .filter((f: string) => f.endsWith('.analysis.json'))
    .map((f: string) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      return JSON.parse(raw) as Analysis;
    });
}

/** Build a deterministic shared class name from segment properties. */
function buildSharedClassName(seg: AnalysisSegment): string {
  const base = seg.semanticName
    ? toPascalCase(seg.semanticName)
    : toPascalCase(seg.type + '_' + seg.selectorHint.replace(/[^a-zA-Z0-9]/g, '_'));
  return 'Shared' + base + 'Component';
}

// ── Core Engine ───────────────────────────────────────────────

/**
 * Runs the deduplication pass for a single domain.
 * Groups segments by contentHash across all pages, then emits a manifest
 * for any hash that appears on 2+ distinct pages.
 *
 * @returns The manifest (also written to disk at migration-analysis/{domain}/shared-components.manifest.json)
 */
export function runDeduplicator(domain: string): SharedComponentsManifest {
  const analyses = loadAnalysisFiles(domain);

  // contentHash → { segment snapshot, pages[] }
  const hashMap: Record<string, { segment: AnalysisSegment; pages: string[] }> = {};

  for (const analysis of analyses) {
    for (const seg of analysis.segments) {
      if (!seg.contentHash) continue; // guard: skip segments without hash

      if (!hashMap[seg.contentHash]) {
        hashMap[seg.contentHash] = { segment: seg, pages: [] };
      }

      // Only record each page once per hash
      if (!hashMap[seg.contentHash].pages.includes(analysis.pageName)) {
        hashMap[seg.contentHash].pages.push(analysis.pageName);
      }
    }
  }

  // Keep only hashes seen on 2+ pages — those are true cross-page duplicates
  const shared: Record<string, SharedComponent> = {};

  for (const [hash, { segment, pages }] of Object.entries(hashMap)) {
    if (pages.length < 2) continue;

    const sharedClassName = buildSharedClassName(segment);
    const sharedPath = 'components/shared/' + sharedClassName.replace('Component', '') + '.component';

    shared[hash] = {
      contentHash: hash,
      sharedClassName,
      sharedPath,
      sourcePages: [...pages].sort()
    };
  }

  const manifest: SharedComponentsManifest = {
    domain,
    generatedAt: new Date().toISOString(),
    components: shared
  };

  const manifestDir = path.join('migration-analysis', domain);
  const manifestPath = path.join(manifestDir, 'shared-components.manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const sharedCount = Object.keys(shared).length;
  console.log('');
  console.log('🔍 CAF Segment Deduplication Report');
  console.log('-------------------------------------');
  console.log('Domain           : ' + domain);
  console.log('Pages scanned    : ' + analyses.length);
  console.log('Total segments   : ' + Object.keys(hashMap).length);
  console.log('Shared segments  : ' + sharedCount + ' (appear on 2+ pages)');
  console.log('Manifest written : ' + manifestPath);
  console.log('-------------------------------------');
  console.log('');

  if (sharedCount > 0) {
    console.log('Shared components identified:');
    for (const sc of Object.values(shared) as SharedComponent[]) {
      console.log('  ' + sc.sharedClassName + '  [hash: ' + sc.contentHash + ']  pages: ' + sc.sourcePages.join(', '));
    }
    console.log('');
  }

  return manifest;
}

// ── CLI entry point ───────────────────────────────────────────────

if (require.main === module) {
  const domain = process.argv[2];
  if (!domain) {
    console.error('Usage: npx ts-node scripts/segment-deduplicator.ts <domain>');
    process.exit(1);
  }
  try {
    runDeduplicator(domain);
  } catch (err: any) {
    console.error('Deduplicator failed:', err?.message || err);
    process.exit(1);
  }
}
