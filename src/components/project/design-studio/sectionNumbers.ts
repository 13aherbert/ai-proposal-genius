import { ContentBlock } from './types';

/**
 * Computes section numbers for heading blocks (1, 1.1, 1.1.1 etc.)
 * Returns a map of blockId -> section number string.
 */
export function computeSectionNumbers(blocks: ContentBlock[]): Record<string, string> {
  const counters = [0, 0, 0]; // h1, h2, h3
  const result: Record<string, string> = {};

  for (const block of blocks) {
    if (block.type !== 'heading') continue;
    const level = Number((block.content as { level?: number }).level) || 2;
    const idx = Math.min(level, 3) - 1;

    counters[idx]++;
    // Reset lower-level counters
    for (let i = idx + 1; i < counters.length; i++) counters[i] = 0;

    const parts = counters.slice(0, idx + 1);
    result[block.id] = parts.join('.');
  }

  return result;
}
