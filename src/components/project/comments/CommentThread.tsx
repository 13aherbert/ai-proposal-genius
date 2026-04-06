import { useState } from "react";
import { Check, ChevronDown, ChevronUp, CornerDownRight, MessageSquare, MoreHorizontal, Pencil, RotateCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProposalComment } from "@/hooks/useProposalComments";
import { CommentInput } from "./CommentInput";
import { formatDistanceToNow } from "date-fns";

interface CommentThreadProps {
  comment: ProposalComment;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; avatar_url?: string }>;
  currentUserId?: string;
  onResolve: (id: string, resolve: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onReply: (content: string, mentions: string[]) => void;
  onScrollToHighlight?: (from: number, to: number, sectionId: string) => void;
}

export function CommentThread({
  comment,
  members,
  currentUserId,
  onResolve,
  onDelete,
  onEdit,
  onReply,
  onScrollToHighlight,
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const initials = (comment.author_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const replies = comment.replies || [];

  const handleClickQuote = () => {
    if (comment.highlight_from != null && comment.highlight_to != null && onScrollToHighlight) {
      onScrollToHighlight(comment.highlight_from, comment.highlight_to, comment.section_id);
    }
  };

  return (
    <div className={cn("rounded-lg border p-3 space-y-2 text-sm transition-opacity", comment.is_resolved && "opacity-60")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={comment.author_avatar || undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="font-medium text-xs truncate block">{comment.author_name}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {comment.is_resolved ? (
              <DropdownMenuItem onClick={() => onResolve(comment.id, false)}>
                <RotateCw className="mr-2 h-3.5 w-3.5" /> Reopen
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onResolve(comment.id, true)}>
                <Check className="mr-2 h-3.5 w-3.5" /> Resolve
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quoted text */}
      {comment.quoted_text && (
        <button
          onClick={handleClickQuote}
          className="w-full text-left bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 px-2 py-1 rounded text-xs text-muted-foreground italic truncate hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          "{comment.quoted_text.length > 50 ? comment.quoted_text.slice(0, 50) + "..." : comment.quoted_text}"
        </button>
      )}

      {/* Content */}
      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-xs border rounded p-2 bg-background resize-none min-h-[60px]"
            autoFocus
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => {
                onEdit(comment.id, editContent);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* Resolved badge */}
      {comment.is_resolved && (
        <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
          <Check className="h-3 w-3" /> Resolved
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {!comment.is_resolved && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] gap-1 px-1.5"
            onClick={() => setReplying(!replying)}
          >
            <CornerDownRight className="h-3 w-3" /> Reply
          </Button>
        )}
        {replies.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] gap-1 px-1.5"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </Button>
        )}
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-4 border-l-2 border-muted pl-3 space-y-2">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}

      {/* Reply input */}
      {replying && (
        <div className="ml-4">
          <CommentInput
            members={members}
            onSubmit={(content, mentions) => {
              onReply(content, mentions);
              setReplying(false);
            }}
            onCancel={() => setReplying(false)}
            placeholder="Write a reply..."
            compact
          />
        </div>
      )}
    </div>
  );
}

function ReplyCard({
  reply,
  onDelete,
  onEdit,
}: {
  reply: ProposalComment;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}) {
  const initials = (reply.author_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const timeAgo = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Avatar className="h-5 w-5">
          <AvatarImage src={reply.author_avatar || undefined} />
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-[10px]">{reply.author_name}</span>
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
      </div>
      <p className="text-xs leading-relaxed whitespace-pre-wrap">{reply.content}</p>
    </div>
  );
}
