import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ChevronDown, ChevronUp, Save, Wand2, Trash2, Lock } from "lucide-react";
import { countWords } from "@/utils/wordCount";
import { useProposalSections, ProposalSection } from "./useProposalSections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { AIProgress } from "@/components/shared/AIProgress";
import { useAutoSave, SaveStatus } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "./components/SaveStatusIndicator";
import { WorkflowStatusBadge } from "./components/WorkflowStatusBadge";
import { SectionStatusControl } from "./components/SectionStatusControl";
import { SectionAssignee } from "./components/SectionAssignee";
import { SectionDueDate } from "./components/SectionDueDate";
import { useSectionWorkflow, WorkflowStatus } from "./hooks/useSectionWorkflow";
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
  members?: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string }>;
  showTeamFeatures?: boolean;
  onComment?: (sectionId: string, quotedText: string, from: number, to: number) => void;
}

export function SectionEditor({ section, isSelected, onSelect, onSaveStatusChange, members = [], showTeamFeatures = false, onComment }: SectionEditorProps) {
  const [title, setTitle] = useState(section.section_title);
  const [content, setContent] = useState(section.content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { updateSection, deleteSection } = useProposalSections(section.project_id);
  const { session } = useAuth();
  const workflow = useSectionWorkflow(section.project_id);

  const currentUserId = session?.user?.id;
  const workflowStatus = (section.workflow_status || "draft") as WorkflowStatus;
  const isAssignee = section.assigned_to === currentUserId;
  const currentMember = members.find(m => m.user_id === currentUserId);
  const isAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";
  const isReviewer = isAdmin; // Admins can review

  // Locking logic
  const isLockedForAssignee = workflowStatus === "in_review" && isAssignee && !isAdmin;
  const isLockedForAll = workflowStatus === "approved" && !isAdmin;
  const isReadOnly = isLockedForAssignee || isLockedForAll;

  const storageKey = `autosave_section_${section.section_id}`;

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

  useEffect(() => {
    onSaveStatusChange?.(section.section_id, status);
  }, [status, section.section_id, onSaveStatusChange]);

  const handleContentChange = (html: string) => {
    if (isReadOnly) return;
    setContent(html);
    markDirty(JSON.stringify({ content: html, title }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    markDirty(JSON.stringify({ content, title: newTitle }));
  };

  const handleBlur = () => {
    if (status === "unsaved") saveNow();
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

  const handleTransition = (newStatus: WorkflowStatus, comment?: string) => {
    workflow.transition({
      sectionId: section.section_id,
      newStatus,
      reviewComment: comment,
      projectId: section.project_id,
    });
  };

  const generateContent = async () => {
    if (isReadOnly) return;
    if (!session?.user?.id) {
      toast.error("You must be logged in to generate content");
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 1000);
    try {
      const { data, error } = await supabase.functions.invoke('generate-section-content', {
        body: { sectionTitle: title, projectId: section.project_id, userId: session.user.id },
      });
      if (error) throw error;
      if (!data?.content) throw new Error('No content generated');
      setContent(data.content);
      setProgress(100);
      toast.success('Content generated successfully!');
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
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        isSelected && "border-l-4 border-l-[hsl(var(--brand-green,142_76%_36%))] shadow-sm"
      )}>
        <CardHeader className="cursor-pointer" onClick={onSelect}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditing && !isReadOnly ? (
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleBlur}
                  onClick={(e) => e.stopPropagation()}
                  className="text-lg font-semibold"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle
                    className={cn(
                      "text-lg p-2 rounded-md truncate",
                      !isReadOnly && "hover:bg-brand-green hover:text-white cursor-text"
                    )}
                    onClick={(e) => {
                      if (isReadOnly) return;
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    {title}
                  </CardTitle>
                  {isReadOnly && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <WorkflowStatusBadge status={workflowStatus} />
              {showTeamFeatures && (
                <>
                  <SectionAssignee
                    assignedTo={section.assigned_to}
                    members={members}
                    onAssign={userId => workflow.assign(section.section_id, userId)}
                    compact
                  />
                  <SectionDueDate
                    dueDate={section.due_date}
                    onSetDueDate={date => workflow.setDueDate(section.section_id, date)}
                    compact
                  />
                </>
              )}
              {showTeamFeatures && (
                <WorkflowActions
                  currentStatus={workflowStatus}
                  isAssignee={isAssignee}
                  isReviewer={isReviewer}
                  isAdmin={isAdmin}
                  onTransition={handleTransition}
                  disabled={workflow.isTransitioning}
                />
              )}
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
                {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {section.review_comment && workflowStatus === "needs_revision" && (
            <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2 text-xs text-amber-800 dark:text-amber-300">
              <strong>Revision requested:</strong> {section.review_comment}
            </div>
          )}
        </CardHeader>
        {isSelected && (
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            {isReadOnly && (
              <div className="bg-muted/50 border rounded p-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                {isLockedForAll
                  ? "This section is approved and locked. Only admins can edit."
                  : "This section is in review and read-only for the assignee."}
              </div>
            )}
            {!isReadOnly && (
              <Button
                onClick={generateContent}
                disabled={isGenerating}
                variant="outline"
                className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/50 text-white border-brand-green"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            )}
            {isGenerating && <AIProgress progress={progress} label="Generating content" />}
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              onBlur={handleBlur}
              placeholder="Start writing or use AI to generate content..."
              sectionTitle={title}
              editable={!isReadOnly}
              onComment={onComment ? (quotedText, from, to) => onComment(section.section_id, quotedText, from, to) : undefined}
            />
            {!isReadOnly && (
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleManualSave}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/50 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this section and its content.
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
