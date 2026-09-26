import fs from 'fs';
import path from 'path';

const SETUP_DATA_PATH = path.resolve(process.cwd(), 'setup-data.json');

export interface SetupData {
  version: string;
  environmentHash: string;
  runId: string;
  [key: string]: string;
}

export class SetupDataStorage {
  static load(): SetupData | null {
    if (!fs.existsSync(SETUP_DATA_PATH)) return null;
    try {
      return JSON.parse(fs.readFileSync(SETUP_DATA_PATH, 'utf-8'));
    } catch {
      return null;
    }
  }

  static save(data: SetupData): void {
    const tmpPath = SETUP_DATA_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, SETUP_DATA_PATH);
  }
}
