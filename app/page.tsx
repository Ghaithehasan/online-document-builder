import Link from "next/link";

const productHighlights = [
  "Tiptap rich text editor",
  "Arabic RTL ready",
  "Local draft recovery",
];

export default function Home() {
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />
      <div className="landing-grid" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30">
              OD
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Online Document Builder
            </span>
          </Link>
          <Link
            className="rounded-md border border-white/12 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition-colors hover:bg-white/16"
            href="/editor"
          >
            Open editor
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="landing-enter max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Enterprise-ready MVP workspace
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Build polished documents from a focused online editor.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A modern writing experience for formatted documents, Arabic and
            English content, local drafts, and browser-based PDF export.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform hover:-translate-y-0.5 hover:bg-cyan-200"
              href="/editor"
            >
              Start writing
            </Link>
            <a
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 bg-white/8 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/14"
              href="#capabilities"
            >
              View capabilities
            </a>
          </div>

          <div
            className="mt-10 flex flex-wrap gap-2 text-sm text-slate-300"
            id="capabilities"
          >
            {productHighlights.map((highlight) => (
              <span
                className="rounded-full border border-white/10 bg-white/7 px-3 py-1"
                key={highlight}
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-enter landing-preview relative">
          <div className="rounded-2xl border border-white/12 bg-white/10 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 text-slate-950 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                    Draft
                  </p>
                  <h2 className="mt-1 text-sm font-semibold">
                    Client Proposal
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Saved locally
                </span>
              </div>
              <div className="space-y-4 p-7">
                <div className="h-7 w-4/5 rounded bg-slate-900" />
                <div className="space-y-2">
                  <div className="h-3 rounded bg-slate-300" />
                  <div className="h-3 w-11/12 rounded bg-slate-300" />
                  <div className="h-3 w-8/12 rounded bg-slate-300" />
                </div>
                <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                  <div className="h-3 w-1/3 rounded bg-cyan-500" />
                  <div className="mt-3 space-y-2">
                    <div className="h-2 rounded bg-cyan-200" />
                    <div className="h-2 w-10/12 rounded bg-cyan-200" />
                  </div>
                </div>
                <div className="ml-auto space-y-2 text-right" dir="rtl">
                  <div className="mr-auto h-4 w-2/3 rounded bg-slate-800" />
                  <div className="mr-auto h-3 w-4/5 rounded bg-slate-300" />
                  <div className="mr-auto h-3 w-3/5 rounded bg-slate-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
