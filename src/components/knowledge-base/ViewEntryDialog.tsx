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
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <EntryHeader
            title={editedTitle}
            originalTitle={title}
            editMode={editMode}
            setEditMode={setEditMode}
            onTitleChange={setEditedTitle}
            onDelete={() => setShowDeleteAlert(true)}
          />
          
          <EntryCategory
            category={editedCategory}
            originalCategory={category}
            categories={categories}
            editMode={editMode}
            onCategoryChange={setEditedCategory}
          />

          <EntryContent
            content={editedContent}
            originalContent={content}
            filePath={filePath}
            editMode={editMode}
            isLoading={isLoading}
            onContentChange={setEditedContent}
            onSave={() => handleSave(editedTitle, editedCategory, editedContent)}
            onDownload={handleDownload}
          />
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