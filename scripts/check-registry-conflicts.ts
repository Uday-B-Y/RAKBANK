import fs from 'fs';

const registryPath = '.cursor/docs/registry.md';

if (!fs.existsSync(registryPath)) {
  console.error('Registry not found.');
  process.exit(1);
}

const content = fs.readFileSync(registryPath, 'utf-8');
const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

// Filter out markdown formatting lines (table headers, separators, section headers)
const entryLines = lines.filter(line => {
  // Skip table headers and separators
  if (line === '| Name | Path |' || line === '|------|------|') return false;
  // Skip markdown section headers, horizontal rules, and metadata
  if (line.startsWith('#') || line.startsWith('---') || line.startsWith('>') || line.startsWith('**')) return false;
  // Only consider actual table entries (lines starting with | and containing path)
  return line.startsWith('|') && line.includes('`');
});

const duplicates = entryLines.filter((item, index) => entryLines.indexOf(item) !== index);

if (duplicates.length > 0) {
  console.error('Duplicate entries found in registry:');
  console.error(duplicates);
  process.exit(1);
}

console.log('Registry clean.');