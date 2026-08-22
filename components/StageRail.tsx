"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklistCount: number;
};

function readDone(slug: string, expectedLength: number): number {
  try {
    const raw = window.localStorage.getItem(`research-guide:checklist:${slug}`);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as boolean[];
    if (!Array.isArray(saved) || saved.length !== expectedLength) return 0;
    return saved.filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * 단계 페이지 왼쪽 레일 — 6단계 목록(체크리스트 진행도 포함)과
 * 이 페이지 안에서 바로 가는 앵커. lg 미만에서는 숨긴다.
 */
export function StageRail({
  stages,
  currentSlug,
  toolCount,
}: {
  stages: StageInfo[];
  currentSlug: string;
  toolCount: number;
}) {
  const [done, setDone] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const s of stages) next[s.slug] = readDone(s.slug, s.checklistCount);
    setDone(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  const current = stages.find((s) => s.slug === currentSlug);
  const currentDone = current ? (done?.[current.slug] ?? 0) : 0;

  const sections = [
    { href: "#content", label: "이 단계에서 하는 일", meta: null },
    ...(toolCount > 0
      ? [{ href: "#tools", label: "도구", meta: String(toolCount) }]
      : []),
    {
      href: "#checklist",
      label: "체크리스트",
      meta: current ? `${currentDone}/${current.checklistCount}` : null,
    },
    { href: "#self-check", label: "자가검증 질문", meta: null },
  ];

  return (
    <aside className="sticky top-6 hidden lg:block">
      <p className="px-3 pb-2 font-label text-[11px] tracking-wider text-ink-soft">
        6단계
      </p>
      <ol className="space-y-0.5">
        {stages.map((s) => {
          const active = s.slug === currentSlug;
          const d = done?.[s.slug] ?? 0;
          const complete = d > 0 && d === s.checklistCount;
          return (
            <li key={s.slug}>
              <Link
                href={`/guide/${s.slug}`}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-surface font-semibold text-ink"
                    : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                <span className="w-5 font-label text-xs">
                  {String(s.order).padStart(2, "0")}
                </span>
                <span className="flex-1">{s.title}</span>
                {done && complete ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="완료"
                    className="text-accent"
                  >
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                ) : done && (d > 0 || active) ? (
                  <span className="font-label text-[11px] font-medium text-ink-soft">
                    {d}/{s.checklistCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 border-t border-line pt-5">
        <p className="px-3 pb-2 font-label text-[11px] tracking-wider text-ink-soft">
          이 페이지
        </p>
        <ul className="space-y-0.5">
          {sections.map((sec) => (
            <li key={sec.href}>
              <a
                href={sec.href}
                className="flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-[13px] text-ink-soft transition hover:border-accent hover:text-ink"
              >
                {sec.label}
                {sec.meta && (
                  <span className="font-label text-[11px]">{sec.meta}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
