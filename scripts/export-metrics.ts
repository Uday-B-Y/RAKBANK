import fs from 'fs';

const metrics = {
  selectorUsage: fs.existsSync('selector-usage.json')
    ? JSON.parse(fs.readFileSync('selector-usage.json', 'utf-8'))
    : {},
  flakeSummary: fs.existsSync('flake-summary.json')
    ? JSON.parse(fs.readFileSync('flake-summary.json', 'utf-8'))
    : {}
};

fs.writeFileSync('automation-metrics.json', JSON.stringify(metrics, null, 2));
console.log('Automation metrics exported.');