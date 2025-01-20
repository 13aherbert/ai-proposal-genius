import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { KnowledgeCategory } from "./types";
import { EntryHeader } from "./dialog/EntryHeader";
import { EntryCategory } from "./dialog/EntryCategory";
import { EntryContent } from "./dialog/EntryContent";
import { DeleteEntryAlert } from "./dialog/DeleteEntryAlert";
import { useEntryOperations } from "./hooks/useEntryOperations";

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
  title: initialTitle,
  category: initialCategory,
  categories,
  onEntryUpdated,
}: ViewEntryDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedCategory, setEditedCategory] = useState(initialCategory);
  const [editedContent, setEditedContent] = useState<string>("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const {
    content,
    filePath,
    isLoading,
    fetchEntryContent,
    handleSave,
    handleDelete,
    handleDownload,
  } = useEntryOperations(initialTitle, onEntryUpdated, () => onOpenChange(false));

  useEffect(() => {
    if (open) {
      fetchEntryContent();
      setEditedTitle(initialTitle);
      setEditedCategory(initialCategory);
      setIsEditing(false);
      setEditedContent(content || "");
    }
  }, [open, initialTitle, content]);

  const onSave = () => {
    handleSave(editedTitle, editedCategory, editedContent);
    setIsEditing(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <EntryHeader
              isEditing={isEditing}
              initialTitle={initialTitle}
              editedTitle={editedTitle}
              onEditedTitleChange={setEditedTitle}
              onStartEditing={() => setIsEditing(true)}
              onCancelEditing={() => setIsEditing(false)}
              onSave={onSave}
              onDelete={() => setShowDeleteAlert(true)}
            />
          </DialogHeader>
          <div className="space-y-4">
            <EntryCategory
              isEditing={isEditing}
              initialCategory={initialCategory}
              editedCategory={editedCategory}
              categories={categories}
              onEditedCategoryChange={setEditedCategory}
            />
            <EntryContent
              isLoading={isLoading}
              filePath={filePath}
              content={content}
              isEditing={isEditing}
              editedContent={editedContent}
              onEditedContentChange={setEditedContent}
              onDownload={handleDownload}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteEntryAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirmDelete={handleDelete}
        hasFile={!!filePath}
      />
    </>
  );
};