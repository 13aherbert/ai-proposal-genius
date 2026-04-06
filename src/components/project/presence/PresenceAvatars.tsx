import { PresenceUser } from "@/hooks/useProjectPresence";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProposalSection } from "@/components/project/proposal-draft/useProposalSections";

interface PresenceAvatarsProps {
  presenceUsers: PresenceUser[];
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; avatar_url?: string }>;
  sections?: ProposalSection[];
  maxVisible?: number;
}

export function PresenceAvatars({ presenceUsers, members, sections = [], maxVisible = 5 }: PresenceAvatarsProps) {
  if (presenceUsers.length === 0) return null;

  const visible = presenceUsers.slice(0, maxVisible);
  const overflow = presenceUsers.length - maxVisible;

  const getMemberInfo = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    const name = m ? [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "User" : "User";
    const initials = m
      ? [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"
      : "?";
    return { name, initials, avatar_url: m?.avatar_url };
  };

  const getSectionTitle = (sectionId: string | null) => {
    if (!sectionId) return null;
    return sections.find((s) => s.section_id === sectionId)?.section_title || null;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center -space-x-2">
        {visible.map((user) => {
          const info = getMemberInfo(user.user_id);
          const sectionTitle = getSectionTitle(user.section_id);
          const statusText =
            user.action === "editing" && sectionTitle
              ? `editing ${sectionTitle}`
              : "viewing project";

          return (
            <Tooltip key={user.user_id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {info.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <span className="font-medium">{info.name}</span> — {statusText}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground font-medium">
            +{overflow}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
