export function scoreSelector(selector: string): number {
  let score = 100;

  if (/[a-f0-9]{8,}/i.test(selector)) score -= 40;
  if (/nth-child/.test(selector)) score -= 30;
  if ((selector.match(/>/g) || []).length > 2) score -= 20;
  if ((selector.match(/\./g) || []).length > 3) score -= 15;
  if (/css-[a-z0-9]+/.test(selector)) score -= 35;

  if (/data-testid/.test(selector)) score += 20;
  if (/getByRole/.test(selector)) score += 15;
  if (/aria-/.test(selector)) score += 10;

  return Math.max(0, Math.min(100, score));
}
