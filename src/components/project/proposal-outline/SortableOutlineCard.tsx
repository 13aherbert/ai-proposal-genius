import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { KeyboardReorderButtons } from "@/components/accessibility/KeyboardReorderButtons";
import { OutlineSection } from "./useOutlineSections";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SortableOutlineCardProps {
  section: OutlineSection;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDescription: (id: string, desc: string) => void;
  onDelete: (id: string) => void;
  totalSections: number;
}

export function SortableOutlineCard({
  section,
  onUpdateTitle,
  onUpdateDescription,
  onDelete,
  totalSections,
}: SortableOutlineCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const commitTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      onUpdateTitle(section.id, trimmed);
    } else {
      setEditTitle(section.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group border rounded-lg bg-card p-3 flex items-start gap-2 hover:shadow-sm transition-shadow"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Section number */}
          <span className="text-xs font-bold text-muted-foreground shrink-0 w-5 text-right">
            {section.number}.
          </span>

          {/* Title */}
          {isEditingTitle ? (
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setEditTitle(section.title);
                  setIsEditingTitle(false);
                }
              }}
              className="h-7 text-sm font-medium"
            />
          ) : (
            <button
              onClick={() => {
                setEditTitle(section.title);
                setIsEditingTitle(true);
              }}
              className="text-sm font-medium text-left truncate hover:text-primary transition-colors"
              title={section.title}
            >
              {section.title}
            </button>
          )}
        </div>

        {/* Description toggle & content */}
        {section.description && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {expanded ? "Hide details" : "Show details"}
            </button>
            {expanded && (
              <Textarea
                value={section.description}
                onChange={(e) => onUpdateDescription(section.id, e.target.value)}
                className="mt-2 text-xs min-h-[60px] resize-y"
                rows={3}
              />
            )}
          </>
        )}

        {!section.description && (
          <button
            onClick={() => {
              onUpdateDescription(section.id, "");
              setExpanded(true);
            }}
            className="text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors"
          >
            + Add description
          </button>
        )}
      </div>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            disabled={totalSections <= 1}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{section.title}" from the outline. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(section.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
