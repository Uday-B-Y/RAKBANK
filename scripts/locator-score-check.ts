import fs from 'fs';
import path from 'path';

const threshold = 75;
const selectorDir = 'migration-output';

let failed = false;

function scan(dir: string) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
      continue;
    }

    if (file.endsWith('.selectors.json')) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

      for (const entry of data) {
        if (entry.score < threshold) {
          console.error(
            `Low scoring selector in ${file}: ${entry.primary} (score: ${entry.score})`
          );
          failed = true;
        }
      }
    }
  }
}

scan(selectorDir);

if (failed) {
  console.error('CI Gate failed: selector score below threshold');
  process.exit(1);
}

console.log('Locator scoring passed.');