"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";
// 타입만 가져온다 — lib/guide는 fs를 쓰므로 값으로 import하면 클라이언트에서 깨진다
import type { Heading } from "@/lib/guide";

// 본문 앵커의 Tailwind scroll-mt-24(=96px)와 짝을 이루는 값이다.
// 앵커 클릭 시 제목이 96px 지점에 멈추므로, "그 기준선을 지났는가"는
// 4px 여유를 더한 100px로 판정한다. scroll-mt-24를 바꾸면 여기도 같이 바꿀 것
// (app/guide/[stage]/page.tsx, components/StageTools.tsx).
const ANCHOR_SCROLL_MARGIN_PX = 96;
const ACTIVE_BASELINE_PX = ANCHOR_SCROLL_MARGIN_PX + 4;

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
  relatedArticleCount,
}: {
  stages: StageInfo[];
  currentSlug: string;
  headings: Heading[];
  toolCount: number;
  selfCheckCount: number;
  relatedArticleCount: number;
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
      ...(relatedArticleCount > 0
        ? [
            {
              href: "#related-articles",
              label: "함께 읽기",
              meta: String(relatedArticleCount),
            },
          ]
        : []),
    ],
    [
      headings,
      toolCount,
      selfCheckCount,
      relatedArticleCount,
      current,
      currentDone,
    ],
  );

  // 스크롤 위치에 따라 현재 섹션을 표시한다.
  //
  // IntersectionObserver가 아니라 스크롤 위치 계산을 쓰는 이유: 제목은 한 줄
  // 높이라 빠른 휠 스크롤이나 앵커 점프에서 관찰 밴드를 '건너뛰면' 교차
  // 이벤트가 아예 안 와서 표시가 옛 값에 머문다(실브라우저에서 확인).
  // "기준선(96px = scroll-mt-24)을 지난 마지막 제목"을 매 스크롤마다 계산하면
  // 어떤 점프에서도 결정적으로 맞는다.
  //
  // rAF 스로틀은 일부러 안 쓴다: 스크롤 이벤트는 어차피 프레임당 한 번이고
  // 계산도 제목 십수 개 rect 조회뿐이라 싸다. 반면 rAF는 탭이 백그라운드면
  // 대기 상태로 멈춰서, 그 사이 일어난 프로그램적 스크롤이 반영되지 않는다.
  const ids = useMemo(
    () => sections.map((s) => s.href.slice(1)),
    [sections],
  );
  const idsKey = ids.join("|");

  useEffect(() => {
    const order = idsKey.split("|");

    function update() {
      let current: string | null = null;
      for (const id of order) {
        const el = document.getElementById(id);
        if (!el) continue;
        // 기준선을 지난 마지막 제목이 현재 섹션이다.
        if (el.getBoundingClientRect().top <= ACTIVE_BASELINE_PX) current = id;
        else break;
      }
      setActiveId(current ?? order[0] ?? null);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [idsKey]);

  return (
    // 목차가 길어지면(H2가 12개인 단계도 있다) 화면을 넘기므로 레일 안에서 스크롤한다
    <aside className="rail-scroll sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto pr-1 lg:block">
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
                // 레일이 overflow-y-auto라 좌우로도 클립돼, 바깥에 그리는 기본
                // 포커스 링(+2px)의 왼쪽이 잘린다. SiteNav와 같은 처리다.
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-offset-[-2px] ${
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
                  className={`flex items-start gap-2 border-l-2 px-3 py-1.5 text-[13px] leading-snug transition focus-visible:outline-offset-[-2px] ${
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
