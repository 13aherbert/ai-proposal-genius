
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AnalysisSection } from "./types";
import ReactMarkdown from 'react-markdown';

interface AnalysisContentProps {
  sections: AnalysisSection[];
  onReset: () => void;
}

export function AnalysisContent({ sections, onReset }: AnalysisContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {sections.map((section, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-base sm:text-lg text-white">
            {section.icon}
            {section.title}
          </div>
          {section.content.length > 0 ? (
            <div className="space-y-1 text-sm text-white/90 pl-4 sm:pl-6">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="prose prose-sm max-w-none prose-invert">
                  <ReactMarkdown>{item}</ReactMarkdown>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/70 pl-6">No details provided</p>
          )}
        </div>
      ))}
      <Button 
        variant="outline" 
        className="mt-4 bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
        onClick={onReset}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        New Analysis
      </Button>
    </div>
  );
}
