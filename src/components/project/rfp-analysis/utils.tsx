import { AlertTriangle, Calendar, FileCheck, ListChecks, Scale } from "lucide-react";
import { AnalysisSection } from "./types";

export function parseAnalysis(analysisText: string): AnalysisSection[] {
  const sections = [
    {
      title: "Key Requirements",
      icon: <ListChecks className="h-4 w-4 text-blue-500" />,
      content: [] as string[]
    },
    {
      title: "Timeline and Deadlines",
      icon: <Calendar className="h-4 w-4 text-green-500" />,
      content: [] as string[]
    },
    {
      title: "Evaluation Criteria",
      icon: <Scale className="h-4 w-4 text-purple-500" />,
      content: [] as string[]
    },
    {
      title: "Required Response Format",
      icon: <FileCheck className="h-4 w-4 text-orange-500" />,
      content: [] as string[]
    },
    {
      title: "Potential Risks",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      content: [] as string[]
    }
  ];

  let currentSection: AnalysisSection | null = null;

  analysisText.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) return;

    // Check if this line is a section header
    const sectionMatch = sections.find(section => 
      trimmedLine.toLowerCase().includes(section.title.toLowerCase())
    );

    if (sectionMatch) {
      currentSection = sectionMatch;
    } else if (currentSection && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
      // Clean up the bullet point and add to current section
      const content = trimmedLine.replace(/^[-•]\s*/, '').trim();
      if (content) {
        currentSection.content.push(content);
      }
    }
  });

  return sections;
}