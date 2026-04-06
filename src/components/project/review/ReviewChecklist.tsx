import { Checkbox } from "@/components/ui/checkbox";
import { ReviewChecklistItem, ChecklistStatus } from "@/hooks/useReviewPipeline";
import { ClipboardList } from "lucide-react";

interface ReviewChecklistProps {
  items: ReviewChecklistItem[];
  statuses: ChecklistStatus[];
  onToggle: (checklistItemId: string, checked: boolean) => void;
}

export function ReviewChecklist({ items, statuses, onToggle }: ReviewChecklistProps) {
  const checkedCount = items.filter((item) => {
    const s = statuses.find((st) => st.checklist_item_id === item.id);
    return s?.checked;
  }).length;

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Review Checklist
        </h4>
        <span className="text-xs text-muted-foreground">
          {checkedCount}/{items.length} complete
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const status = statuses.find((s) => s.checklist_item_id === item.id);
          const isChecked = status?.checked ?? false;
          return (
            <label
              key={item.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => onToggle(item.id, !!checked)}
              />
              <span className={isChecked ? "line-through text-muted-foreground" : ""}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
