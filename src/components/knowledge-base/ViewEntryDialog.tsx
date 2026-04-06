
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { EntryHeader } from "./dialog/EntryHeader";
import { EntryContent } from "./dialog/EntryContent";
import { EntryCategory } from "./dialog/EntryCategory";
import { DeleteEntryAlert } from "./dialog/DeleteEntryAlert";
import { ParsingStatusIndicator } from "./ParsingStatusIndicator";
import { useEntryOperations } from "./hooks/useEntryOperations";
import { KnowledgeCategory } from "./types";
import { Clock, CalendarPlus } from "lucide-react";
import { format } from "date-fns";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  category: string;
  categories: KnowledgeCategory[];
  onEntryUpdated: () => void;
}

export const ViewEntryDialog = ({
  open,
  onOpenChange,
  title,
  category,
  categories,
  onEntryUpdated,
}: ViewEntryDialogProps) => {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedCategory, setEditedCategory] = useState(category);
  const [editedContent, setEditedContent] = useState("");

  const {
    content,
    filePath,
    isLoading,
    entryId,
    parsingStatus,
    parsingProgress,
    parsingError,
    createdAt,
    updatedAt,
    fetchEntryContent,
    handleSave,
    handleDelete,
    handleDownload,
  } = useEntryOperations(title, onEntryUpdated, () => {
    setShowDeleteAlert(false);
    onOpenChange(false);
    setEditMode(false);
    setEditedTitle("");
    setEditedCategory("");
    setEditedContent("");
  });

  useEffect(() => {
    if (open) {
      fetchEntryContent();
    }
  }, [open, fetchEntryContent]);

  useEffect(() => {
    if (content) {
      setEditedContent(content);
    }
  }, [content]);

  const handleDeleteConfirm = async () => {
    await handleDelete();
  };

  const formatFullDate = (iso?: string | null) => {
    if (!iso) return null;
    return format(new Date(iso), "MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setEditMode(false);
          setEditedTitle("");
          setEditedCategory("");
          setEditedContent("");
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <EntryHeader
            isEditing={editMode}
            initialTitle={title}
            editedTitle={editedTitle}
            onEditedTitleChange={setEditedTitle}
            onStartEditing={() => setEditMode(true)}
            onCancelEditing={() => {
              setEditMode(false);
              setEditedTitle(title);
              setEditedCategory(category);
            }}
            onSave={() => handleSave(editedTitle, editedCategory, editedContent)}
            onDelete={() => setShowDeleteAlert(true)}
          />
          
          <EntryCategory
            isEditing={editMode}
            initialCategory={category}
            editedCategory={editedCategory}
            categories={categories}
            onEditedCategoryChange={setEditedCategory}
          />

          {/* Timestamps */}
          {(createdAt || updatedAt) && (
            <div className="px-6 py-2 border-b flex flex-wrap gap-4 text-xs text-muted-foreground">
              {updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last updated: {formatFullDate(updatedAt)}
                </span>
              )}
              {createdAt && (
                <span className="flex items-center gap-1">
                  <CalendarPlus className="h-3 w-3" />
                  Created: {formatFullDate(createdAt)}
                </span>
              )}
            </div>
          )}

          {filePath && entryId && (
            <div className="px-6 py-3 border-b">
              <ParsingStatusIndicator
                status={parsingStatus as 'pending' | 'processing' | 'completed' | 'failed' || 'completed'}
                progress={parsingProgress}
                error={parsingError || undefined}
                entryId={entryId}
                filePath={filePath}
                onStatusUpdate={fetchEntryContent}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[55vh]">
            <EntryContent
              isLoading={isLoading}
              filePath={filePath || ""}
              content={content || ""}
              isEditing={editMode}
              editedContent={editedContent}
              onEditedContentChange={setEditedContent}
              onSave={() => handleSave(editedTitle, editedCategory, editedContent)}
              onDownload={handleDownload}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteEntryAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirmDelete={handleDeleteConfirm}
        hasFile={!!filePath}
      />
    </>
  );
};
