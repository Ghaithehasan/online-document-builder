"use client";

import { useCallback, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { initialEditorContent } from "@/features/editor/editor-content";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import { TextToolsPanel } from "@/features/editor/components/text-tools-panel";
import { AutoTextDirection } from "@/features/editor/extensions/auto-text-direction";

// ─── Storage keys ─────────────────────────────────────────────────────────────
const draftStorageKey = "online-document-builder:draft";
const documentTitleStorageKey = "online-document-builder:document-title";
const documentFontStorageKey = "online-document-builder:document-font";
const defaultDocumentTitle = "Untitled Document";
const defaultDocumentFont = "inter";

// ─── Google Fonts loader ──────────────────────────────────────────────────────
// These fonts are loaded via a <link> tag injected into <head> once.
// We include all variable & Arabic fonts here so they actually render.
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Grotesk:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700&family=Nunito:ital,wght@0,300;0,400;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,400;0,600;1,400&family=Fira+Code:wght@400;500;600&family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;900&family=Almarai:wght@300;400;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;500;600;700&family=Mada:wght@300;400;600;700&family=Lateef:wght@400;700&display=swap";

let googleFontsLoaded = false;
function ensureGoogleFontsLoaded() {
  if (typeof document === "undefined" || googleFontsLoaded) return;
  googleFontsLoaded = true;

  // Preconnect
  for (const href of ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]) {
    const existing = document.head.querySelector(`link[href="${href}"]`);
    if (!existing) {
      const link = document.createElement("link");
      link.rel = href.includes("gstatic") ? "preconnect" : "preconnect";
      link.href = href;
      if (href.includes("gstatic")) link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  }

  // Main fonts stylesheet
  if (!document.head.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }
}

// ─── Font stacks ─────────────────────────────────────────────────────────────
const latinSansFallback = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
const arabicSansFallback = "'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif";
const arabicSerifFallback = "'Noto Naskh Arabic', 'Times New Roman', Tahoma, serif";
const monoFallback = "'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

type DocumentFont = { label: string; value: string; family: string };

const documentFontGroups: Array<{ label: string; fonts: DocumentFont[] }> = [
  {
    label: "Modern Sans-Serif",
    fonts: [
      { label: "Inter",          value: "inter",          family: `'Inter', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "DM Sans",        value: "dm-sans",        family: `'DM Sans', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Space Grotesk",  value: "space-grotesk",  family: `'Space Grotesk', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Sora",           value: "sora",           family: `'Sora', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Nunito",         value: "nunito",         family: `'Nunito', ${latinSansFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    label: "Classic Sans-Serif",
    fonts: [
      { label: "System Sans",    value: "system-sans",    family: `${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Segoe UI",       value: "segoe-ui",       family: `'Segoe UI', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Helvetica",      value: "helvetica",      family: `Helvetica, Arial, ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Arial",          value: "arial",          family: `Arial, Helvetica, ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Verdana",        value: "verdana",        family: `Verdana, Geneva, ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Trebuchet MS",   value: "trebuchet-ms",   family: `'Trebuchet MS', ${latinSansFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    label: "Serif",
    fonts: [
      { label: "Source Serif 4", value: "source-serif-4", family: `'Source Serif 4', ${arabicSerifFallback}, Georgia, serif` },
      { label: "Lora",           value: "lora",           family: `'Lora', ${arabicSerifFallback}, Georgia, serif` },
      { label: "Merriweather",   value: "merriweather",   family: `'Merriweather', Georgia, 'Times New Roman', ${arabicSerifFallback}` },
      { label: "Playfair Display",value: "playfair-display",family:`'Playfair Display', Georgia, ${arabicSerifFallback}` },
      { label: "Georgia",        value: "georgia",        family: `Georgia, 'Times New Roman', ${arabicSerifFallback}` },
      { label: "Times New Roman",value: "times-new-roman",family: `'Times New Roman', Times, ${arabicSerifFallback}` },
      { label: "Garamond",       value: "garamond",       family: `Garamond, Georgia, 'Times New Roman', ${arabicSerifFallback}` },
    ],
  },
  {
    label: "Monospace",
    fonts: [
      { label: "JetBrains Mono", value: "jetbrains-mono", family: `'JetBrains Mono', ${monoFallback}, ${arabicSansFallback}` },
      { label: "Fira Code",      value: "fira-code",      family: `'Fira Code', ${monoFallback}, ${arabicSansFallback}` },
      { label: "IBM Plex Mono",  value: "ibm-plex-mono",  family: `'IBM Plex Mono', ${monoFallback}, ${arabicSansFallback}` },
      { label: "Courier New",    value: "courier-new",    family: `'Courier New', Courier, ${monoFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    label: "Arabic — Modern",
    fonts: [
      { label: "Cairo",          value: "cairo",          family: `'Cairo', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Tajawal",        value: "tajawal",        family: `'Tajawal', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Almarai",        value: "almarai",        family: `'Almarai', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Noto Sans Arabic",value: "noto-sans-arabic",family:`'Noto Sans Arabic', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Mada",           value: "mada",           family: `'Mada', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Reem Kufi",      value: "reem-kufi",      family: `'Reem Kufi', ${arabicSansFallback}, ${latinSansFallback}` },
    ],
  },
  {
    label: "Arabic — Calligraphic",
    fonts: [
      { label: "Noto Naskh Arabic", value: "noto-naskh-arabic", family: `'Noto Naskh Arabic', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Amiri",          value: "amiri",          family: `'Amiri', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Scheherazade New",value: "scheherazade-new",family:`'Scheherazade New', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Lateef",         value: "lateef",         family: `'Lateef', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Geeza Pro",      value: "geeza-pro",      family: `'Geeza Pro', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Traditional Arabic",value:"traditional-arabic",family:`'Traditional Arabic', ${arabicSerifFallback}, ${latinSansFallback}` },
    ],
  },
];

const documentFonts = documentFontGroups.flatMap((g) => g.fonts);

// ─── Stats ────────────────────────────────────────────────────────────────────
type EditorStats = { words: number; characters: number };

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

// ─── Component ────────────────────────────────────────────────────────────────
export function DocumentEditor() {
  ensureGoogleFontsLoaded();

  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle);
  const [documentFont, setDocumentFont] = useState(defaultDocumentFont);
  const [stats, setStats] = useState<EditorStats>({ words: 0, characters: 0 });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const syncStats = useCallback((text: string) => {
    setStats(getEditorStats(text));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      AutoTextDirection,
    ],
    content: initialEditorContent,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      const storedDraft = readStoredDraft();
      const storedTitle = window.localStorage.getItem(documentTitleStorageKey);
      const storedFont  = window.localStorage.getItem(documentFontStorageKey);

      if (storedTitle) setDocumentTitle(storedTitle);
      if (storedFont && documentFonts.some((f) => f.value === storedFont)) {
        setDocumentFont(storedFont);
      }
      if (storedDraft) editor.commands.setContent(storedDraft, { emitUpdate: false });

      syncStats(editor.getText());
    },
    onUpdate: ({ editor }) => {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(editor.getJSON()));
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

  function handleFontChange(value: string) {
    setDocumentFont(value);
    window.localStorage.setItem(documentFontStorageKey, value);
  }

  async function handleCopyContent() {
    if (!editor) return;
    await navigator.clipboard.writeText(editor.getText());
    setCopyStatus("copied");
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  function handleNewDocument() {
    if (!editor) return;
    const confirmed = window.confirm("Start a new document? This will clear the current draft.");
    if (!confirmed) return;

    editor.commands.clearContent();
    window.localStorage.removeItem(draftStorageKey);
    window.localStorage.removeItem(documentTitleStorageKey);
    window.localStorage.removeItem(documentFontStorageKey);
    setDocumentTitle(defaultDocumentTitle);
    setDocumentFont(defaultDocumentFont);
    syncStats("");
  }

  const selectedFont = documentFonts.find((f) => f.value === documentFont) ?? documentFonts[0];

  return (
    <section
      aria-label="Online text editor"
      className="document-workspace mx-auto max-w-screen-xl"
      id="editor"
    >
      {/* ── Top header: title + font selector ─────────────────────────────── */}
      <div className="no-print mb-5 flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
        {/* Document title */}
        <div className="min-w-0 flex-1">
          <label
            className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
            htmlFor="document-title"
          >
            Document title
          </label>
          <input
            className="mt-1.5 w-full rounded-lg border border-transparent bg-transparent py-1 text-3xl font-bold tracking-tight text-slate-900 outline-none transition-all placeholder:text-slate-300 hover:border-slate-200 hover:bg-white/80 focus:border-indigo-300 focus:bg-white focus:px-3 focus:ring-4 focus:ring-indigo-50 sm:text-4xl"
            id="document-title"
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder={defaultDocumentTitle}
            value={documentTitle}
          />
        </div>

        {/* Font selector + draft status */}
        <div className="grid gap-3 sm:grid-cols-[minmax(200px,260px)_auto] sm:items-end">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Document font
            </span>
            <div className="relative mt-1.5">
              {/* Font icon */}
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-slate-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 13L7 3l4 10M4.5 10h5" />
                  <path d="M11 6c.5-1.5 1.5-2 2.5-2s2 .5 2 1.5-1 2-2 2.5c-1 .5-2.5 1-2.5 3" />
                </svg>
              </div>
              <select
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] font-medium text-slate-800 shadow-sm outline-none transition-all hover:border-indigo-300 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
                onChange={(event) => handleFontChange(event.target.value)}
                style={{ fontFamily: selectedFont.family }}
                value={documentFont}
              >
                {documentFontGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.fonts.map((font) => (
                      <option
                        key={font.value}
                        style={{ fontFamily: font.family }}
                        value={font.value}
                      >
                        {font.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg viewBox="0 0 10 6" fill="none" className="h-2.5 w-2.5 text-slate-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1,1 5,5 9,1" />
                </svg>
              </div>
            </div>
          </label>

          {/* Draft saved indicator */}
          <div className="flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-[12px] font-semibold text-emerald-700">Draft saved locally</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar bar ───────────────────────────────────────────────────── */}
      <div className="no-print mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-4">
        <EditorToolbar editor={editor} />

        {/* Right-side actions */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:border-t-0 lg:pt-0">
          {/* Word / char stats */}
          <div className="flex items-center gap-3 text-[12px] font-semibold text-slate-400">
            <span className="tabular-nums">
              <span className="text-slate-700">{stats.words.toLocaleString()}</span>
              {" "}words
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="tabular-nums">
              <span className="text-slate-700">{stats.characters.toLocaleString()}</span>
              {" "}chars
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              onClick={handleCopyContent}
            >
              {copyStatus === "copied" ? (
                <>
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-emerald-500" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,8 6.5,11.5 13,4" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" />
                    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5V9.5A1.5 1.5 0 0 0 3.5 11H5" />
                  </svg>
                  Copy content
                </>
              )}
            </button>

            <button
              className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              onClick={handleNewDocument}
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V7L9 2z" />
                <polyline points="9,2 9,7 13.5,7" />
              </svg>
              New document
            </button>

            <button
              className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 sm:w-auto"
              onClick={handleExportPdf}
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8M5 7l3 3 3-3" />
                <path d="M2 12.5v1A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-1" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Text Tools Panel ──────────────────────────────────────────────── */}
      <TextToolsPanel editor={editor} />

      {/* ── Document canvas ───────────────────────────────────────────────── */}
      <div className="print-area">
        <div
          className="document-page mx-auto min-h-[calc(100vh-180px)] w-full max-w-[816px] bg-white px-6 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_32px_rgba(15,23,42,0.07),0_24px_64px_rgba(15,23,42,0.06)] sm:px-12 sm:py-14 lg:px-16"
          style={{ fontFamily: selectedFont.family }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}