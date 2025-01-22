import { CheckSquare, Calendar, ListChecks, AlertTriangle } from "lucide-react";
import type { AnalysisSection } from "./types";
import { ReactNode } from "react";

export function parseAnalysis(text: string): AnalysisSection[] {
  // First, split by numbered sections (1., 2., etc)
  const sections = text.split(/\d\.\s+/);
  
  // Remove any empty sections
  const validSections = sections.filter(Boolean);
  
  return validSections.map(section => {
    // Split section into title and content
    const [title, ...contentLines] = section.split('\n').filter(Boolean);
    
    // Clean up the title
    const cleanTitle = title.trim();
    
    // Process content lines, keeping only bullet points
    const content = contentLines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(Boolean);

    const icon = getIconForSection(cleanTitle);
    
    return {
      title: cleanTitle,
      content,
      icon
    };
  });
}

export function getIconForSection(title: string): ReactNode {
  // Normalize the title for comparison
  const normalizedTitle = title.toLowerCase().trim();
  
  if (normalizedTitle.includes('key requirement')) {
    return <CheckSquare className="h-5 w-5" />;
  }
  if (normalizedTitle.includes('timeline') || normalizedTitle.includes('deadline')) {
    return <Calendar className="h-5 w-5" />;
  }
  if (normalizedTitle.includes('evaluation')) {
    return <ListChecks className="h-5 w-5" />;
  }
  if (normalizedTitle.includes('required response')) {
    return <CheckSquare className="h-5 w-5" />;
  }
  if (normalizedTitle.includes('risk')) {
    return <AlertTriangle className="h-5 w-5" />;
  }
  return <CheckSquare className="h-5 w-5" />; // Default icon
}
