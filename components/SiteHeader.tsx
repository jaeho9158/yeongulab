import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-[60rem] items-center justify-between px-4">
        <Link
          href="/"
          className="flex h-14 items-center gap-2 text-lg font-bold tracking-tight text-ink"
        >
          <svg
            viewBox="0 0 20 20"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="text-accent"
          >
            <path d="M4 3h12v14H4z" />
            <path d="M7 7h6M7 10h6M7 13h4" />
          </svg>
          연구랩
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <SiteNav />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
