import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          연구랩
        </Link>
        <nav className="text-sm">
          <Link href="/guide" className="text-ink-soft hover:text-ink">
            연구 가이드
          </Link>
        </nav>
      </div>
    </header>
  );
}
