import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

export interface SelectorCandidate {
  primary: string;
  fallback: string[];
  score: number;
  strategy: 'testid' | 'id-css' | 'attr-css' | 'role';
  tier: 'gold' | 'silver';
  meta: {
    interactive: boolean;
    semanticId: boolean;
    dynamicId: boolean;
    systemId: boolean;
  };
}

const REJECT_TAGS = ['meta', 'script', 'link', 'style', 'noscript'];
const SYSTEM_PREFIXES = ['_', 'mui', 'react', 'ng-', 'wfx'];
const MIN_SCORE_THRESHOLD = 75;

function isGuidLike(value: string): boolean {
  return /^[a-f0-9-]{16,}$/i.test(value);
}

function hasNumericSuffix(value: string): boolean {
  return /\d{3,}$/.test(value);
}

function hasSystemPrefix(value: string): boolean {
  return SYSTEM_PREFIXES.some(prefix =>
    value.toLowerCase().startsWith(prefix)
  );
}

function isStageLike(id: string): boolean {
  return /^stage\d+$/i.test(id);
}

function isInteractive(tag: string): boolean {
  return ['button', 'input', 'select', 'textarea', 'a'].includes(tag);
}

function classifySelector(
  id: string | undefined,
  testid: string | undefined,
  name: string | undefined,
  role: string | undefined,
  tag: string
) {
  const interactive = isInteractive(tag);

  // ===== TESTID =====
  if (testid) {
    return {
      score: 100,
      tier: 'gold' as const,
      semanticId: true,
      dynamicId: false,
      systemId: false
    };
  }

  if (id) {
    const dynamicId = isGuidLike(id) || isStageLike(id);
    const systemId = hasSystemPrefix(id);
    const numericHeavy = hasNumericSuffix(id);

    // 🚫 EXCLUDE dynamic IDs entirely
    if (dynamicId) return null;

    // 🚫 EXCLUDE system IDs entirely
    if (systemId) return null;

    // Stable ID
    return {
      score: interactive ? 95 : 90,
      tier: 'gold' as const,
      semanticId: !numericHeavy,
      dynamicId: false,
      systemId: false
    };
  }

  if (name) {
    return {
      score: 85,
      tier: 'silver' as const,
      semanticId: true,
      dynamicId: false,
      systemId: false
    };
  }

  if (role) {
    return {
      score: 80,
      tier: 'silver' as const,
      semanticId: true,
      dynamicId: false,
      systemId: false
    };
  }

  return null;
}

export function extractSelectors(html: string): SelectorCandidate[] {
  const $ = cheerio.load(html);
  const results: SelectorCandidate[] = [];
  const seen = new Set<string>();

  $('*').each((_, el) => {
    if (el.type !== 'tag') return;

    const tag = el.name.toLowerCase();
    if (REJECT_TAGS.includes(tag)) return;

    const $el = $(el);

    const id = $el.attr('id');
    const testid = $el.attr('data-testid');
    const name = $el.attr('name');
    const role = $el.attr('role');
    const type = $el.attr('type');

    if (type === 'hidden') return;
    if ($el.attr('aria-hidden') === 'true') return;

    const classification = classifySelector(id, testid, name, role, tag);
    if (!classification) return;

    if (classification.score < MIN_SCORE_THRESHOLD) return;

    let primary = '';
    const fallback: string[] = [];
    let strategy: SelectorCandidate['strategy'] = 'id-css';

    if (testid) {
      primary = `[data-testid="${testid}"]`;
      strategy = 'testid';
    } else if (id) {
      primary = `#${id}`;
      fallback.push(`${tag}#${id}`);
      strategy = 'id-css';
    } else if (name) {
      primary = `${tag}[name="${name}"]`;
      strategy = 'attr-css';
    } else if (role) {
      primary = `[role="${role}"]`;
      strategy = 'role';
    } else {
      return;
    }

    if (seen.has(primary)) return;
    seen.add(primary);

    results.push({
      primary,
      fallback,
      score: classification.score,
      strategy,
      tier: classification.tier,
      meta: {
        interactive: isInteractive(tag),
        semanticId: classification.semanticId,
        dynamicId: false,
        systemId: false
      }
    });
  });

  return results.sort((a, b) => b.score - a.score);
}