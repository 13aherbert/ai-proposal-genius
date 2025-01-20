import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, Trash2, X } from "lucide-react";

interface EntryHeaderProps {
  isEditing: boolean;
  initialTitle: string;
  editedTitle: string;
  onEditedTitleChange: (title: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export const EntryHeader = ({
  isEditing,
  initialTitle,
  editedTitle,
  onEditedTitleChange,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
}: EntryHeaderProps) => {
  return (
    <div className="flex flex-row items-center justify-between">
      {isEditing ? (
        <div className="flex-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={editedTitle}
            onChange={(e) => onEditedTitleChange(e.target.value)}
            className="mt-1"
          />
        </div>
      ) : (
        <DialogTitle>{initialTitle}</DialogTitle>
      )}
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={onCancelEditing}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={onStartEditing}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};