import { useEffect, useCallback } from "react";
import { type Editor, EditorContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { AIBubbleMenu } from "./AIBubbleMenu";
import { SectionStats } from "./SectionStats";
import { X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tone } from "./aiTransform";

interface FullScreenEditorProps {
  editor: Editor;
  sectionTitle?: string;
  tone?: Tone;
  onExit: () => void;
}

export function FullScreenEditor({ editor, sectionTitle, tone, onExit }: FullScreenEditorProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const content = editor.getHTML();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <h2 className="text-lg font-semibold truncate">{sectionTitle || "Editing Section"}</h2>
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1.5">
          <Minimize2 className="h-4 w-4" />
          Exit Full Screen
        </Button>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-background">
        <EditorToolbar editor={editor} />
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <EditorContent editor={editor} />
          <AIBubbleMenu editor={editor} sectionTitle={sectionTitle} tone={tone} />
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="border-t bg-muted/30 px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <SectionStats content={content} />
        <span className="text-muted-foreground/60">Press Esc to exit · Auto-save active</span>
      </div>
    </div>
  );
}
