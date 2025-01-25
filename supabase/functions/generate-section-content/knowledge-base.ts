import { KnowledgeEntry } from "./types.ts";

export function formatKnowledgeBaseContext(entries: KnowledgeEntry[]): string {
  if (!entries || entries.length === 0) {
    return "No knowledge base entries available.";
  }

  const entriesByCategory = entries.reduce((acc: { [key: string]: KnowledgeEntry[] }, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  let formattedContext = "=== KNOWLEDGE BASE CONTENT (YOU MUST USE THIS INFORMATION) ===\n\n";
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]) => {
    formattedContext += `### ${category.toUpperCase()} ###\n\n`;
    categoryEntries.forEach(entry => {
      formattedContext += `${entry.title}:\n${entry.content || entry.parsed_content || 'No content available'}\n\n`;
    });
  });

  return formattedContext;
}