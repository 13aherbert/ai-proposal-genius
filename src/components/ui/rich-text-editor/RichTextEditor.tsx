import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { EditorToolbar } from "./EditorToolbar";
import { AIBubbleMenu } from "./AIBubbleMenu";
import { FullScreenEditor } from "./FullScreenEditor";
import { SectionStats } from "./SectionStats";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./aiTransform";
import "./styles.css";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  sectionTitle?: string;
  tone?: Tone;
}

/**
 * Wrap plain text in <p> tags if it doesn't contain HTML.
 */
function migrateContent(content: string): string {
  if (!content) return "";
  // If content already has HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  // Convert plain text: split on double newlines for paragraphs
  return content
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function RichTextEditor({
  content,
  onChange,
  onBlur,
  placeholder = "Start writing or use AI to generate content...",
  className,
  sectionTitle,
  tone,
}: RichTextEditorProps) {
  const isExternalUpdate = useRef(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "tiptap-table" },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: migrateContent(content),
    onUpdate: ({ editor: e }) => {
      if (!isExternalUpdate.current) {
        const html = e.getHTML();
        if (html === "<p></p>") {
          onChange("");
        } else {
          onChange(html);
        }
      }
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3",
        spellcheck: "true",
      },
    },
  });

  // Fullscreen shortcut: Ctrl+Shift+F or F11
  const handleFullScreenShortcut = useCallback((e: KeyboardEvent) => {
    if (e.key === "F11" || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F")) {
      e.preventDefault();
      setIsFullScreen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleFullScreenShortcut);
    return () => document.removeEventListener("keydown", handleFullScreenShortcut);
  }, [handleFullScreenShortcut]);

  // Sync external content changes (e.g. AI generation) into editor
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      const migrated = migrateContent(content);
      if (migrated !== currentHTML && content !== currentHTML) {
        isExternalUpdate.current = true;
        editor.commands.setContent(migrated);
        isExternalUpdate.current = false;
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  if (isFullScreen) {
    return (
      <FullScreenEditor
        editor={editor}
        sectionTitle={sectionTitle}
        tone={tone}
        onExit={() => setIsFullScreen(false)}
      />
    );
  }

  return (
    <div className={cn("border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background", className)}>
      <EditorToolbar editor={editor} onFullScreen={() => setIsFullScreen(true)} />
      <AIBubbleMenu editor={editor} sectionTitle={sectionTitle} tone={tone} />
      <EditorContent editor={editor} />
      <div className="border-t px-4 py-1.5 flex items-center justify-end">
        <SectionStats content={content} className="text-xs text-muted-foreground" />
      </div>
    </div>
  );
}
