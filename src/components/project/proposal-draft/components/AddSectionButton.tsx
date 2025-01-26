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
    <Button 
      onClick={onAdd} 
      variant="outline" 
      size="sm"
      className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Section
    </Button>
  );
}