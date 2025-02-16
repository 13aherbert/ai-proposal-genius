
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Save, Wand2 } from "lucide-react";
import { useProposalSections, ProposalSection } from "./useProposalSections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { AIProgress } from "@/components/shared/AIProgress";

interface SectionEditorProps {
  section: ProposalSection;
  isSelected: boolean;
  onSelect: () => void;
}

export function SectionEditor({ section, isSelected, onSelect }: SectionEditorProps) {
  const [title, setTitle] = useState(section.section_title);
  const [content, setContent] = useState(section.content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { updateSection } = useProposalSections(section.project_id);
  const { session } = useAuth();

  const handleSave = () => {
    updateSection(section.id, content, title);
    setIsEditing(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const generateContent = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to generate content");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 15, 90);
        return next;
      });
    }, 1000);

    try {
      console.log('Generating content for project:', section.project_id);
      const { data, error } = await supabase.functions.invoke('generate-section-content', {
        body: { 
          sectionTitle: title,
          projectId: section.project_id,
          userId: session.user.id
        },
      });

      if (error) throw error;
      if (!data?.content) throw new Error('No content generated');

      setContent(data.content);
      setProgress(100);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <CardTitle 
                className="text-lg hover:bg-brand-green hover:text-white p-2 rounded-md cursor-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                {title}
              </CardTitle>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-brand-green hover:text-white"
            onClick={handleToggle}
          >
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
              className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white border-brand-green"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
          {isGenerating && (
            <AIProgress progress={progress} label="Generating content" />
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content here..."
            className="min-h-[200px] focus:border-brand-green focus-visible:ring-brand-green"
          />
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
