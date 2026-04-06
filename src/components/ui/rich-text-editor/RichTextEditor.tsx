import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { EditorToolbar } from "./EditorToolbar";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./styles.css";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
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
}: RichTextEditorProps) {
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 50 },
      }),
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
        // Don't save empty editor artifacts
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
      },
    },
  });

  // Sync external content changes (e.g. AI generation) into editor
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      const migrated = migrateContent(content);
      // Only update if content genuinely differs (avoid cursor jumps)
      if (migrated !== currentHTML && content !== currentHTML) {
        isExternalUpdate.current = true;
        editor.commands.setContent(migrated, false);
        isExternalUpdate.current = false;
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={cn("border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
