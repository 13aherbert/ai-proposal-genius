import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Save, Wand2 } from "lucide-react";
import { useProposalSections, ProposalSection } from "./useProposalSections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SectionEditorProps {
  section: ProposalSection;
  isSelected: boolean;
  onSelect: () => void;
}

export function SectionEditor({ section, isSelected, onSelect }: SectionEditorProps) {
  const [content, setContent] = useState(section.content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const { updateSection } = useProposalSections(section.project_id);

  const handleSave = () => {
    updateSection(section.id, content);
  };

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-section-content', {
        body: { sectionTitle: section.section_title },
      });

      if (error) throw error;
      if (!data?.content) throw new Error('No content generated');

      setContent(data.content);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{section.section_title}</CardTitle>
          <Button variant="ghost" size="sm">
            {isSelected ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isSelected && (
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={generateContent}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content here..."
            className="min-h-[200px]"
          />
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      )}
    </Card>
  );
}