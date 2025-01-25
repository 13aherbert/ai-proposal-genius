import { ProposalSection } from "../useProposalSections";
import { SectionEditor } from "../SectionEditor";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";

interface SectionsListProps {
  sections: ProposalSection[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string) => void;
  onReorderSections: (sections: ProposalSection[]) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function SectionsList({ 
  sections, 
  selectedSection, 
  onSelectSection,
  onReorderSections,
  isLoading,
  error 
}: SectionsListProps) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((section) => section.id === active.id);
      const newIndex = sections.findIndex((section) => section.id === over.id);
      
      const newSections = [...sections];
      const [movedSection] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, movedSection);
      
      onReorderSections(newSections);
    }
  };

  if (isLoading) {
    return <div>Loading sections...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading sections: {error.message}</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="text-muted-foreground">
        No sections yet. Click "Add Section" to start drafting your proposal.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={sections} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isSelected={selectedSection === section.id}
              onSelect={() => onSelectSection(section.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}