import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bug, Lightbulb, LifeBuoy, BookOpen, MessageSquarePlus, X } from "lucide-react";
import { UserFeedbackDialog } from "./UserFeedbackDialog";
import type { FeedbackType } from "./types";
import { cn } from "@/lib/utils";

interface HelpFeedbackLauncherProps {
  /** When true, only show "Contact support" action (used on public pages). */
  publicMode?: boolean;
}

/**
 * Floating Help & Feedback launcher.
 * Opens a popover with quick actions: send feedback, report a bug,
 * contact support, browse help. Each action opens UserFeedbackDialog
 * preconfigured with the matching feedback type.
 */
export function HelpFeedbackLauncher({ publicMode = false }: HelpFeedbackLauncherProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<FeedbackType>("general");

  const open = (type: FeedbackType) => {
    setDialogType(type);
    setPopoverOpen(false);
    setDialogOpen(true);
  };

  // Keyboard shortcut: Shift + ?  opens the popover
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (dialogOpen) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setPopoverOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogOpen]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Help and feedback"
            className={cn(
              "fixed z-40 bottom-5 right-5 h-12 w-12 rounded-full shadow-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "flex items-center justify-center transition-transform duration-150 hover:scale-105",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            {popoverOpen ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-72 p-2">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold">How can we help?</p>
            <p className="text-xs text-muted-foreground">We read every message.</p>
          </div>
          <div className="space-y-1">
            {!publicMode && (
              <>
                <ActionRow icon={<MessageSquarePlus className="h-4 w-4" />} label="Send feedback or idea" onClick={() => open("general")} />
                <ActionRow icon={<Bug className="h-4 w-4 text-destructive" />} label="Report a bug" onClick={() => open("bug")} />
                <ActionRow icon={<Lightbulb className="h-4 w-4 text-amber-500" />} label="Suggest an improvement" onClick={() => open("improvement")} />
              </>
            )}
            <ActionRow icon={<LifeBuoy className="h-4 w-4 text-blue-500" />} label="Contact support" onClick={() => open("support")} />
            <Link
              to="/help"
              onClick={() => setPopoverOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Browse help articles
            </Link>
          </div>
          {!publicMode && (
            <p className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground">
              Tip: press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Shift</kbd>+<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">?</kbd> to open this menu.
            </p>
          )}
        </PopoverContent>
      </Popover>

      <UserFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feedbackType={dialogType}
      />
    </>
  );
}

function ActionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
    >
      {icon}
      {label}
    </button>
  );
}
