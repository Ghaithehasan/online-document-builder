"use client";

import { useCallback, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { initialEditorContent } from "@/features/editor/editor-content";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import { AutoTextDirection } from "@/features/editor/extensions/auto-text-direction";

const draftStorageKey = "online-document-builder:draft";
const documentTitleStorageKey = "online-document-builder:document-title";
const defaultDocumentTitle = "Untitled Document";

type EditorStats = {
  words: number;
  characters: number;
};

function getEditorStats(text: string): EditorStats {
  const trimmedText = text.trim();

  return {
    words: trimmedText ? trimmedText.split(/\s+/u).length : 0,
    characters: text.length,
  };
}

function readStoredDraft(): JSONContent | null {
  try {
    const storedDraft = window.localStorage.getItem(draftStorageKey);
    return storedDraft ? (JSON.parse(storedDraft) as JSONContent) : null;
  } catch {
    return null;
  }
}

export function DocumentEditor() {
  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle);
  const [stats, setStats] = useState<EditorStats>({
    words: 0,
    characters: 0,
  });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const syncStats = useCallback((text: string) => {
    setStats(getEditorStats(text));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      AutoTextDirection,
    ],
    content: initialEditorContent,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      const storedDraft = readStoredDraft();
      const storedTitle = window.localStorage.getItem(documentTitleStorageKey);

      if (storedTitle) {
        setDocumentTitle(storedTitle);
      }

      if (storedDraft) {
        editor.commands.setContent(storedDraft, { emitUpdate: false });
      }

      syncStats(editor.getText());
    },
    onUpdate: ({ editor }) => {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify(editor.getJSON()),
      );
      syncStats(editor.getText());
    },
    editorProps: {
      attributes: {
        class: "document-editor min-h-[620px] focus:outline-none",
        dir: "auto",
      },
    },
  });

  function handleExportPdf() {
    window.print();
  }

  function handleTitleChange(value: string) {
    setDocumentTitle(value);
    window.localStorage.setItem(documentTitleStorageKey, value);
  }

  async function handleCopyContent() {
    if (!editor) {
      return;
    }

    await navigator.clipboard.writeText(editor.getText());
    setCopyStatus("copied");
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  function handleNewDocument() {
    if (!editor) {
      return;
    }

    const confirmed = window.confirm(
      "Start a new document? This will clear the current draft.",
    );

    if (!confirmed) {
      return;
    }

    editor.commands.clearContent();
    window.localStorage.removeItem(draftStorageKey);
    window.localStorage.removeItem(documentTitleStorageKey);
    setDocumentTitle(defaultDocumentTitle);
    syncStats("");
  }

  return (
    <section
      aria-label="Online text editor"
      className="document-workspace mx-auto max-w-screen-xl"
      id="editor"
    >
      <div className="no-print mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label
            className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500"
            htmlFor="document-title"
          >
            Document title
          </label>
          <input
            className="mt-1 w-full rounded-md border border-transparent bg-transparent py-1 text-3xl font-semibold tracking-tight text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-200 hover:bg-white/70 focus:border-cyan-300 focus:bg-white focus:px-2 sm:text-4xl"
            id="document-title"
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder={defaultDocumentTitle}
            value={documentTitle}
          />
        </div>
        <p className="text-sm font-medium text-emerald-700">
          Draft saved locally
        </p>
      </div>

      <div className="no-print mb-4 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-4">
        <EditorToolbar editor={editor} />

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 lg:flex-row lg:items-center lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
            <span>{stats.words} words</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>{stats.characters} chars</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full shrink-0 sm:w-auto"
              onClick={handleCopyContent}
              variant="secondary"
            >
              {copyStatus === "copied" ? "Copied" : "Copy Content"}
            </Button>
            <Button
              className="w-full shrink-0 sm:w-auto"
              onClick={handleNewDocument}
              variant="secondary"
            >
              New Document
            </Button>
            <Button
              className="w-full shrink-0 sm:w-auto"
              onClick={handleExportPdf}
              variant="primary"
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="print-area">
        <div className="document-page mx-auto min-h-[calc(100vh-180px)] w-full max-w-[816px] bg-white px-6 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_60px_rgba(15,23,42,0.08)] sm:px-12 sm:py-14 lg:px-16">
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}
