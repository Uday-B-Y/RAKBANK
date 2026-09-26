import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(process.argv[2], 'utf8');

const patterns = {
  table: /tbody\s+tr/,
  modal: /role=['"]dialog['"]/,
  form: /input\[required\]/,
  banner: /role=['"](alert|status)['"]/
};

for (const [type, regex] of Object.entries(patterns)) {
  if (regex.test(content)) {
    console.log(`FOUND ${type.toUpperCase()} → use ${type} component`);
  }
}


// npm run extract src/pages/lims/EnterResults.page.ts
