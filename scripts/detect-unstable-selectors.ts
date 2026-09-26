import fs from 'fs';
import path from 'path';
import { scoreSelector } from './locator-score';

let hasFailure = false;

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const match = line.match(/locator\((.*?)\)/);
    if (match) {
      const selector = match[1];
      const score = scoreSelector(selector);

      if (score < 60) {
        console.error(
          `Selector score below threshold in ${filePath}:${index + 1} | Score: ${score}`
        );
        hasFailure = true;
      }
    }
  });
}

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts')) {
      scanFile(fullPath);
    }
  });
}

walk('./src');

if (hasFailure) {
  console.error('Selector score threshold violated.');
  process.exit(1);
}

console.log('All selectors meet threshold.');
