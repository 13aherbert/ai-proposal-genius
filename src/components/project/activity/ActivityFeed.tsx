import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Edit3, UserCheck, FileOutput, GitBranch, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  projectId: string;
  orgId?: string | null;
}

interface ActivityEntry {
  id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  created_at: string;
  user_id: string;
  author_name?: string;
  author_avatar?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  comment_resolved: <MessageSquare className="h-3.5 w-3.5 text-green-500" />,
  status_change: <GitBranch className="h-3.5 w-3.5 text-purple-500" />,
  assignment: <UserCheck className="h-3.5 w-3.5 text-amber-500" />,
  edit: <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />,
  export: <FileOutput className="h-3.5 w-3.5 text-primary" />,
};

function getEventDescription(entry: ActivityEntry): string {
  const d = entry.details || {};
  switch (entry.action_type) {
    case "created": return `created ${entry.resource_type} "${d.title || ""}"`;
    case "updated": return `updated ${entry.resource_type} "${d.title || ""}"`;
    case "comment_added": return `commented on "${d.section_title || "a section"}"`;
    case "comment_resolved": return `resolved a comment on "${d.section_title || "a section"}"`;
    case "status_changed": return `changed status to ${d.new_status || "unknown"}`;
    case "assigned": return `assigned section to ${d.assignee_name || "someone"}`;
    case "exported": return `exported the proposal as ${d.format || "document"}`;
    default: return `${entry.action_type} ${entry.resource_type}`;
  }
}

export function ActivityFeed({ projectId, orgId }: ActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["activity-feed", projectId, orgId, limit],
    queryFn: async () => {
      // Use activity_feed table filtered by resource_id = projectId
      const query = supabase
        .from("activity_feed")
        .select("*")
        .or(`resource_id.eq.${projectId}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (orgId) {
        query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set((data || []).map((e: any) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("profile_id, first_name, last_name, avatar_url, username")
        .in("profile_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [
          p.profile_id,
          {
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Unknown",
            avatar: p.avatar_url,
          },
        ])
      );

      return (data || []).map((e: any) => ({
        ...e,
        author_name: profileMap.get(e.user_id)?.name || "Unknown",
        author_avatar: profileMap.get(e.user_id)?.avatar || null,
      })) as ActivityEntry[];
    },
    enabled: !!projectId,
  });

  const filtered = useMemo(() => {
    if (typeFilter === "all") return entries;
    return entries.filter((e) => e.action_type.includes(typeFilter));
  }, [entries, typeFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" /> Activity
        </h3>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="status">Status Changes</SelectItem>
            <SelectItem value="assign">Assignments</SelectItem>
            <SelectItem value="updated">Edits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading activity...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No activity yet</p>
          ) : (
            filtered.map((entry) => {
              const initials = (entry.author_name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
              const icon = EVENT_ICONS[entry.action_type] || EVENT_ICONS.edit;
              return (
                <div key={entry.id} className="flex items-start gap-2 py-1.5 px-1 rounded hover:bg-muted/50">
                  <div className="mt-0.5 flex-shrink-0">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{entry.author_name}</span>{" "}
                      <span className="text-muted-foreground">{getEventDescription(entry)}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {entries.length >= limit && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setLimit((l) => l + 50)}>
              Load more
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
