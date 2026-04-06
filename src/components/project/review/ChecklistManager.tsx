import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReviewChecklist } from "@/hooks/useReviewPipeline";
import { Plus, Trash2, Settings } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChecklistManagerProps {
  projectId: string;
}

export function ChecklistManager({ projectId }: ChecklistManagerProps) {
  const { items, addItem, removeItem } = useReviewChecklist(projectId);
  const [newLabel, setNewLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addItem(newLabel.trim());
    setNewLabel("");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Settings className="h-3.5 w-3.5" />
          Manage Checklist
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 border rounded-md p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Customize checklist items that reviewers must complete before approving sections.
        </p>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{item.label}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="New checklist item..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="text-sm h-8"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()} className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
