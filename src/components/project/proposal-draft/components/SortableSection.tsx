
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProposalSection } from "../useProposalSections";
import { SectionEditor } from "../SectionEditor";
import { GripVertical } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";

interface SortableSectionProps {
  section: ProposalSection;
  isSelected: boolean;
  onSelect: () => void;
  onSaveStatusChange?: (sectionId: string, status: SaveStatus) => void;
}

export function SortableSection({ section, isSelected, onSelect, onSaveStatusChange }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.section_id,
    data: section
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 flex items-center px-1 sm:px-2 cursor-grab opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
      </div>
      <div className="pl-6 sm:pl-8">
        <SectionEditor
          section={section}
          isSelected={isSelected}
          onSelect={onSelect}
          onSaveStatusChange={onSaveStatusChange}
        />
      </div>
    </div>
  );
}
