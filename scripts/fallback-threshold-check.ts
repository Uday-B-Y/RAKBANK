import fs from 'fs';

const THRESHOLD = 10; // adjust as needed

if (!fs.existsSync('selector-usage.json')) {
  console.log('No selector usage file found.');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync('selector-usage.json', 'utf-8'));

let failed = false;

for (const selector in data) {
  if (data[selector].fallbackUsed > THRESHOLD) {
    console.error(
      `Selector overusing fallback: ${selector} (fallbackUsed=${data[selector].fallbackUsed})`
    );
    failed = true;
  }
}

if (failed) {
  console.error('CI Gate Failed: Fallback usage exceeded threshold');
  process.exit(1);
}

console.log('Fallback usage within acceptable limits.');