import { DndContext, DragEndEvent, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOutlineSections } from "./useOutlineSections";
import { SortableOutlineCard } from "./SortableOutlineCard";
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

interface EditableOutlineProps {
  outlineMarkdown: string;
  onOutlineChange: (markdown: string) => void;
}

export function EditableOutline({ outlineMarkdown, onOutlineChange }: EditableOutlineProps) {
  const {
    sections,
    isModified,
    reorder,
    updateTitle,
    updateDescription,
    deleteSection,
    addSection,
    resetToOriginal,
    getMarkdown,
  } = useOutlineSections(outlineMarkdown);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      reorder(oldIndex, newIndex);
    }
  };

  // Sync changes up whenever sections change
  const currentMarkdown = getMarkdown();
  if (currentMarkdown !== outlineMarkdown && isModified) {
    // Use a microtask to avoid setState during render
    queueMicrotask(() => onOutlineChange(currentMarkdown));
  }

  const showWarning = sections.length > 20;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        {isModified && (
          <Badge variant="outline" className="text-accent-foreground border-accent text-xs">
            Modified
          </Badge>
        )}
        {showWarning && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Many sections may increase generation time</span>
          </div>
        )}
        <div className="flex-1" />
        {isModified && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to AI Outline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset outline?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will revert all changes and restore the original AI-generated outline.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToOriginal}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No sections. Add at least one section to continue.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableOutlineCard
                  key={section.id}
                  section={section}
                  onUpdateTitle={updateTitle}
                  onUpdateDescription={updateDescription}
                  onDelete={deleteSection}
                  totalSections={sections.length}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add section */}
      <Button
        variant="outline"
        size="sm"
        onClick={addSection}
        className="w-full border-dashed gap-1"
      >
        <Plus className="h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
