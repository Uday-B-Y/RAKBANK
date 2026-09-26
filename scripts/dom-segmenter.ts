import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import { toPascalCase } from './naming';
import { buildSegmentId, computeSegmentHash } from './segment-identity';

export type ComponentType =
  | 'navigation'
  | 'form'
  | 'table'
  | 'modal'
  | 'section'
  | 'panel'
  | 'toolbar'
  | 'tabcontainer'
  | 'layout';

export interface Segment {
  id: string;
  type: ComponentType;
  selectorHint: string;
  semanticName?: string;
  signature?: string;
  /** Content-based identity hash (TIER 0 H2). Stable across positional shifts.
   *  Used by TIER 1.8 (Segment Deduplication) for cross-page identity matching.
   *  Currently stored but NOT used as the `id` — activate in TIER 1.8. */
  contentHash?: string;
}


function isGuidLike(value: string): boolean {
  return /^[a-f0-9-]{16,}$/i.test(value);
}

function isLikelyLayoutId(id: string): boolean {
  return !isGuidLike(id) && id.length > 3;
}

/* ============================================================
   Structural Fingerprint
============================================================ */

function buildSignature(
  $root: cheerio.Cheerio<Element>,
  type: ComponentType
): string {
  const inputs = $root.find('input, select, textarea').length;
  const buttons = $root.find('button').length;
  const tables = $root.find('table').length;
  const links = $root.find('a').length;

  return `${type}|i:${inputs}|b:${buttons}|t:${tables}|l:${links}`;
}

/* ============================================================
   Semantic Name Extraction
============================================================ */

function extractSemanticName(
  $root: cheerio.Cheerio<Element>
): string | undefined {

  const id = $root.attr('id');
  if (id && !isGuidLike(id)) {
    return toPascalCase(id);
  }

  const ariaLabel = $root.attr('aria-label');
  if (ariaLabel) return toPascalCase(ariaLabel);

  const heading = $root.find('h1, h2, h3').first().text().trim();
  if (heading) return toPascalCase(heading);

  const legend = $root.find('legend').first().text().trim();
  if (legend) return toPascalCase(legend);

  return undefined;
}

/* ============================================================
   Selector Hint Builder
============================================================ */

function buildSelectorHint(
  $el: cheerio.Cheerio<Element>,
  tag: string
): string | null {

  const id = $el.attr('id');
  const role = $el.attr('role');

  if (id && !isGuidLike(id)) {
    return `#${id}`;
  }

  if (role === 'dialog') return `[role="dialog"]`;
  if (role === 'navigation') return `[role="navigation"]`;
  if (role === 'tablist') return `[role="tablist"]`;

  if (tag === 'nav') return 'nav';
  if (tag === 'form') return 'form';
  if (tag === 'table') return 'table';

  return null;
}

/* ============================================================
   Aggressive Segmentation Engine
============================================================ */

export function segmentDom(html: string): Segment[] {

  const $ = cheerio.load(html);
  const segments: Segment[] = [];
  const signatureSet = new Set<string>();

  const addSegment = (
    type: ComponentType,
    $el: cheerio.Cheerio<Element>,
    tag: string
  ) => {

    const selectorHint = buildSelectorHint($el, tag);
    if (!selectorHint) return;

    const semanticName = extractSemanticName($el);
    const signature = buildSignature($el, type);

    // Skip generic layout tables without identity
    if (
      type === 'table' &&
      selectorHint === 'table' &&
      !semanticName
    ) {
      return;
    }

    // Deduplicate identical structural blocks
    if (signatureSet.has(signature)) return;
    signatureSet.add(signature);

    // H2: Content-based IDs activated in TIER 1.8 — stable across DOM reordering.
    const segmentId = buildSegmentId(type, selectorHint, semanticName, segments.length, true);

    // H2: Compute content-based hash now (deferred activation — see segment-identity.ts)
    const contentHash = computeSegmentHash(type, selectorHint, semanticName);

    segments.push({
      id: segmentId,
      type,
      selectorHint,
      semanticName,
      signature,
      contentHash
    });
  };

  $('*').each((_, el) => {

    if (el.type !== 'tag') return;

    const tag = el.name.toLowerCase();
    const $el = $(el);

    const inputs = $el.find('input, select, textarea').length;
    const buttons = $el.find('button').length;
    const tables = $el.find('table').length;
    const id = $el.attr('id');
    const role = $el.attr('role');

    /* =============================
       Core Structural Types
    ============================== */

    if (tag === 'form') {
      addSegment('form', $el, tag);
    }

    if (tag === 'table') {
      addSegment('table', $el, tag);
    }

    if (tag === 'nav' || role === 'navigation') {
      addSegment('navigation', $el, tag);
    }

    if (role === 'dialog') {
      addSegment('modal', $el, tag);
    }

    /* =============================
       Aggressive Enhancements
    ============================== */

    // 1️⃣ Toolbar (button clusters)
    if (
      buttons >= 3 &&
      inputs === 0 &&
      tables === 0 &&
      id &&
      isLikelyLayoutId(id)
    ) {
      addSegment('toolbar', $el, tag);
    }

    // 2️⃣ Filter / Input Panel
    if (
      inputs >= 5 &&
      tables === 0 &&
      id &&
      isLikelyLayoutId(id)
    ) {
      addSegment('panel', $el, tag);
    }

    // 3️⃣ Tab Container
    if (role === 'tablist') {
      addSegment('tabcontainer', $el, tag);
    }

    // 4️⃣ Layout Containers (stable ID divs)
    if (
      tag === 'div' &&
      id &&
      isLikelyLayoutId(id) &&
      inputs + buttons + tables > 3
    ) {
      addSegment('layout', $el, tag);
    }

  });

  return segments;
}