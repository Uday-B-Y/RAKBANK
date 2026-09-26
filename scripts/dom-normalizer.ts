import fs from 'fs';

function removeHashedClasses(html: string): string {
  return html.replace(
    /class="([^"]*)"/gi,
    (_match: string, classContent: string) => {
      const filtered = classContent
        .split(' ')
        .filter((cls: string) => {
          if (!cls) return false;
          if (/^css-/.test(cls)) return false;
          if (/^Mui/.test(cls)) return false;
          if (/^[a-f0-9]{8,}$/i.test(cls)) return false;
          return true;
        })
        .join(' ');

      return filtered ? `class="${filtered}"` : '';
    }
  );
}

function removeGuidIds(html: string): string {
  return html.replace(/id="([a-f0-9-]{16,})"/gi, '');
}

export function normalizeDom(htmlPath: string): string {
  let raw: string = fs.readFileSync(htmlPath, 'utf-8');

  raw = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/sourceMappingURL=.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  raw = removeGuidIds(raw);
  raw = removeHashedClasses(raw);

  return raw;
}