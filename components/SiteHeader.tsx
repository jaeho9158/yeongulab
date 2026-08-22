import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="-my-2 flex items-center py-2 text-lg font-bold tracking-tight text-ink"
        >
          연구랩
        </Link>
        <nav className="flex items-center text-sm">
          <Link
            href="/guide"
            className="-my-3 -mr-1 flex items-center py-3 pr-1 pl-3 text-ink-soft hover:text-ink"
          >
            연구 가이드
          </Link>
          <Link
            href="/activity"
            className="-my-3 -mr-1 flex items-center py-3 pr-1 pl-3 text-ink-soft hover:text-ink"
          >
            활동 기록
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
