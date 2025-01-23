import { KnowledgeEntry } from './types';

/**
 * Formats knowledge base entries into a structured context string
 * @param entries - Array of knowledge base entries
 * @returns Formatted context string for AI prompt
 */
export function formatKnowledgeBaseContext(entries: KnowledgeEntry[]): string {
  // Group entries by category
  const entriesByCategory = entries.reduce((acc: { [key: string]: KnowledgeEntry[] }, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  let formattedContext = "=== KNOWLEDGE BASE CONTENT (YOU MUST USE THIS INFORMATION AND NOTHING ELSE) ===\n\n";
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]: [string, KnowledgeEntry[]]) => {
    formattedContext += `### ${category.toUpperCase()} ###\n\n`;
    categoryEntries.forEach(entry => {
      formattedContext += `${entry.title}:\n${entry.content}\n\n`;
    });
  });

  return formattedContext;
}