import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-rule-strong/60">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            연구랩
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-ink-soft">
            Lab Notebook
          </span>
        </Link>
        <nav className="font-label text-xs uppercase tracking-widest">
          <Link
            href="/guide"
            className="border-b border-dashed border-ink-soft pb-0.5 text-ink-soft hover:border-stamp hover:text-stamp"
          >
            연구 가이드
          </Link>
        </nav>
      </div>
    </header>
  );
}
