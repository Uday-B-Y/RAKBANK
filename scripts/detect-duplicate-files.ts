import fs from 'fs';
import path from 'path';

const fileMap: Record<string, string[]> = {};

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else {
      if (!fileMap[file]) fileMap[file] = [];
      fileMap[file].push(full);
    }
  });
}

walk('./src');

Object.entries(fileMap).forEach(([name, paths]) => {
  if (paths.length > 1) {
    console.log(`Duplicate file detected: ${name}`);
    console.log(paths);
  }
});

const duplicateCount = Object.values(fileMap).filter(paths => paths.length > 1).length;
if (duplicateCount > 0) {
  console.log(`\nDuplicate file check: ${duplicateCount} same-named file(s) across domains (informational)`);
} else {
  console.log('Duplicate file check: PASSED (no same-named files)');
}
