
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProposalSection } from "../useProposalSections";
import { SectionEditor } from "../SectionEditor";
import { GripVertical } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";
import { KeyboardReorderButtons } from "@/components/accessibility/KeyboardReorderButtons";

interface SortableSectionProps {
  section: ProposalSection;
  index: number;
  totalSections: number;
  isSelected: boolean;
  onSelect: () => void;
  onSaveStatusChange?: (sectionId: string, status: SaveStatus) => void;
  members?: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string }>;
  showTeamFeatures?: boolean;
  onComment?: (sectionId: string, quotedText: string, from: number, to: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SortableSection({ section, index, totalSections, isSelected, onSelect, onSaveStatusChange, members, showTeamFeatures, onComment, onMoveUp, onMoveDown }: SortableSectionProps) {
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
        aria-label={`Drag to reorder ${section.title}`}
      >
        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="absolute left-6 sm:left-8 top-0 flex items-center h-full opacity-0 focus-within:opacity-100 sm:group-hover:opacity-100 transition-opacity">
        <KeyboardReorderButtons
          index={index}
          total={totalSections}
          label={section.title || "section"}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
      <div className="pl-10 sm:pl-16">
        <SectionEditor
          section={section}
          isSelected={isSelected}
          onSelect={onSelect}
          onSaveStatusChange={onSaveStatusChange}
          members={members}
          showTeamFeatures={showTeamFeatures}
          onComment={onComment}
        />
      </div>
    </div>
  );
}
