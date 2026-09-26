import fs from 'fs';
import path from 'path';
import { compileDom } from './dom-compiler';

interface BatchItem {
  htmlPath: string;
  pageName: string;
  domain: string;
}

const batchConfig: BatchItem[] = JSON.parse(
  fs.readFileSync('dom-batch-config.json', 'utf-8')
);

for (const item of batchConfig) {
  compileDom(item);
}