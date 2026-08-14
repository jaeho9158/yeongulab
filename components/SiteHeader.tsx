import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          연구랩 가이드
        </Link>
        <nav className="text-sm">
          <Link href="/guide" className="hover:underline">
            연구 가이드
          </Link>
        </nav>
      </div>
    </header>
  );
}
