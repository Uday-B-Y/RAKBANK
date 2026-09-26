import fs from 'fs';
import path from 'path';

const USAGE_PATH = path.resolve(process.cwd(), 'selector-usage.json');

interface UsageData {
  [selector: string]: {
    fallbackUsed: number;
    primarySuccess: number;
  };
}

function readUsage(): UsageData {
  if (!fs.existsSync(USAGE_PATH)) return {};
  return JSON.parse(fs.readFileSync(USAGE_PATH, 'utf-8'));
}

function writeUsage(data: UsageData) {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(data, null, 2));
}

export function recordPrimarySuccess(selector: string) {
  const data = readUsage();
  data[selector] = data[selector] || { fallbackUsed: 0, primarySuccess: 0 };
  data[selector].primarySuccess++;
  writeUsage(data);
}

export function recordFallbackUsage(selector: string) {
  const data = readUsage();
  data[selector] = data[selector] || { fallbackUsed: 0, primarySuccess: 0 };
  data[selector].fallbackUsed++;
  writeUsage(data);
}
