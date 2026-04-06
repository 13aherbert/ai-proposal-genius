import { PresenceUser } from "@/hooks/useProjectPresence";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectionPresenceBadgeProps {
  sectionId: string;
  presenceUsers: PresenceUser[];
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string }>;
}

export function SectionPresenceBadge({ sectionId, presenceUsers, members }: SectionPresenceBadgeProps) {
  const editors = presenceUsers.filter(
    (u) => u.section_id === sectionId && u.action === "editing"
  );

  if (editors.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex -space-x-1">
        {editors.map((editor) => {
          const m = members.find((m) => m.user_id === editor.user_id);
          const name = m
            ? [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "User"
            : "User";
          const initials = m
            ? [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"
            : "?";

          return (
            <Tooltip key={editor.user_id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-5 w-5 border border-background">
                    <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-px -right-px w-1.5 h-1.5 bg-green-500 border border-background rounded-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Being edited by {name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
