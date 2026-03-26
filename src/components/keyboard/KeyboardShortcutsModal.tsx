import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";
import { modKey } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcutGroups = [
  {
    title: "General",
    shortcuts: [
      { keys: [modKey, "K"], description: "Open command palette" },
      { keys: [modKey, "?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modals / cancel" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: [modKey, "D"], description: "Go to Dashboard" },
      { keys: [modKey, "B"], description: "Go to Knowledge Base" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: [modKey, "N"], description: "Create new project" },
      { keys: [modKey, "U"], description: "Upload RFP" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate OptiRFP faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border bg-muted text-xs font-mono font-medium text-muted-foreground">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
