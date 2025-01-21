import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AnalysisSection } from "./types";

interface AnalysisContentProps {
  sections: AnalysisSection[];
  onReset: () => void;
}

export function AnalysisContent({ sections, onReset }: AnalysisContentProps) {
  return (
    <CardContent className="space-y-6">
      {sections.map((section, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-lg">
            {section.icon}
            {section.title}
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-6">
            {section.content.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={onReset}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        New Analysis
      </Button>
    </CardContent>
  );
}