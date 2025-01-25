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
      if (entry.content || entry.parsed_content) {
        // Include both the content and parsed_content if available
        const content = entry.content || '';
        const parsedContent = entry.parsed_content || '';
        formattedContext += `${entry.title}:\n${content}\n${parsedContent}\n\n`;
      }
    });
  });

  return formattedContext;
}