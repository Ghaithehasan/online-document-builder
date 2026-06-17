"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/cn";
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
// All fonts here are served from Google Fonts — no system-only fonts.
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  // ── Geometric Sans ────────────────────────────────────────────────────────
  "family=Outfit:wght@300;400;500;600;700&" +
  "family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&" +
  "family=Space+Grotesk:wght@300;400;500;600;700&" +
  "family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&" +
  "family=Manrope:wght@300;400;500;600;700&" +
  // ── Humanist Sans ─────────────────────────────────────────────────────────
  "family=Inter:wght@300;400;500;600;700&" +
  "family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&" +
  "family=Nunito:ital,wght@0,300;0,400;0,600;0,700;1,400&" +
  "family=Albert+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&" +
  "family=Sora:wght@300;400;600;700&" +
  // ── Serif ─────────────────────────────────────────────────────────────────
  "family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400&" +
  "family=Lora:ital,wght@0,400;0,600;1,400&" +
  "family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&" +
  "family=Playfair+Display:ital,wght@0,400;0,700;1,400&" +
  "family=EB+Garamond:ital,opsz,wght@0,8..144,400;0,8..144,500;1,8..144,400&" +
  "family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&" +
  "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&" +
  // ── Monospace ─────────────────────────────────────────────────────────────
  "family=JetBrains+Mono:ital,wght@0,400;0,600;1,400&" +
  "family=Fira+Code:wght@400;500;600&" +
  "family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&" +
  "family=Roboto+Mono:ital,wght@0,400;0,500;1,400&" +
  // ── Arabic Modern ─────────────────────────────────────────────────────────
  "family=Cairo:wght@300;400;600;700;900&" +
  "family=Tajawal:wght@300;400;500;700;900&" +
  "family=Almarai:wght@300;400;700;800&" +
  "family=Noto+Sans+Arabic:wght@300;400;500;600;700&" +
  "family=Mada:wght@300;400;600;700&" +
  "family=Reem+Kufi:wght@400;500;600;700&" +
  // ── Arabic Calligraphic ───────────────────────────────────────────────────
  "family=Noto+Naskh+Arabic:wght@400;500;600;700&" +
  "family=Amiri:ital,wght@0,400;0,700;1,400&" +
  "family=Scheherazade+New:wght@400;700&" +
  "family=Lateef:wght@400;700&" +
  "family=Harmattan:wght@400;700&" +
  "family=Aref+Ruqaa:wght@400;700&" +
  "display=swap";

let googleFontsLoaded = false;
function ensureGoogleFontsLoaded() {
  if (typeof document === "undefined" || googleFontsLoaded) return;
  googleFontsLoaded = true;
  for (const href of ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]) {
    const existing = document.head.querySelector(`link[href="${href}"]`);
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      if (href.includes("gstatic")) link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  }
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
    // Clean geometric shapes, modern product feel
    label: "Geometric Sans",
    fonts: [
      { label: "Outfit",           value: "outfit",           family: `'Outfit', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Plus Jakarta Sans",value: "plus-jakarta-sans",family: `'Plus Jakarta Sans', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Space Grotesk",    value: "space-grotesk",    family: `'Space Grotesk', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Figtree",          value: "figtree",          family: `'Figtree', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Manrope",          value: "manrope",          family: `'Manrope', ${latinSansFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    // Warm humanist proportions, excellent readability
    label: "Humanist Sans",
    fonts: [
      { label: "Inter",            value: "inter",            family: `'Inter', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "DM Sans",          value: "dm-sans",          family: `'DM Sans', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Nunito",           value: "nunito",           family: `'Nunito', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Albert Sans",      value: "albert-sans",      family: `'Albert Sans', ${latinSansFallback}, ${arabicSansFallback}` },
      { label: "Sora",             value: "sora",             family: `'Sora', ${latinSansFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    // All served from Google Fonts — no system fallback-only entries
    label: "Serif",
    fonts: [
      { label: "Source Serif 4",   value: "source-serif-4",   family: `'Source Serif 4', ${arabicSerifFallback}, serif` },
      { label: "Lora",             value: "lora",             family: `'Lora', ${arabicSerifFallback}, serif` },
      { label: "Merriweather",     value: "merriweather",     family: `'Merriweather', ${arabicSerifFallback}, serif` },
      { label: "Playfair Display", value: "playfair-display", family: `'Playfair Display', ${arabicSerifFallback}, serif` },
      { label: "EB Garamond",      value: "eb-garamond",      family: `'EB Garamond', ${arabicSerifFallback}, serif` },
      { label: "Libre Baskerville",value: "libre-baskerville",family: `'Libre Baskerville', ${arabicSerifFallback}, serif` },
      { label: "Cormorant Garamond",value:"cormorant-garamond",family:`'Cormorant Garamond', ${arabicSerifFallback}, serif` },
    ],
  },
  {
    label: "Monospace",
    fonts: [
      { label: "JetBrains Mono",   value: "jetbrains-mono",   family: `'JetBrains Mono', ${monoFallback}, ${arabicSansFallback}` },
      { label: "Fira Code",        value: "fira-code",        family: `'Fira Code', ${monoFallback}, ${arabicSansFallback}` },
      { label: "IBM Plex Mono",    value: "ibm-plex-mono",    family: `'IBM Plex Mono', ${monoFallback}, ${arabicSansFallback}` },
      { label: "Roboto Mono",      value: "roboto-mono",      family: `'Roboto Mono', ${monoFallback}, ${arabicSansFallback}` },
    ],
  },
  {
    label: "Arabic — Modern",
    fonts: [
      { label: "Cairo",            value: "cairo",            family: `'Cairo', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Tajawal",          value: "tajawal",          family: `'Tajawal', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Almarai",          value: "almarai",          family: `'Almarai', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Noto Sans Arabic", value: "noto-sans-arabic", family: `'Noto Sans Arabic', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Mada",             value: "mada",             family: `'Mada', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Reem Kufi",        value: "reem-kufi",        family: `'Reem Kufi', ${arabicSansFallback}, ${latinSansFallback}` },
    ],
  },
  {
    // All Arabic calligraphic fonts served from Google Fonts
    label: "Arabic — Calligraphic",
    fonts: [
      { label: "Noto Naskh Arabic",value: "noto-naskh-arabic",family: `'Noto Naskh Arabic', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Amiri",            value: "amiri",            family: `'Amiri', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Scheherazade New", value: "scheherazade-new", family: `'Scheherazade New', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Lateef",          value: "lateef",           family: `'Lateef', ${arabicSerifFallback}, ${latinSansFallback}` },
      { label: "Harmattan",        value: "harmattan",        family: `'Harmattan', ${arabicSansFallback}, ${latinSansFallback}` },
      { label: "Aref Ruqaa",       value: "aref-ruqaa",       family: `'Aref Ruqaa', ${arabicSerifFallback}, ${latinSansFallback}` },
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
type ActivePanel = "none" | "format" | "search";

export function DocumentEditor() {
  ensureGoogleFontsLoaded();

  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle);
  const [documentFont, setDocumentFont] = useState(defaultDocumentFont);
  const [stats, setStats] = useState<EditorStats>({ words: 0, characters: 0 });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

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
        class: "document-editor min-h-[60vh] focus:outline-none",
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

  function handleMenuSelect(panel: "format" | "search") {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
    setMenuOpen(false);
  }

  const selectedFont = documentFonts.find((f) => f.value === documentFont) ?? documentFonts[0];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f1f1ef]">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="no-print z-30 flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 shadow-sm sm:px-4">

        {/* Back to home */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title="Back to home"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10,3 6,8 10,13" />
          </svg>
          <span className="hidden sm:block">ODB</span>
        </Link>

        <div className="h-4 w-px shrink-0 bg-slate-200" />

        {/* ≡ Hamburger / tools menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              menuOpen || activePanel !== "none"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
            title="Tools"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
              <line x1="2" y1="4.5" x2="14" y2="4.5" />
              <line x1="2" y1="8"   x2="14" y2="8"   />
              <line x1="2" y1="11.5" x2="14" y2="11.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="p-1.5 flex flex-col gap-0.5">
                <button
                  onClick={() => handleMenuSelect("format")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    activePanel === "format"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-indigo-600" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                      <path d="M3 13L7 3l4 10M4.5 10h5" />
                      <path d="M11.5 5c.4-1.2 1.2-1.8 2-1.8s1.8.5 1.8 1.5-1 1.8-1.8 2.2c-.9.5-2 .9-2 2.6" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">Formatting</span>
                    <span className="block text-[11px] text-slate-400">Headings, bold, lists…</span>
                  </span>
                  {activePanel === "format" && (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="ml-auto h-3.5 w-3.5 shrink-0 text-indigo-500">
                      <path d="M6.5 11.5L2.5 7.5l1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleMenuSelect("search")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    activePanel === "search"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-slate-600" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                      <circle cx="7" cy="7" r="4.5" />
                      <line x1="10.5" y1="10.5" x2="14" y2="14" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">Search & Replace</span>
                    <span className="block text-[11px] text-slate-400">Find and replace text</span>
                  </span>
                  {activePanel === "search" && (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="ml-auto h-3.5 w-3.5 shrink-0 text-indigo-500">
                      <path d="M6.5 11.5L2.5 7.5l1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px shrink-0 bg-slate-200" />

        {/* App name */}
        <span className="hidden select-none text-[13px] font-semibold text-slate-800 sm:block">
          Document Builder
        </span>

        {/* ── Right-side controls ── */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

          {/* Font selector */}
          <div className="relative hidden lg:block">
            <select
              className="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 text-[12px] font-medium text-slate-700 outline-none transition-all hover:border-indigo-300 hover:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              onChange={(e) => handleFontChange(e.target.value)}
              style={{ fontFamily: selectedFont.family }}
              value={documentFont}
            >
              {documentFontGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.fonts.map((font) => (
                    <option key={font.value} style={{ fontFamily: font.family }} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg viewBox="0 0 10 6" fill="none" className="h-2 w-2 text-slate-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,1 5,5 9,1" />
              </svg>
            </div>
          </div>

          {/* Draft indicator */}
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 sm:flex">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-semibold text-emerald-700">Saved</span>
          </div>

          {/* Stats */}
          <span className="hidden tabular-nums text-[11px] font-medium text-slate-400 xl:block">
            {stats.words.toLocaleString()}w · {stats.characters.toLocaleString()}c
          </span>

          <div className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />

          {/* Copy */}
          <button
            onClick={handleCopyContent}
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 sm:flex"
            title="Copy plain text"
          >
            {copyStatus === "copied" ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 text-emerald-500" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,8 6.5,11.5 13,4" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                  <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5V9.5A1.5 1.5 0 0 0 3.5 11H5" />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* New document */}
          <button
            onClick={handleNewDocument}
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 md:flex"
            title="New document"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V7L9 2z" />
              <polyline points="9,2 9,7 13.5,7" />
            </svg>
            New
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
            title="Export as PDF"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 shrink-0" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8M5 7l3 3 3-3" />
              <path d="M2 12.5v1A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-1" />
            </svg>
            <span className="hidden sm:block">Export PDF</span>
          </button>
        </div>
      </header>

      {/* ── Tool panel ─────────────────────────────────────────────────────── */}
      {activePanel !== "none" && (
        <div className="no-print shrink-0 border-b border-slate-200 bg-white shadow-sm">
          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/80 px-3 py-1.5">
            <div className="flex gap-0.5">
              <button
                onClick={() => setActivePanel("format")}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors",
                  activePanel === "format"
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M3 13L7 3l4 10M4.5 10h5" />
                </svg>
                Formatting
              </button>
              <button
                onClick={() => setActivePanel("search")}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors",
                  activePanel === "search"
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <line x1="10.5" y1="10.5" x2="14" y2="14" />
                </svg>
                Search
              </button>
            </div>

            <button
              onClick={() => setActivePanel("none")}
              className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Close panel"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </button>
          </div>

          {/* Panel content */}
          <div className="px-4 py-3">
            {activePanel === "format" && <EditorToolbar editor={editor} />}
            {activePanel === "search" && <TextToolsPanel editor={editor} bare />}
          </div>
        </div>
      )}

      {/* ── Writing canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto print-area">
        <div className="mx-auto max-w-[816px] px-3 py-8 pb-16 sm:px-6">

          {/* Document sheet */}
          <div
            className="document-page relative bg-white px-8 pb-20 pt-14 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_32px_rgba(15,23,42,0.07),0_24px_64px_rgba(15,23,42,0.06)] sm:px-14 sm:pt-16"
            style={{ fontFamily: selectedFont.family }}
          >
            {/* Document title */}
            <input
              className="mb-6 block w-full border-0 bg-transparent text-4xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300 sm:text-5xl"
              id="document-title"
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Document"
              value={documentTitle}
              dir="auto"
            />

            {/* Divider */}
            <div className="mb-8 h-px w-12 bg-slate-200" />

            {/* Editor */}
            <EditorContent editor={editor} />
          </div>

          {/* Footer stats */}
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-3 tabular-nums text-[11px] font-medium text-slate-400">
              <span>
                <span className="text-slate-600">{stats.words.toLocaleString()}</span> words
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>
                <span className="text-slate-600">{stats.characters.toLocaleString()}</span> chars
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
