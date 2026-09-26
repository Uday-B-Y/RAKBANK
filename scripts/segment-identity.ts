/**
 * CAF Segment Identity Utilities
 *
 * Provides content-based (non-positional) identity hashing for DOM segments.
 * Enables stable component identities that survive DOM reordering and
 * element insertion changes across regeneration runs.
 *
 * ACTIVATION STATUS: DEFERRED
 * ─────────────────────────────────────────────────────────────────────────
 * Content hashes are computed and stored in the `contentHash` field of every
 * Segment, but the positional `id` field (e.g., `form_0`) is UNCHANGED until
 * TIER 1.8 activates this feature.
 *
 * To activate content-based IDs in TIER 1.8:
 *   1. Pass `useContentHash = true` to buildSegmentId() in dom-segmenter.ts
 *   2. Update the Segment `id` field description in documentation
 *   3. Verify analysis.json consumers use `contentHash` for cross-page matching
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Roadmap: TIER 0 — H2 (Content-Based Identity Hash)
 * Implemented: 2026-03-11
 * Activation: TIER 1.8 — Segment Deduplication Engine
 */

import crypto from 'crypto';

/**
 * Computes a deterministic 8-character hex hash for a segment based on its
 * structural content: type + selectorHint + semanticName.
 *
 * The hash is stable as long as these three inputs are stable — i.e., an
 * element retains its ID/aria-label/heading text and structural type across
 * DOM changes.
 *
 * @param type         - Component type (e.g., 'form', 'navigation')
 * @param selectorHint - CSS selector hint (e.g., '#loginForm', 'nav')
 * @param semanticName - Optional semantic name derived from DOM attributes
 * @returns 8-character lowercase hex string (e.g., 'a3f2c819')
 */
export function computeSegmentHash(
  type: string,
  selectorHint: string,
  semanticName?: string
): string {
  const input = `${type}|${selectorHint}|${semanticName ?? ''}`;
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 8);
}

/**
 * Builds a segment ID using either a content-based hash (TIER 1.8+) or a
 * positional index (current default behavior).
 *
 * @param type           - Component type (e.g., 'form', 'navigation')
 * @param selectorHint   - CSS selector hint for this segment
 * @param semanticName   - Optional semantic name derived from DOM
 * @param index          - Current insertion index (fallback for positional IDs)
 * @param useContentHash - Set true in TIER 1.8 to enable stable content-based IDs
 * @returns Segment ID string, e.g., 'form_0' (positional) or 'form_a3f2c819' (hash)
 */
export function buildSegmentId(
  type: string,
  selectorHint: string,
  semanticName: string | undefined,
  index: number,
  useContentHash = false
): string {
  if (useContentHash) {
    const hash = computeSegmentHash(type, selectorHint, semanticName);
    return `${type}_${hash}`;
  }
  return `${type}_${index}`;
}
