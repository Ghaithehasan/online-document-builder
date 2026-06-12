import Link from "next/link";
import { DocumentEditor } from "@/features/editor/components/document-editor";

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-[#f1f1ef] text-zinc-950">
      <header className="no-print sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold tracking-tight text-zinc-900 transition-colors hover:bg-zinc-100"
              href="/"
            >
              Online Document Builder
            </Link>
            <span className="hidden h-4 w-px bg-zinc-200 sm:block" />
            <p className="truncate text-sm text-zinc-500">Editor workspace</p>
          </div>
        </div>
      </header>

      <div className="px-3 py-6 sm:px-6 lg:px-8">
        <DocumentEditor />
      </div>
    </main>
  );
}
