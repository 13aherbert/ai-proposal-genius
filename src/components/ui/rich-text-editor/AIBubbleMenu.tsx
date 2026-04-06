import { useState, useCallback, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Sparkles, FileText, AlignLeft,
  Briefcase, Scissors, Wrench,
  MessageSquare, Check, X, RotateCw, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { aiTransform, type AIAction, type Tone } from "./aiTransform";

interface AIBubbleMenuProps {
  editor: Editor;
  sectionTitle?: string;
  tone?: Tone;
}

const ACTIONS: { action: AIAction; icon: React.ReactNode; label: string }[] = [
  { action: "rewrite", icon: <Sparkles className="h-3.5 w-3.5" />, label: "Rewrite" },
  { action: "expand", icon: <FileText className="h-3.5 w-3.5" />, label: "Expand" },
  { action: "summarize", icon: <AlignLeft className="h-3.5 w-3.5" />, label: "Summarize" },
  { action: "formal", icon: <Briefcase className="h-3.5 w-3.5" />, label: "Formal" },
  { action: "concise", icon: <Scissors className="h-3.5 w-3.5" />, label: "Concise" },
  { action: "fix_grammar", icon: <Wrench className="h-3.5 w-3.5" />, label: "Fix Grammar" },
];

type Phase = "idle" | "loading" | "review" | "custom-input";

export function AIBubbleMenu({ editor, sectionTitle, tone }: AIBubbleMenuProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [suggestion, setSuggestion] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Reset when selection changes
  useEffect(() => {
    const handleSelectionUpdate = () => {
      if (phase === "idle" || phase === "custom-input") return;
      // Don't reset during loading/review
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => { editor.off("selectionUpdate", handleSelectionUpdate); };
  }, [editor, phase]);

  // Keyboard shortcut: Ctrl+J
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, " ");
        if (text.split(/\s+/).filter(Boolean).length >= 3) {
          setPhase("custom-input");
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editor]);

  const getSelectionInfo = useCallback(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    // Get HTML of selection
    const slice = editor.state.doc.slice(from, to);
    const serializer = (editor.view as any).dom?.ownerDocument
      ? undefined
      : undefined;
    // For HTML, use the text content; formatting is preserved by replacing at position
    return { from, to, selectedText, fullContext: editor.getHTML() };
  }, [editor]);

  const runTransform = useCallback(async (action: AIAction, prompt?: string) => {
    const { from, to, selectedText, fullContext } = getSelectionInfo();
    if (!selectedText || selectedText.split(/\s+/).filter(Boolean).length < 3) {
      toast.error("Select at least 3 words to use AI transform");
      return;
    }

    savedSelectionRef.current = { from, to };
    setOriginalText(selectedText);
    setCurrentAction(action);
    setPhase("loading");

    try {
      const result = await aiTransform({
        action,
        selectedText,
        context: fullContext,
        sectionTitle,
        tone,
        customPrompt: prompt,
      });
      setSuggestion(result);
      setPhase("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI transform failed";
      toast.error(msg);
      setPhase("idle");
    }
  }, [getSelectionInfo, sectionTitle, tone]);

  const handleAccept = useCallback(() => {
    if (!savedSelectionRef.current) return;
    const { from, to } = savedSelectionRef.current;

    // Check if suggestion contains HTML
    if (/<[a-z][\s\S]*>/i.test(suggestion)) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(suggestion)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(suggestion)
        .run();
    }

    resetState();
    toast.success("AI suggestion applied");
  }, [editor, suggestion]);

  const handleReject = useCallback(() => {
    resetState();
  }, []);

  const handleRegenerate = useCallback(() => {
    if (currentAction) {
      runTransform(currentAction, currentAction === "custom" ? customPrompt : undefined);
    }
  }, [currentAction, customPrompt, runTransform]);

  const handleCustomSubmit = useCallback(() => {
    if (customPrompt.trim()) {
      runTransform("custom", customPrompt.trim());
    }
  }, [customPrompt, runTransform]);

  const resetState = () => {
    setPhase("idle");
    setSuggestion("");
    setOriginalText("");
    setCustomPrompt("");
    setCurrentAction(null);
    savedSelectionRef.current = null;
  };

  // Keyboard handlers for review phase
  useEffect(() => {
    if (phase !== "review") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAccept(); }
      if (e.key === "Escape") { e.preventDefault(); handleReject(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase, handleAccept, handleReject]);

  const shouldShow = useCallback(() => {
    if (phase === "loading" || phase === "review") return true;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    return text.split(/\s+/).filter(Boolean).length >= 3;
  }, [editor, phase]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        placement: "top",
        maxWidth: "none",
        duration: [200, 150],
        appendTo: () => document.body,
      }}
      shouldShow={({ editor: e }) => {
        if (phase === "loading" || phase === "review") return true;
        const { from, to } = e.state.selection;
        if (from === to) return false;
        const text = e.state.doc.textBetween(from, to, " ");
        return text.split(/\s+/).filter(Boolean).length >= 3;
      }}
    >
      <div className="bg-popover border rounded-lg shadow-lg p-1.5 flex flex-col gap-1.5 max-w-md z-50">
        {/* Loading */}
        {phase === "loading" && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is transforming your text...</span>
          </div>
        )}

        {/* Review phase */}
        {phase === "review" && (
          <div className="space-y-2">
            <div className="max-h-48 overflow-y-auto px-2 py-1.5 text-sm space-y-1.5 bg-muted/30 rounded">
              <div className="line-through text-destructive/70 text-xs leading-relaxed">
                {originalText.length > 200 ? originalText.substring(0, 200) + "..." : originalText}
              </div>
              <div className="border-t border-border/50 pt-1.5">
                <div
                  className="text-xs leading-relaxed text-green-700 dark:text-green-400 underline decoration-green-500/30"
                  dangerouslySetInnerHTML={{
                    __html: suggestion.length > 500 ? suggestion.substring(0, 500) + "..." : suggestion,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950" onClick={handleAccept}>
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={handleReject}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleRegenerate}>
                <RotateCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          </div>
        )}

        {/* Custom input */}
        {phase === "custom-input" && (
          <div className="flex items-center gap-1.5">
            <Input
              ref={inputRef}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Tell AI what to do with this text..."
              className="h-7 text-xs flex-1 min-w-[200px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleCustomSubmit(); }
                if (e.key === "Escape") { e.preventDefault(); setPhase("idle"); setCustomPrompt(""); }
              }}
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCustomSubmit} disabled={!customPrompt.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setPhase("idle"); setCustomPrompt(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Action buttons (idle) */}
        {phase === "idle" && (
          <>
            <div className="flex items-center gap-0.5 flex-wrap">
              {ACTIONS.map(({ action, icon, label }) => (
                <Button
                  key={action}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => runTransform(action)}
                >
                  {icon} {label}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2 w-full justify-start border-t border-border/50 rounded-t-none pt-1"
              onClick={() => {
                setPhase("custom-input");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Ask AI...
            </Button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
