import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; avatar_url?: string }>;
  onSubmit: (content: string, mentions: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function CommentInput({ members, onSubmit, onCancel, placeholder = "Add a comment...", compact }: CommentInputProps) {
  const [value, setValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = members.filter((m) => {
    const name = [m.first_name, m.last_name].filter(Boolean).join(" ").toLowerCase();
    return name.includes(mentionFilter.toLowerCase()) || (m.username || "").toLowerCase().includes(mentionFilter.toLowerCase());
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    // Check for @ trigger
    const cursorPos = e.target.selectionStart;
    const textBefore = text.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionFilter(atMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: typeof members[0]) => {
    const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.username || "User";
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const beforeAt = textBefore.replace(/@\w*$/, "");
    setValue(`${beforeAt}@${name} ${textAfter}`);
    setMentionedIds((prev) => [...new Set([...prev, member.user_id])]);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim(), mentionedIds);
    setValue("");
    setMentionedIds([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel?.();
    }
  };

  return (
    <div className="relative">
      <div className={cn("border rounded-md bg-background", compact ? "p-1.5" : "p-2")}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full resize-none bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground",
            compact ? "min-h-[40px]" : "min-h-[60px]"
          )}
          autoFocus
        />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            @ to mention · Enter to send
          </span>
          <div className="flex gap-1">
            {onCancel && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleSubmit}
              disabled={!value.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mention dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full max-h-32 overflow-y-auto border rounded-md bg-popover shadow-lg z-50">
          {filteredMembers.map((m) => (
            <button
              key={m.user_id}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
              onClick={() => insertMention(m)}
            >
              <AtSign className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.username}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
