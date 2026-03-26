import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Database,
  Search,
  Settings,
  CreditCard,
  Keyboard,
  FilePlus,
  HelpCircle,
  BookOpen,
  Users,
} from "lucide-react";
import { modKey } from "@/hooks/use-keyboard-shortcuts";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
}

export function CommandPalette({ open, onOpenChange, onShowShortcuts }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      // Small delay so dialog closes first
      setTimeout(fn, 100);
    },
    [onOpenChange]
  );

  const navItems = session
    ? [
        { label: "Dashboard", icon: LayoutDashboard, shortcut: `${modKey}D`, action: () => navigate("/dashboard") },
        { label: "Upload RFP", icon: Upload, shortcut: `${modKey}U`, action: () => navigate("/upload-rfp") },
        { label: "Projects", icon: FolderOpen, action: () => navigate("/projects") },
        { label: "Knowledge Base", icon: Database, shortcut: `${modKey}B`, action: () => navigate("/knowledge-base") },
        { label: "Opportunities", icon: Search, action: () => navigate("/opportunities") },
        { label: "Team", icon: Users, action: () => navigate("/team") },
        { label: "Account Settings", icon: Settings, action: () => navigate("/account") },
        { label: "Billing", icon: CreditCard, action: () => navigate("/billing") },
      ]
    : [
        { label: "Home", icon: LayoutDashboard, action: () => navigate("/") },
        { label: "Pricing", icon: CreditCard, action: () => navigate("/pricing") },
        { label: "Documentation", icon: BookOpen, action: () => navigate("/docs") },
        { label: "FAQ", icon: HelpCircle, action: () => navigate("/faq") },
      ];

  const actionItems = session
    ? [
        { label: "New Project", icon: FilePlus, shortcut: `${modKey}N`, action: () => navigate("/upload-rfp") },
      ]
    : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {actionItems.length > 0 && (
          <CommandGroup heading="Actions">
            {actionItems.map((item) => (
              <CommandItem key={item.label} onSelect={() => run(item.action)}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.label} onSelect={() => run(item.action)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem onSelect={() => run(onShowShortcuts)}>
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard Shortcuts
            <CommandShortcut>{modKey}?</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/help"))}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help Center
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
