import { useState, useCallback, useMemo } from "react";

export interface OutlineSection {
  id: string;
  number: number;
  title: string;
  description: string;
}

let nextId = 1;
function uid() {
  return `os-${Date.now()}-${nextId++}`;
}

/**
 * Parse a markdown outline (## headings with body text) into structured sections.
 */
export function parseOutlineToSections(markdown: string): OutlineSection[] {
  if (!markdown?.trim()) return [];

  const lines = markdown.split("\n");
  const sections: OutlineSection[] = [];
  let current: { title: string; descLines: string[] } | null = null;

  for (const line of lines) {
    // Match ## or ### headings, with optional numbering like "1." or "1:"
    const headingMatch = line.match(/^#{1,3}\s+(?:\d+[\.\):]\s*)?(.+)/);
    if (headingMatch) {
      if (current) {
        sections.push({
          id: uid(),
          number: sections.length + 1,
          title: current.title.trim(),
          description: current.descLines.join("\n").trim(),
        });
      }
      current = { title: headingMatch[1].trim(), descLines: [] };
    } else if (current) {
      // Strip leading bullet markers
      const cleaned = line.replace(/^[\s]*[-*•]\s*/, "").trim();
      if (cleaned) current.descLines.push(cleaned);
    }
  }

  if (current) {
    sections.push({
      id: uid(),
      number: sections.length + 1,
      title: current.title.trim(),
      description: current.descLines.join("\n").trim(),
    });
  }

  return sections;
}

/**
 * Convert structured sections back to markdown.
 */
export function sectionsToMarkdown(sections: OutlineSection[]): string {
  return sections
    .map((s, i) => {
      let md = `## ${i + 1}. ${s.title}`;
      if (s.description) {
        md +=
          "\n" +
          s.description
            .split("\n")
            .map((l) => `- ${l}`)
            .join("\n");
      }
      return md;
    })
    .join("\n\n");
}

export function useOutlineSections(initialMarkdown: string | null) {
  const originalSections = useMemo(
    () => parseOutlineToSections(initialMarkdown || ""),
    [initialMarkdown]
  );

  const [sections, setSections] = useState<OutlineSection[]>(originalSections);

  // Detect if user has modified the outline
  const isModified = useMemo(() => {
    if (sections.length !== originalSections.length) return true;
    return sections.some(
      (s, i) =>
        s.title !== originalSections[i]?.title ||
        s.description !== originalSections[i]?.description
    );
  }, [sections, originalSections]);

  const renumber = (list: OutlineSection[]) =>
    list.map((s, i) => ({ ...s, number: i + 1 }));

  const reorder = useCallback((oldIndex: number, newIndex: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return renumber(next);
    });
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  }, []);

  const updateDescription = useCallback((id: string, description: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, description } : s))
    );
  }, []);

  const deleteSection = useCallback((id: string) => {
    setSections((prev) => renumber(prev.filter((s) => s.id !== id)));
  }, []);

  const addSection = useCallback(() => {
    setSections((prev) =>
      renumber([
        ...prev,
        { id: uid(), number: prev.length + 1, title: "New Section", description: "" },
      ])
    );
  }, []);

  const resetToOriginal = useCallback(() => {
    setSections([...originalSections]);
  }, [originalSections]);

  const getMarkdown = useCallback(() => sectionsToMarkdown(sections), [sections]);

  return {
    sections,
    setSections,
    isModified,
    reorder,
    updateTitle,
    updateDescription,
    deleteSection,
    addSection,
    resetToOriginal,
    getMarkdown,
  };
}
