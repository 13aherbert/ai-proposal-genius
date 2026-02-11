import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Save, Wand2, Trash2 } from "lucide-react";
import { useProposalSections, ProposalSection } from "./useProposalSections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { AIProgress } from "@/components/shared/AIProgress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { updateSection, deleteSection } = useProposalSections(section.project_id);
  const { session } = useAuth();

  const handleSave = () => {
    updateSection(section.section_id, content, title);
    setIsEditing(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteSection(section.section_id);
    setIsDeleteDialogOpen(false);
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
    <>
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
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="hover:bg-destructive/90 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-brand-green hover:text-white h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={handleToggle}
              >
                {isSelected ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isSelected && (
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <Button
              onClick={generateContent}
              disabled={isGenerating}
              variant="outline"
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/50 text-white border-brand-green"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>
            {isGenerating && (
              <AIProgress progress={progress} label="Generating content" />
            )}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here..."
              className="min-h-[150px] sm:min-h-[200px] focus:border-brand-green focus-visible:ring-brand-green"
            />
            <Button 
              onClick={handleSave} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/50 text-white"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this section
              and its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
