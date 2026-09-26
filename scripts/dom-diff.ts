import fs from 'fs';
import { extractSelectors } from './selector-inventory';

const oldHtml = fs.readFileSync('baseline.html', 'utf-8');
const newHtml = fs.readFileSync('current.html', 'utf-8');

const oldSelectors = extractSelectors(oldHtml).map(s => s.primary);
const newSelectors = extractSelectors(newHtml).map(s => s.primary);

const removed = oldSelectors.filter(s => !newSelectors.includes(s));
const added = newSelectors.filter(s => !oldSelectors.includes(s));

fs.writeFileSync(
  'dom-diff-report.json',
  JSON.stringify({ removed, added }, null, 2)
);

console.log('DOM diff report generated.');