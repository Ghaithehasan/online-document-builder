"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";

type TextToolsPanelProps = {
  editor: Editor | null;
};

type MatchRange = {
  from: number;
  to: number;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMatchRanges(editor: Editor, query: string): MatchRange[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const ranges: MatchRange[] = [];
  const matcher = new RegExp(escapeRegExp(normalizedQuery), "giu");

  editor.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) {
      return;
    }

    for (const match of node.text.matchAll(matcher)) {
      const index = match.index ?? 0;

      ranges.push({
        from: position + index,
        to: position + index + match[0].length,
      });
    }
  });

  

  return ranges;
}

function replaceRanges(editor: Editor, ranges: MatchRange[], value: string) {
  if (ranges.length === 0) {
    return false;
  }

  const transaction = editor.state.tr;

  ranges
    .slice()
    .reverse()
    .forEach((range) => {
      transaction.insertText(value, range.from, range.to);
    });

  editor.view.dispatch(transaction);
  editor.view.focus();
  return true;
}

function transformSelection(editor: Editor, transform: (value: string) => string) {
  const { from, to } = editor.state.selection;

  if (from === to) {
    return false;
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

  if (ranges.length === 0) {
    return false;
  }

  const transaction = editor.state.tr;

  ranges
    .slice()
    .reverse()
    .forEach((range) => {
      transaction.insertText(transform(range.text), range.from, range.to);
    });

  editor.view.dispatch(transaction);
  editor.view.focus();
  return true;
}

export function TextToolsPanel({ editor }: TextToolsPanelProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [documentVersion, setDocumentVersion] = useState(0);
  const [status, setStatus] = useState<{ text: string; type: "idle" | "success" | "warning" }>({
    text: "Select text or search to get started.",
    type: "idle",
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const syncDocumentVersion = () => setDocumentVersion((version) => version + 1);

    editor.on("update", syncDocumentVersion);
    editor.on("selectionUpdate", syncDocumentVersion);

    return () => {
      editor.off("update", syncDocumentVersion);
      editor.off("selectionUpdate", syncDocumentVersion);
    };
  }, [editor]);

  const matches = editor && documentVersion >= 0 ? getMatchRanges(editor, query) : [];

  const hasQuery = query.trim().length > 0;
  const hasSelection = editor ? !editor.state.selection.empty : false;

  function notify(text: string, type: "idle" | "success" | "warning" = "idle") {
    setStatus({ text, type });
  }

  function handleFindNext() {
    if (!editor || matches.length === 0) {
      notify("No matches found.", "warning");
      return;
    }

    const currentPosition = editor.state.selection.to;
    const nextMatch =
      matches.find((match) => match.from >= currentPosition) ?? matches[0];

    editor.chain().focus().setTextSelection(nextMatch).run();
    notify(
      `Found ${matches.length} match${matches.length === 1 ? "" : "es"}.`,
      "success",
    );
  }

  function handleReplaceAll() {
    if (!editor || matches.length === 0) {
      setStatus({ text: "Nothing to replace.", type: "warning" });
      return;
    }

    replaceRanges(editor, matches, replacement);
    setStatus({
      text: `Replaced ${matches.length} occurrence${matches.length === 1 ? "" : "s"}.`,
      type: "success",
    });
  }

  function handleDeleteAll() {
    if (!editor || matches.length === 0) {
      setStatus({ text: "Nothing to delete.", type: "warning" });
      return;
    }

    replaceRanges(editor, matches, "");
    setStatus({
      text: `Deleted ${matches.length} occurrence${matches.length === 1 ? "" : "s"}.`,
      type: "success",
    });
  }

  function handleRemoveDuplicates() {
    if (!editor || matches.length <= 1) {
      setStatus({ text: "No repeated occurrences to remove.", type: "warning" });
      return;
    }

    const repeatedMatches = matches.slice(1);
    replaceRanges(editor, repeatedMatches, "");
    setStatus({
      text: `Removed ${repeatedMatches.length} duplicate${repeatedMatches.length === 1 ? "" : "s"}.`,
      type: "success",
    });
  }

  function handleUppercase() {
    if (!editor || !transformSelection(editor, (value) => value.toLocaleUpperCase())) {
      setStatus({ text: "Select text first, then apply uppercase.", type: "warning" });
      return;
    }
    setStatus({ text: "Selection converted to uppercase.", type: "success" });
  }

  function handleLowercase() {
    if (!editor || !transformSelection(editor, (value) => value.toLocaleLowerCase())) {
      setStatus({ text: "Select text first, then apply lowercase.", type: "warning" });
      return;
    }
    setStatus({ text: "Selection converted to lowercase.", type: "success" });
  }

  const statusColors = {
    idle: "text-slate-400",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };

  return (
    <div className="no-print mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-indigo-600" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-slate-700">Text Tools</span>
          <span className="text-[11px] text-slate-400">·</span>
          <span className="text-[12px] text-slate-500">Find, replace & transform</span>
        </div>

        {/* Match counter badge */}
        <div
          className={[
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            hasQuery && matches.length > 0
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
              : "bg-slate-100 text-slate-400",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              hasQuery && matches.length > 0 ? "bg-indigo-500" : "bg-slate-300",
            ].join(" ")}
          />
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-3.5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-6">
          {/* Search & Replace inputs */}
          <div className="min-w-0 flex-1">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              {/* Find input */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Find
                </span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-slate-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                      <circle cx="7" cy="7" r="4.5" />
                      <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" />
                    </svg>
                  </div>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search in document…"
                    value={query}
                  />
                </div>
              </label>

              {/* Replace input */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Replace with
                </span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-slate-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 10h10M8 6l4 4-4 4" />
                      <path d="M14 4H6" />
                    </svg>
                  </div>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
                    onChange={(event) => setReplacement(event.target.value)}
                    placeholder="Replacement text…"
                    value={replacement}
                  />
                </div>
              </label>

              {/* Find Next button */}
              <div className="flex items-end">
                <button
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!hasQuery}
                  onClick={handleFindNext}
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,4 10,8 6,12" />
                  </svg>
                  Find next
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Case transform group */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasSelection}
                onClick={handleUppercase}
                title="UPPERCASE"
              >
                <span className="text-[11px] font-extrabold tracking-wider">AA</span>
                Uppercase
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasSelection}
                onClick={handleLowercase}
                title="lowercase"
              >
                <span className="text-[11px] font-medium tracking-wider">aa</span>
                Lowercase
              </button>
            </div>

            {/* Search actions group */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasQuery || matches.length === 0}
                onClick={handleReplaceAll}
                title="Replace all matches"
              >
                Replace all
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasQuery || matches.length < 2}
                onClick={handleRemoveDuplicates}
                title="Keep first, remove the rest"
              >
                Remove duplicates
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                disabled={!hasQuery || matches.length === 0}
                onClick={handleDeleteAll}
                title="Delete all matches"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,4 13,4" />
                  <path d="M6,4V2.5h4V4M5,4v9.5h6V4H5z" />
                </svg>
                Delete all
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
          <div
            className={[
              "h-1.5 w-1.5 rounded-full flex-shrink-0",
              status.type === "success" ? "bg-emerald-400" : status.type === "warning" ? "bg-amber-400" : "bg-slate-300",
            ].join(" ")}
          />
          <p className={["text-[12px] font-medium transition-colors", statusColors[status.type]].join(" ")}>
            {status.text}
          </p>
        </div>
      </div>
    </div>
  );
}