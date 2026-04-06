import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ChevronDown, ChevronUp, Save, Wand2, Trash2 } from "lucide-react";
import { countWords } from "@/utils/wordCount";
import { useProposalSections, ProposalSection } from "./useProposalSections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { AIProgress } from "@/components/shared/AIProgress";
import { useAutoSave, SaveStatus } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "./components/SaveStatusIndicator";
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
  onSaveStatusChange?: (sectionId: string, status: SaveStatus) => void;
}

export function SectionEditor({ section, isSelected, onSelect, onSaveStatusChange }: SectionEditorProps) {
  const [title, setTitle] = useState(section.section_title);
  const [content, setContent] = useState(section.content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { updateSection, deleteSection } = useProposalSections(section.project_id);
  const { session } = useAuth();

  const storageKey = `autosave_section_${section.section_id}`;

  // Restore from localStorage backup on mount
  useEffect(() => {
    try {
      const backup = localStorage.getItem(storageKey);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed.content && parsed.content !== section.content) {
          setContent(parsed.content);
          if (parsed.title) setTitle(parsed.title);
        }
      }
    } catch { /* ignore */ }
  }, [section.section_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveAsync = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        updateSection(section.section_id, content, title);
        // updateSection is fire-and-forget via mutation; resolve optimistically
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }, [updateSection, section.section_id, content, title]);

  const { status, markDirty, saveNow, retry } = useAutoSave({
    delay: 2000,
    storageKey,
    onSave: handleSaveAsync,
  });

  // Report status changes to parent
  useEffect(() => {
    onSaveStatusChange?.(section.section_id, status);
  }, [status, section.section_id, onSaveStatusChange]);

  const handleContentChange = (html: string) => {
    setContent(html);
    markDirty(JSON.stringify({ content: html, title }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    markDirty(JSON.stringify({ content, title: newTitle }));
  };

  const handleBlur = () => {
    if (status === "unsaved") {
      saveNow();
    }
  };

  const handleManualSave = () => {
    saveNow();
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
      // Auto-save the generated content
      markDirty(JSON.stringify({ content: data.content, title }));
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
                  onChange={handleTitleChange}
                  onBlur={handleBlur}
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
              <SaveStatusIndicator status={status} onRetry={retry} />
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
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              onBlur={handleBlur}
              placeholder="Start writing or use AI to generate content..."
            />
            <div className="flex items-center justify-between">
              <Button 
                onClick={handleManualSave} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/50 text-white"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <span className="text-xs text-muted-foreground">
                {countWords(content)} words
              </span>
            </div>
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
