import { type Editor } from "@tiptap/react";
import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Minus, Link2,
  Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
  Highlighter, RemoveFormatting, ChevronDown, ChevronUp,
  Undo, Redo,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface EditorToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, tooltip, shortcut, children }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            size="sm"
            pressed={isActive}
            onPressedChange={() => onClick()}
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
            )}
          >
            {children}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{tooltip}{shortcut ? ` (${shortcut})` : ""}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl";

  const insertLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border-b bg-muted/30 rounded-t-md sticky top-0 z-10">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center gap-0.5 p-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} tooltip="Bold" shortcut={`${mod}+B`}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} tooltip="Italic" shortcut={`${mod}+I`}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} tooltip="Underline" shortcut={`${mod}+U`}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} tooltip="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} tooltip="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} tooltip="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} tooltip="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive("heading", { level: 4 })} tooltip="Heading 4">
          <Heading4 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} tooltip="Bullet List" shortcut={`${mod}+Shift+8`}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} tooltip="Numbered List" shortcut={`${mod}+Shift+7`}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} tooltip="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Divider">
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} isActive={editor.isActive("link")} tooltip="Link" shortcut={`${mod}+K`}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo" shortcut={`${mod}+Z`}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo" shortcut={`${mod}+Y`}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <Toggle
          size="sm"
          pressed={showAdvanced}
          onPressedChange={setShowAdvanced}
          className="h-8 px-2 text-xs gap-1"
        >
          More
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Toggle>
      </div>

      {/* Row 2 — Advanced */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-t border-border/50">
          <ToolbarButton onClick={insertTable} tooltip="Insert Table">
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} tooltip="Align Left">
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} tooltip="Align Center">
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} tooltip="Align Right">
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} tooltip="Highlight">
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Clear Formatting">
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
