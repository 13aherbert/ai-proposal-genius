import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, Trash2, X } from "lucide-react";

export interface EntryHeaderProps {
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
    <div className="flex flex-col space-y-2">
      {isEditing ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedTitle}
              onChange={(e) => onEditedTitleChange(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onCancelEditing}
            className="mb-[2px]"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={onSave}
            className="mb-[2px]"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <DialogTitle>{initialTitle}</DialogTitle>
          <div className="flex gap-2">
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
          </div>
        </div>
      )}
    </div>
  );
};