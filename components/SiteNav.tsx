"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/guide", label: "연구 가이드" },
  { href: "/example", label: "예시" },
  { href: "/activity", label: "활동 기록" },
] as const;

/** 헤더 내비게이션 — 현재 위치에 accent 밑줄을 그린다. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        // 정확히 그 페이지면 "page", 하위 경로(예: /guide/topic)면 "true"
        const exact = pathname === link.href;
        const ancestor = !exact && pathname.startsWith(`${link.href}/`);
        const active = exact || ancestor;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={exact ? "page" : ancestor ? "true" : undefined}
            className={`flex h-14 items-center border-b-2 px-3 transition ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
