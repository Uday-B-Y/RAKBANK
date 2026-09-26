import fs from 'fs';
import path from 'path';

const srcDir = 'src';

const heatmap: Record<string, number> = {};

function scan(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      scan(full);
      continue;
    }

    if (file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      const matches = content.match(/#\w+|\[data-testid=.*?\]/g);

      if (matches) {
        matches.forEach(m => {
          heatmap[m] = (heatmap[m] || 0) + 1;
        });
      }
    }
  }
}

scan(srcDir);
fs.writeFileSync(
  'selector-heatmap.json',
  JSON.stringify(heatmap, null, 2)
);

console.log('Selector heatmap generated.');