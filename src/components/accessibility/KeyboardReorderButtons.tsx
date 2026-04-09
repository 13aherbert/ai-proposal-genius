import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "./AriaLiveAnnouncer";

interface KeyboardReorderButtonsProps {
  index: number;
  total: number;
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function KeyboardReorderButtons({
  index,
  total,
  label,
  onMoveUp,
  onMoveDown,
}: KeyboardReorderButtonsProps) {
  const { announce } = useAnnounce();

  return (
    <div className="flex flex-col gap-0.5" role="group" aria-label={`Reorder ${label}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 p-0"
        disabled={index === 0}
        onClick={() => {
          onMoveUp();
          announce(`${label} moved up to position ${index}`);
        }}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 p-0"
        disabled={index === total - 1}
        onClick={() => {
          onMoveDown();
          announce(`${label} moved down to position ${index + 2}`);
        }}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
