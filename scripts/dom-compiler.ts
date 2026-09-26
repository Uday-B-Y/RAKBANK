import fs from 'fs';
import path from 'path';
import { normalizeDom } from './dom-normalizer';
import { segmentDom } from './dom-segmenter';
import { extractSelectors } from './selector-inventory';

interface CompileInput {
  htmlPath: string;
  pageName: string;
  domain: string;
}

export function compileDom(input: CompileInput) {
  const normalized = normalizeDom(input.htmlPath);
  const segments = segmentDom(normalized);
  const selectors = extractSelectors(normalized);

  const analysis = {
    pageName: input.pageName,
    domain: input.domain,
    generatedAt: new Date().toISOString(),
    selectors,
    segments
  };

  const outputDir = path.join('migration-analysis', input.domain);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    `${input.pageName}.analysis.json`
  );

  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  console.log(`Generated analysis: ${outputPath}`);
}