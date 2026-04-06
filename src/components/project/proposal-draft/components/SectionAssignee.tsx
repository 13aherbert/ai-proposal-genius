import { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  user_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface SectionAssigneeProps {
  assignedTo: string | null;
  members: Member[];
  onAssign: (userId: string | null) => void;
  compact?: boolean;
}

function getMemberName(m: Member): string {
  if (m.first_name || m.last_name) return `${m.first_name || ""} ${m.last_name || ""}`.trim();
  return m.username || "Unknown";
}

function getInitials(m: Member): string {
  const name = getMemberName(m);
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function SectionAssignee({ assignedTo, members, onAssign, compact }: SectionAssigneeProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const assignee = useMemo(() => members.find(m => m.user_id === assignedTo), [members, assignedTo]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m => getMemberName(m).toLowerCase().includes(q));
  }, [members, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 h-7 text-xs", compact && "px-1")}
          onClick={e => e.stopPropagation()}
        >
          {assignee ? (
            <>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(assignee)}
                </AvatarFallback>
              </Avatar>
              {!compact && <span className="max-w-[80px] truncate">{getMemberName(assignee)}</span>}
            </>
          ) : (
            <>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              {!compact && <span className="text-muted-foreground">Assign</span>}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" onClick={e => e.stopPropagation()}>
        {members.length > 5 && (
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-2 h-8 text-xs"
          />
        )}
        <div className="max-h-48 overflow-auto space-y-0.5">
          {assignedTo && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-muted-foreground"
              onClick={() => { onAssign(null); setOpen(false); }}
            >
              <X className="h-3.5 w-3.5" /> Unassign
            </button>
          )}
          {filtered.map(m => (
            <button
              key={m.user_id}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted",
                m.user_id === assignedTo && "bg-primary/10"
              )}
              onClick={() => { onAssign(m.user_id); setOpen(false); }}
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(m)}
                </AvatarFallback>
              </Avatar>
              {getMemberName(m)}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No members found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
