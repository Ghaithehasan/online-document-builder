"use client";

import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/cn";

type ToolbarButtonProps = {
  label: string;
  title: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  label,
  title,
  isActive = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 text-sm font-medium text-zinc-600 transition-colors",
        "hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent",
        isActive && "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:text-white",
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
};

type TextDirection = "ltr" | "rtl";

function setTextDirection(editor: Editor, direction: TextDirection) {
  editor
    .chain()
    .focus()
    .updateAttributes("paragraph", { dir: direction })
    .updateAttributes("heading", { dir: direction })
    .updateAttributes("blockquote", { dir: direction })
    .updateAttributes("bulletList", { dir: direction })
    .updateAttributes("orderedList", { dir: direction })
    .updateAttributes("listItem", { dir: direction })
    .run();
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-md bg-zinc-50 p-1">
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 1 })}
          label="H1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        />
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 2 })}
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        />
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 3 })}
          label="H3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        />
        <ToolbarButton
          isActive={editor.isActive("paragraph")}
          label="P"
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block" />

      <div className="flex items-center gap-1 rounded-md bg-zinc-50 p-1">
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        />
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        />
        <ToolbarButton
          isActive={editor.isActive("underline")}
          label="U"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        />
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          label="S"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block" />

      <div className="flex items-center gap-1 rounded-md bg-zinc-50 p-1">
        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          label="UL"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        />
        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          label="OL"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        />
        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block" />

      <div className="flex items-center gap-1 rounded-md bg-zinc-50 p-1">
        <ToolbarButton
          isActive={editor.isActive({ dir: "ltr" })}
          label="LTR"
          onClick={() => setTextDirection(editor, "ltr")}
          title="Left to right"
        />
        <ToolbarButton
          isActive={editor.isActive({ dir: "rtl" })}
          label="RTL"
          onClick={() => setTextDirection(editor, "rtl")}
          title="Right to left"
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block" />

      <div className="flex items-center gap-1 rounded-md bg-zinc-50 p-1">
        <ToolbarButton
          disabled={!editor.can().undo()}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        />
        <ToolbarButton
          disabled={!editor.can().redo()}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        />
        <ToolbarButton
          label="Clear"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        />
      </div>
    </div>
  );
}
