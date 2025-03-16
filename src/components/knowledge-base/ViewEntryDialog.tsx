
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { EntryHeader } from "./dialog/EntryHeader";
import { EntryContent } from "./dialog/EntryContent";
import { EntryCategory } from "./dialog/EntryCategory";
import { DeleteEntryAlert } from "./dialog/DeleteEntryAlert";
import { useEntryOperations } from "./hooks/useEntryOperations";
import { KnowledgeCategory } from "./types";

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
