import fs from 'fs';
import path from 'path';

const heatmap: Record<string, number> = {};

function walk(dir: string) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      const matches = content.match(/locator\(/g);
      if (matches) {
        heatmap[file] = matches.length;
      }
    }
  });
}

walk('./src');

fs.writeFileSync(
  'locator-heatmap.json',
  JSON.stringify(heatmap, null, 2)
);

console.log('Locator heatmap generated.');