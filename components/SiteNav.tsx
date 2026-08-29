"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLOSSARY } from "@/lib/site";

/**
 * 좁은 화면에서는 prefix를 감춰 "가이드"·"기록"으로 줄인다.
 * 375px 헤더는 로고까지 넣으면 가용폭(343px)을 이미 다 쓰고 있어서,
 * 항목을 하나 더 늘리려면 이 축약과 아래의 px-2가 함께 필요하다(실측).
 */
const LINKS = [
  { href: "/guide", prefix: "연구 ", label: "가이드" },
  { href: "/example", prefix: "", label: "예시" },
  { href: "/activity", prefix: "활동 ", label: "기록" },
] as const;

// 글자가 세로로 접히지 않게 nowrap — 넘칠 때는 헤더의 .nav-scroll이 받아준다.
// outline-offset을 음수로: nav가 overflow-x-auto라 overflow-y까지 auto로 계산돼
// 항목(h-14)과 클립 박스 높이가 같아지고, 바깥에 그리는 기본 포커스 링(+2px)이
// 위·아래로 잘린다. StageTools의 접이식 카드와 같은 처리다.
const ITEM_CLASS =
  "flex h-14 shrink-0 items-center border-b-2 px-2 whitespace-nowrap transition focus-visible:outline-offset-[-2px] sm:px-3";

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
            className={`${ITEM_CLASS} ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {link.prefix && (
              <span className="hidden sm:inline">{link.prefix}</span>
            )}
            {link.label}
          </Link>
        );
      })}

      {/* 논문용어사전 — 연구랩 밖의 별도 사이트라 새 창으로 연다 */}
      <a
        href={GLOSSARY.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${ITEM_CLASS} border-transparent text-ink-soft hover:text-ink`}
      >
        {GLOSSARY.navLabel}
        {/* 다른 사이트로 나간다는 시각 단서 — 좁은 폭에서도 보여준다 */}
        <span aria-hidden className="ml-1 text-[11px]">
          ↗
        </span>
        <span className="sr-only">(새 창에서 열림)</span>
      </a>
    </>
  );
}
