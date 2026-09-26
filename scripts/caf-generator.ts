/**
 * @deprecated Legacy generator (pre-component pattern). Produces FallbackLocator-field pages
 * without BaseComponent composition, quality gate, or locator injection.
 * Use `caf-full-generator.ts` for all new generation.
 * Retained for backward compatibility only — candidate for removal.
 */
import fs from 'fs';
import path from 'path';

interface Selector {
  primary: string;
  fallback?: string[];
  score: number;
  strategy: string;
}

interface Analysis {
  pageName: string;
  domain: string;
  selectors: Selector[];
  segments: any[];
}

const SCORE_THRESHOLD = 75;

function generatePageFile(analysis: Analysis) {
  const filtered = analysis.selectors.filter(s => s.score >= SCORE_THRESHOLD);

  const locatorFields = filtered
    .map((s, i) => {
      const name = `locator${i + 1}`;
      return `
  private readonly ${name} = new FallbackLocator(this.page, {
    primary: '${s.primary}',
    fallback: ${JSON.stringify(s.fallback || [])},
    score: ${s.score}
  });`;
    })
    .join('\n');

  return `
import { Page } from '@playwright/test';
import { BasePage } from '@/core/base/BasePage';
import { FallbackLocator } from '@/core/locators/FallbackLocator';

export class ${analysis.pageName}Page extends BasePage {

  constructor(protected readonly page: Page) {
    super(page);
  }

${locatorFields}

}
`;
}

export function runGenerator(analysisPath: string) {
  const analysis: Analysis = JSON.parse(
    fs.readFileSync(analysisPath, 'utf-8')
  );

  const outputDir = path.join(
    'src/pages',
    analysis.domain
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(
    outputDir,
    `${analysis.pageName}.page.ts`
  );

  if (fs.existsSync(filePath)) {
    console.log(`Skipping existing file: ${filePath}`);
    return;
  }

  const content = generatePageFile(analysis);
  fs.writeFileSync(filePath, content);

  console.log(`Generated ${filePath}`);
}