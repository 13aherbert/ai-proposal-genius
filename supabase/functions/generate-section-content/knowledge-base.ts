import { KnowledgeEntry } from "./types.ts";

export function formatKnowledgeBaseContext(entries: KnowledgeEntry[]): string {
  if (!entries || entries.length === 0) {
    return "No knowledge base entries available.";
  }

  // Group entries by category for better organization
  const entriesByCategory = entries.reduce((acc: { [key: string]: KnowledgeEntry[] }, entry) => {
    const category = entry.category.replace(/-/g, ' ').toUpperCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entry);
    return acc;
  }, {});

  let formattedContext = "KNOWLEDGE BASE CONTENT:\n\n";
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]) => {
    formattedContext += `${category}:\n\n`;
    categoryEntries.forEach(entry => {
      formattedContext += `=== ${entry.title} ===\n`;
      if (entry.content && entry.content.trim()) {
        formattedContext += `${entry.content}\n`;
      }
      if (entry.parsed_content && entry.parsed_content.trim()) {
        formattedContext += `${entry.parsed_content}\n`;
      }
      formattedContext += '\n';
    });
    formattedContext += '---\n\n';
  });

  return formattedContext;
}