import fs from 'fs';
import path from 'path';

function scan(dir: string) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      scan(full);
    } else if (file.endsWith('.spec.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      const code = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      if (code.includes('@skip-ci')) return;

      if (code.includes('locator(') || code.includes('page.')) {
        console.error(`CAF violation in spec: ${full}`);
        process.exit(1);
      }
    }
  });
}

scan('./tests');
console.log('CAF compliant.');
