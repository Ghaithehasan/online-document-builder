"use client";

import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/cn";

type ToolbarButtonProps = {
  label: string;
  title: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
};

function ToolbarButton({
  label,
  title,
  isActive = false,
  disabled = false,
  onClick,
  icon,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2.5",
        "text-[11px] font-semibold tracking-wide text-slate-500 transition-all duration-150",
        "hover:bg-slate-100 hover:text-slate-900",
        "disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1",
        isActive && [
          "bg-indigo-600 text-white shadow-sm",
          "hover:bg-indigo-700 hover:text-white",
          "ring-1 ring-indigo-500/30",
        ],
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {icon ?? label}
    </button>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
};

type TextDirection = "ltr" | "rtl";

type MatchRange = {
  from: number;
  to: number;
};

function transformSelection(editor: Editor, transform: (value: string) => string) {
  const { from, to } = editor.state.selection;

  if (from === to) {
    return;
  }

  const ranges: Array<MatchRange & { text: string }> = [];

  editor.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) {
      return;
    }

    const nodeFrom = position;
    const nodeTo = position + node.text.length;
    const rangeFrom = Math.max(from, nodeFrom);
    const rangeTo = Math.min(to, nodeTo);

    if (rangeFrom < rangeTo) {
      ranges.push({
        from: rangeFrom,
        to: rangeTo,
        text: node.text.slice(rangeFrom - nodeFrom, rangeTo - nodeFrom),
      });
    }
  });

  const transaction = editor.state.tr;

  ranges
    .slice()
    .reverse()
    .forEach((range) => {
      transaction.insertText(transform(range.text), range.from, range.to);
    });

  editor.view.dispatch(transaction);
  editor.view.focus();
}

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

function ToolbarDivider() {
  return <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" />;
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-slate-50 px-1 py-1 ring-1 ring-slate-100">
      {children}
    </div>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      {/* Headings & Block Type */}
      <ToolbarGroup>
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
          label="¶"
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Inline Formatting */}
      <ToolbarGroup>
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          icon={<span className="font-extrabold">B</span>}
        />
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          icon={<span className="italic font-semibold">I</span>}
        />
        <ToolbarButton
          isActive={editor.isActive("underline")}
          label="U"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
          icon={<span className="underline font-semibold">U</span>}
        />
        <ToolbarButton
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          label="S"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          icon={<span className="line-through font-semibold">S</span>}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Case Transform */}
      <ToolbarGroup>
        <ToolbarButton
          label="AA"
          onClick={() =>
            transformSelection(editor, (value) => value.toLocaleUpperCase())
          }
          title="Convert to uppercase"
          icon={
            <span className="font-bold text-[11px] tracking-widest">
              A<span className="text-[9px]">A</span>
            </span>
          }
        />
        <ToolbarButton
          label="aa"
          onClick={() =>
            transformSelection(editor, (value) => value.toLocaleLowerCase())
          }
          title="Convert to lowercase"
          icon={
            <span className="font-medium text-[11px] tracking-widest">
              a<span className="text-[9px]">a</span>
            </span>
          }
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Lists & Quotes */}
      <ToolbarGroup>
        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          label="UL"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="3" cy="4.5" r="1" fill="currentColor" stroke="none" />
              <circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" />
              <circle cx="3" cy="11.5" r="1" fill="currentColor" stroke="none" />
              <line x1="6" y1="4.5" x2="14" y2="4.5" strokeLinecap="round" />
              <line x1="6" y1="8" x2="14" y2="8" strokeLinecap="round" />
              <line x1="6" y1="11.5" x2="14" y2="11.5" strokeLinecap="round" />
            </svg>
          }
        />
        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          label="OL"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
              <text x="1" y="6" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">1.</text>
              <text x="1" y="10" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">2.</text>
              <text x="1" y="14" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">3.</text>
              <line x1="7" y1="4.5" x2="14" y2="4.5" strokeLinecap="round" />
              <line x1="7" y1="8" x2="14" y2="8" strokeLinecap="round" />
              <line x1="7" y1="11.5" x2="14" y2="11.5" strokeLinecap="round" />
            </svg>
          }
        />
        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          label="❝"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M3 6.5C3 5.12 4.12 4 5.5 4H6a.5.5 0 0 1 0 1h-.5A1.5 1.5 0 0 0 4 6.5V7h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5C2 6.67 2.45 6 3 6.5zM9 6.5C9 5.12 10.12 4 11.5 4H12a.5.5 0 0 1 0 1h-.5A1.5 1.5 0 0 0 10 6.5V7h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7.5C8 6.67 8.45 6 9 6.5z"/>
            </svg>
          }
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Text Direction */}
      <ToolbarGroup>
        <ToolbarButton
          isActive={editor.isActive({ dir: "ltr" })}
          label="LTR"
          onClick={() => setTextDirection(editor, "ltr")}
          title="Left to right"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
              <line x1="2" y1="5" x2="10" y2="5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="14" y2="8" strokeLinecap="round" />
              <line x1="2" y1="11" x2="10" y2="11" strokeLinecap="round" />
              <polyline points="12,6 14,8 12,10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ToolbarButton
          isActive={editor.isActive({ dir: "rtl" })}
          label="RTL"
          onClick={() => setTextDirection(editor, "rtl")}
          title="Right to left"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
              <line x1="6" y1="5" x2="14" y2="5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="14" y2="8" strokeLinecap="round" />
              <line x1="6" y1="11" x2="14" y2="11" strokeLinecap="round" />
              <polyline points="4,6 2,8 4,10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* History & Formatting */}
      <ToolbarGroup>
        <ToolbarButton
          disabled={!editor.can().undo()}
          label="↩"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 6.5H9a4 4 0 0 1 0 8H5" />
              <polyline points="3.5,3.5 3.5,6.5 6.5,6.5" />
            </svg>
          }
        />
        <ToolbarButton
          disabled={!editor.can().redo()}
          label="↪"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 6.5H7a4 4 0 0 0 0 8h4" />
              <polyline points="12.5,3.5 12.5,6.5 9.5,6.5" />
            </svg>
          }
        />
        <ToolbarButton
          label="✕"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
          icon={
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          }
        />
      </ToolbarGroup>
    </div>
  );
}