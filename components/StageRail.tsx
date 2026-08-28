"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";
// 타입만 가져온다 — lib/guide는 fs를 쓰므로 값으로 import하면 클라이언트에서 깨진다
import type { Heading } from "@/lib/guide";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklist: string[];
};

/**
 * 단계 페이지 왼쪽 레일 — 6단계 목록(체크리스트 진행도 포함)과
 * 이 페이지 안에서 바로 가는 목차. lg 미만에서는 숨긴다.
 */
export function StageRail({
  stages,
  currentSlug,
  headings,
  toolCount,
  selfCheckCount,
}: {
  stages: StageInfo[];
  currentSlug: string;
  headings: Heading[];
  toolCount: number;
  selfCheckCount: number;
}) {
  const [done, setDone] = useState<Record<string, number> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const sections = useMemo(
    () => [
      ...headings.map((h) => ({ href: `#${h.id}`, label: h.text, meta: null })),
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
    ],
    [headings, toolCount, selfCheckCount, current, currentDone],
  );

  // 스크롤 위치에 따라 현재 섹션을 표시한다. 화면 상단 근처에 들어온 것만
  // '보이는' 것으로 치고(rootMargin), 그중 문서 순서가 가장 앞선 것을 고른다.
  const ids = useMemo(
    () => sections.map((s) => s.href.slice(1)),
    [sections],
  );
  const idsKey = ids.join("|");

  useEffect(() => {
    const targets = idsKey
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const order = idsKey.split("|");
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        // 위로 스크롤해 아무것도 안 잡히는 구간에서는 직전 값을 유지한다
        if (first) setActiveId(first);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [idsKey]);

  return (
    // 목차가 길어지면(H2가 12개인 단계도 있다) 화면을 넘기므로 레일 안에서 스크롤한다
    <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto pr-1 lg:block">
      <h2 id="stage-rail-stages" className="px-3 pb-2 text-xs text-ink-soft">
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
          className="px-3 pb-2 text-xs text-ink-soft"
        >
          이 페이지
        </h2>
        <ul aria-labelledby="stage-rail-sections" className="space-y-0.5">
          {sections.map((sec) => {
            const active = activeId === sec.href.slice(1);
            return (
              <li key={sec.href}>
                <a
                  href={sec.href}
                  // 클릭 즉시 표시를 옮긴다 — 스크롤이 멎고 옵저버가 반응할
                  // 때까지 기다리면 눌러도 반응이 없는 것처럼 보인다
                  onClick={() => setActiveId(sec.href.slice(1))}
                  aria-current={active ? "location" : undefined}
                  className={`flex items-start gap-2 border-l-2 px-3 py-1.5 text-[13px] leading-snug transition ${
                    active
                      ? "border-accent font-medium text-ink"
                      : "border-transparent text-ink-soft hover:border-accent hover:text-ink"
                  }`}
                >
                  <span className="line-clamp-2">{sec.label}</span>
                  {sec.meta && (
                    <span className="shrink-0 font-label text-xs">
                      {sec.meta}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
