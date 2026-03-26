import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export interface ShortcutDefinition {
  key: string;
  label: string;
  description: string;
  category: "navigation" | "actions" | "general";
  action?: () => void;
  requiresAuth?: boolean;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export const modKey = isMac ? "⌘" : "Ctrl";

export function useKeyboardShortcuts({
  onCommandPalette,
  onNewProject,
  onShortcutsHelp,
}: {
  onCommandPalette: () => void;
  onNewProject: () => void;
  onShortcutsHelp: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const shortcuts: ShortcutDefinition[] = [
    { key: "k", label: `${modKey}K`, description: "Open command palette", category: "general", action: onCommandPalette },
    { key: "n", label: `${modKey}N`, description: "Create new project", category: "actions", action: onNewProject, requiresAuth: true },
    { key: "u", label: `${modKey}U`, description: "Upload RFP", category: "actions", action: () => navigate("/upload-rfp"), requiresAuth: true },
    { key: "b", label: `${modKey}B`, description: "Go to Knowledge Base", category: "navigation", action: () => navigate("/knowledge-base"), requiresAuth: true },
    { key: "d", label: `${modKey}D`, description: "Go to Dashboard", category: "navigation", action: () => navigate("/dashboard"), requiresAuth: true },
    { key: "?", label: `${modKey}?`, description: "Show keyboard shortcuts", category: "general", action: onShortcutsHelp },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        // Allow Cmd+K even in inputs
        if (e.key !== "k") return;
      }

      const key = e.key.toLowerCase();

      // Handle ? (shift+/ on most keyboards)
      const isQuestion = e.shiftKey && e.key === "?";

      for (const shortcut of shortcuts) {
        const match = shortcut.key === "?" ? isQuestion : key === shortcut.key;
        if (!match) continue;
        if (shortcut.requiresAuth && !session) continue;

        e.preventDefault();
        e.stopPropagation();
        shortcut.action?.();
        return;
      }
    },
    [session, location.pathname, onCommandPalette, onNewProject, onShortcutsHelp, navigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  return { shortcuts };
}
