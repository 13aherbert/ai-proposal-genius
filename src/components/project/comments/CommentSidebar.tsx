import { useState, useMemo } from "react";
import { MessageSquare, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useProposalComments, ProposalComment } from "@/hooks/useProposalComments";
import { CommentThread } from "./CommentThread";
import { CommentInput } from "./CommentInput";

interface CommentSidebarProps {
  projectId: string;
  sectionId?: string;
  open: boolean;
  onClose: () => void;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; avatar_url?: string }>;
  onScrollToHighlight?: (from: number, to: number, sectionId: string) => void;
}

type FilterType = "all" | "open" | "resolved";

export function CommentSidebar({ projectId, sectionId, open, onClose, members, onScrollToHighlight }: CommentSidebarProps) {
  const { comments, isLoading, addComment, resolveComment, deleteComment, editComment, isAdding } = useProposalComments(projectId);
  const [filter, setFilter] = useState<FilterType>("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = comments;
    if (sectionId) {
      result = result.filter((c) => c.section_id === sectionId);
    }
    if (filter === "open") return result.filter((c) => !c.is_resolved);
    if (filter === "resolved") return result.filter((c) => c.is_resolved);
    return result;
  }, [comments, filter, sectionId]);

  const openCount = comments.filter((c) => !c.is_resolved && (!sectionId || c.section_id === sectionId)).length;
  const resolvedCount = comments.filter((c) => c.is_resolved && (!sectionId || c.section_id === sectionId)).length;

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right-full duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Comments</span>
          {openCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {openCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-4 py-2 border-b">
        {(["all", "open", "resolved"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "open" && openCount > 0 && ` (${openCount})`}
            {f === "resolved" && resolvedCount > 0 && ` (${resolvedCount})`}
          </Button>
        ))}
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading comments...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">
                {filter === "all" ? "No comments yet" : `No ${filter} comments`}
              </p>
              <p className="text-xs text-muted-foreground/70">
                Select text in the editor to add a comment
              </p>
            </div>
          ) : (
            filtered.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                members={members}
                currentUserId={undefined}
                onResolve={(id, resolve) => resolveComment({ commentId: id, resolve })}
                onDelete={deleteComment}
                onEdit={(id, content) => editComment({ commentId: id, content })}
                onReply={(content, mentions) =>
                  addComment({
                    sectionId: comment.section_id,
                    content,
                    parentId: comment.id,
                    mentions,
                  })
                }
                onScrollToHighlight={onScrollToHighlight}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
