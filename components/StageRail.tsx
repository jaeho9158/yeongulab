"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklist: string[];
};

/**
 * 단계 페이지 왼쪽 레일 — 6단계 목록(체크리스트 진행도 포함)과
 * 이 페이지 안에서 바로 가는 앵커. lg 미만에서는 숨긴다.
 */
export function StageRail({
  stages,
  currentSlug,
  toolCount,
  selfCheckCount,
}: {
  stages: StageInfo[];
  currentSlug: string;
  toolCount: number;
  selfCheckCount: number;
}) {
  const [done, setDone] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    function load() {
      const next: Record<string, number> = {};
      for (const s of stages) next[s.slug] = countDone(s.slug, s.checklist);
      setDone(next);
    }
    load();
    // 같은 페이지에서 체크리스트를 누르면 바로 따라가도록 구독한다
    return subscribeChecklist(load);
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
      meta: current ? `${currentDone}/${current.checklist.length}` : null,
    },
    ...(selfCheckCount > 0
      ? [{ href: "#self-check", label: "자가검증 질문", meta: null }]
      : []),
  ];

  return (
    <aside className="sticky top-6 hidden lg:block">
      <h2
        id="stage-rail-stages"
        className="px-3 pb-2 font-label text-xs tracking-wider text-ink-soft"
      >
        6단계
      </h2>
      <ol aria-labelledby="stage-rail-stages" className="space-y-0.5">
        {stages.map((s) => {
          const active = s.slug === currentSlug;
          const d = done?.[s.slug] ?? 0;
          const total = s.checklist.length;
          const complete = d > 0 && d === total;
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
                    role="img"
                    aria-label="완료"
                    className="text-accent"
                  >
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                ) : done && (d > 0 || active) ? (
                  <span className="font-label text-xs font-medium text-ink-soft">
                    {d}/{total}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 border-t border-line pt-5">
        <h2
          id="stage-rail-sections"
          className="px-3 pb-2 font-label text-xs tracking-wider text-ink-soft"
        >
          이 페이지
        </h2>
        <ul aria-labelledby="stage-rail-sections" className="space-y-0.5">
          {sections.map((sec) => (
            <li key={sec.href}>
              <a
                href={sec.href}
                className="flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-[13px] text-ink-soft transition hover:border-accent hover:text-ink"
              >
                {sec.label}
                {sec.meta && (
                  <span className="font-label text-xs">{sec.meta}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
