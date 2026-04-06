/**
 * Count words in a text string, handling edge cases like
 * multiple spaces, newlines, HTML tags, and whitespace-only strings.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>/g, " ");
  // Split on whitespace and filter empty tokens
  const words = stripped.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 && words[0] !== "" ? words.length : 0;
}
