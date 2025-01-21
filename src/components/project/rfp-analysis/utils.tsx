import { CheckSquare, Calendar, ListChecks, AlertTriangle } from "lucide-react";
import type { AnalysisSection } from "./types";
import { ReactNode } from "react";

export function parseAnalysis(text: string): AnalysisSection[] {
  const sections = text.split(/\d\.\s+(?=[A-Z])/);
  const sectionTitles = text.match(/\d\.\s+[A-Z][^:\n]+/g) || [];
  
  return sectionTitles.map((title, index) => {
    const cleanTitle = title.replace(/^\d\.\s+/, '');
    const content = sections[index + 1]
      ?.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s+/, ''))
      .filter(Boolean) || [];

    const icon = getIconForSection(cleanTitle);
    
    return {
      title: cleanTitle,
      content,
      icon
    };
  });
}

export function getIconForSection(title: string): ReactNode {
  switch (title) {
    case 'Key Requirements':
      return <CheckSquare className="h-5 w-5" />;
    case 'Timeline & Deadlines':
      return <Calendar className="h-5 w-5" />;
    case 'Evaluation Criteria':
      return <ListChecks className="h-5 w-5" />;
    case 'Required Response Elements':
      return <CheckSquare className="h-5 w-5" />;
    case 'Risk Assessment':
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return null;
  }
}