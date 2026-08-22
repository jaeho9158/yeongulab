"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  description: string;
  checklistCount: number;
  toolCount: number;
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
 * 가이드 목록의 '차례' — 홈 하단과 같은 세리프 숫자·괘선 목록에
 * 오른쪽 열로 체크리스트 진행도(이 기기 기준)와 도구 개수를 붙인다.
 */
export function StageToc({ stages }: { stages: StageInfo[] }) {
  const [done, setDone] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const s of stages) next[s.slug] = readDone(s.slug, s.checklistCount);
    setDone(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ol className="border-b border-line">
      {stages.map((stage) => {
        const d = done?.[stage.slug] ?? 0;
        const complete = d > 0 && d === stage.checklistCount;
        return (
          <li key={stage.slug} className="border-t border-line">
            <Link
              href={`/guide/${stage.slug}`}
              className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] sm:gap-5"
            >
              <span className="font-serif text-[34px] leading-none font-medium text-ink">
                {String(stage.order).padStart(2, "0")}
              </span>
              <span className="block">
                <span className="block font-serif text-[19px] font-semibold text-ink transition group-hover:text-accent">
                  {stage.title}
                </span>
                <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                  {stage.description}
                </span>
              </span>
              <span
                className="col-start-2 flex gap-3 font-label text-xs text-ink-soft sm:col-start-auto sm:flex-col sm:items-end sm:gap-1 sm:pt-1.5 sm:text-right"
                suppressHydrationWarning
              >
                {done && complete ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-label="완료"
                    >
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                    {d}/{stage.checklistCount}
                  </span>
                ) : (
                  <span className={done && d > 0 ? "text-ink" : undefined}>
                    {done ? d : 0}/{stage.checklistCount}
                  </span>
                )}
                <span className="text-[11px]">도구 {stage.toolCount}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
