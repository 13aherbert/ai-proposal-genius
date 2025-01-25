import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddSectionButtonProps {
  onAdd: () => void;
}

/**
 * Button component for adding new sections to the proposal draft
 * Displays a "+" icon and triggers the add section dialog when clicked
 */
export function AddSectionButton({ onAdd }: AddSectionButtonProps) {
  return (
    <Button onClick={onAdd} variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Section
    </Button>
  );
}