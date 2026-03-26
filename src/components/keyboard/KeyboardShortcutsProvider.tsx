import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useKeyboardShortcuts, modKey } from "@/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

const SHORTCUT_TOAST_KEY = "optirfp_shortcuts_toast_shown";

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();

  useKeyboardShortcuts({
    onCommandPalette: useCallback(() => setCommandOpen(true), []),
    onNewProject: useCallback(() => navigate("/upload-rfp"), [navigate]),
    onShortcutsHelp: useCallback(() => setShortcutsOpen(true), []),
  });

  // One-time toast for new shortcut feature
  useEffect(() => {
    if (localStorage.getItem(SHORTCUT_TOAST_KEY)) return;
    const timer = setTimeout(() => {
      toast(`Press ${modKey}K for quick actions`, {
        description: "Use keyboard shortcuts to navigate faster.",
        duration: 6000,
      });
      localStorage.setItem(SHORTCUT_TOAST_KEY, "true");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for global open-shortcuts event (from footer link, settings, etc.)
  useEffect(() => {
    const handler = () => setShortcutsOpen(true);
    window.addEventListener("open-keyboard-shortcuts", handler);
    return () => window.removeEventListener("open-keyboard-shortcuts", handler);
  }, []);

  return (
    <>
      {children}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onShowShortcuts={() => {
          setCommandOpen(false);
          setTimeout(() => setShortcutsOpen(true), 150);
        }}
      />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
