import { useMemo } from "react";
import { format, differenceInDays, isToday, isPast, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SectionDueDateProps {
  dueDate: string | null;
  onSetDueDate: (date: string | null) => void;
  compact?: boolean;
}

export function SectionDueDate({ dueDate, onSetDueDate, compact }: SectionDueDateProps) {
  const dateObj = useMemo(() => (dueDate ? parseISO(dueDate) : undefined), [dueDate]);

  const dueDateStatus = useMemo(() => {
    if (!dateObj) return null;
    if (isToday(dateObj)) return "today" as const;
    if (isPast(dateObj)) return "overdue" as const;
    return "normal" as const;
  }, [dateObj]);

  const overdueDays = useMemo(() => {
    if (!dateObj || dueDateStatus !== "overdue") return 0;
    return differenceInDays(new Date(), dateObj);
  }, [dateObj, dueDateStatus]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 px-1.5"
          onClick={e => e.stopPropagation()}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {dateObj ? (
            dueDateStatus === "overdue" ? (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Overdue {overdueDays}d
              </Badge>
            ) : dueDateStatus === "today" ? (
              <Badge className="text-[10px] px-1 py-0 bg-amber-500 hover:bg-amber-600 text-white">
                Due Today
              </Badge>
            ) : (
              <span className="text-muted-foreground">{format(dateObj, "MMM d")}</span>
            )
          ) : (
            !compact && <span className="text-muted-foreground">Due date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={e => e.stopPropagation()}>
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={d => onSetDueDate(d ? format(d, "yyyy-MM-dd") : null)}
          className={cn("p-3 pointer-events-auto")}
        />
        {dueDate && (
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => onSetDueDate(null)}
            >
              Clear due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
