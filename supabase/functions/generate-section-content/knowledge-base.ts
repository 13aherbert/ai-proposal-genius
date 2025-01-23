import { KnowledgeEntry } from './types';

export function formatKnowledgeBaseContext(entries: KnowledgeEntry[]): string {
  const entriesByCategory = entries.reduce((acc: { [key: string]: KnowledgeEntry[] }, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  let formattedContext = "=== KNOWLEDGE BASE CONTENT (YOU MUST USE THIS INFORMATION AND NOTHING ELSE) ===\n\n";
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]) => {
    formattedContext += `### ${category.toUpperCase()} ###\n\n`;
    categoryEntries.forEach(entry => {
      formattedContext += `${entry.title}:\n${entry.content}\n\n`;
    });
  });

  return formattedContext;
}