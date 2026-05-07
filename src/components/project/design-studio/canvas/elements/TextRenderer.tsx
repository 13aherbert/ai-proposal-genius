import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useRef } from 'react';
import { TextProps } from '../types';

interface TextRendererProps {
  text: TextProps;
  editing: boolean;
  onChange: (html: string) => void;
  onExitEdit: () => void;
}

export function TextRenderer({ text, editing, onChange, onExitEdit }: TextRendererProps) {
  const lastHtmlRef = useRef(text.html);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph', 'heading'], defaultAlignment: text.align }),
    ],
    editable: editing,
    content: text.html,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-canvas-text outline-none',
      },
    },
  });

  // Sync external html updates (e.g. undo) without breaking caret
  useEffect(() => {
    if (editor && text.html !== editor.getHTML() && text.html !== lastHtmlRef.current) {
      editor.commands.setContent(text.html, { emitUpdate: false });
    }
  }, [text.html, editor]);

  // Toggle editable mode without recreating
  useEffect(() => {
    editor?.setEditable(editing);
    if (editing) {
      // focus end on enter
      setTimeout(() => editor?.commands.focus('end'), 0);
    }
  }, [editing, editor]);

  // Exit on blur while editing
  useEffect(() => {
    if (!editor || !editing) return;
    const handler = () => onExitEdit();
    editor.on('blur', handler);
    return () => { editor.off('blur', handler); };
  }, [editor, editing, onExitEdit]);

  const style: React.CSSProperties = {
    fontFamily: text.fontFamily,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight,
    fontStyle: text.italic ? 'italic' : undefined,
    textDecoration: text.underline ? 'underline' : undefined,
    color: text.color,
    textAlign: text.align,
    lineHeight: text.lineHeight,
    letterSpacing: text.letterSpacing,
    width: '100%',
    minHeight: '100%',
    cursor: editing ? 'text' : 'inherit',
    // Allow text to overflow its measured box rather than clipping mid-line.
    overflow: 'visible',
    wordBreak: 'break-word',
  };

  return (
    <div style={style}>
      <EditorContent editor={editor} />
    </div>
  );
}
