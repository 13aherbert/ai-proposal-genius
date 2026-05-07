import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { ReactNode } from "react";

interface ProjectHeaderProps {
  title: string;
  status?: string;
  clientName?: string | null;
  deadline?: string | null;
  rightSlot?: ReactNode;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  in_progress: "default",
  submitted: "default",
  won: "default",
  lost: "destructive",
};

export function ProjectHeader({ title, status, clientName, deadline, rightSlot }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col gap-2 px-2 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
          aria-label="Back to projects"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold truncate flex-1">{title}</h1>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      {(status || clientName || deadline) && (
        <div className="flex flex-wrap items-center gap-2 pl-10 sm:pl-12 text-xs text-muted-foreground">
          {status && (
            <Badge variant={STATUS_VARIANT[status] ?? "outline"} className="capitalize">
              {status.replace(/_/g, " ")}
            </Badge>
          )}
          {clientName && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {clientName}
            </span>
          )}
          {deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due {format(new Date(deadline), "MMM d, yyyy")}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
