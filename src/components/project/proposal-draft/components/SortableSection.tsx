import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProposalSection } from "../useProposalSections";
import { SectionEditor } from "../SectionEditor";
import { GripVertical } from "lucide-react";

interface SortableSectionProps {
  section: ProposalSection;
  isSelected: boolean;
  onSelect: () => void;
}

export function SortableSection({ section, isSelected, onSelect }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
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
        className="absolute left-0 top-0 bottom-0 flex items-center px-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="pl-8">
        <SectionEditor
          section={section}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}