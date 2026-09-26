import fs from 'fs';
import path from 'path';
import { normalizeDom } from './dom-normalizer';
import { segmentDom } from './dom-segmenter';
import { extractSelectors } from './selector-inventory';

interface ManifestFile {
  htmlPath: string;
  domain: string;
  pageName: string;
}

interface BatchManifest {
  batchName: string;
  files: ManifestFile[];
}

function readRegistry(): string {
  return fs.readFileSync('docs/registry.md', 'utf-8');
}

function existsInRegistry(pageName: string): boolean {
  return readRegistry().includes(pageName);
}

export function runBatch(manifestPath: string) {
  const manifest: BatchManifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf-8')
  );

  for (const file of manifest.files) {
    if (existsInRegistry(file.pageName)) {
      console.log(`Skipping ${file.pageName} (already registered)`);
      continue;
    }

    const normalized = normalizeDom(file.htmlPath);
    const segments = segmentDom(normalized);
    const selectors = extractSelectors(normalized);

    const outputDir = path.join('migration-output', file.domain);
    fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(
      path.join(outputDir, `${file.pageName}.selectors.json`),
      JSON.stringify(selectors, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, `${file.pageName}.segments.json`),
      JSON.stringify(segments, null, 2)
    );

    console.log(`Generated metadata for ${file.pageName}`);
  }
}