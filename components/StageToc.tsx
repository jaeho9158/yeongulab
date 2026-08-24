"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  description: string;
  checklist: string[];
  toolCount: number;
};

/**
 * 가이드 목록의 '차례' — 홈 하단과 같은 세리프 숫자·괘선 목록에
 * 오른쪽 열로 체크리스트 진행도(이 기기 기준)와 도구 개수를 붙인다.
 */
export function StageToc({ stages }: { stages: StageInfo[] }) {
  const [done, setDone] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    function load() {
      const next: Record<string, number> = {};
      for (const s of stages) next[s.slug] = countDone(s.slug, s.checklist);
      setDone(next);
    }
    load();
    return subscribeChecklist(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ol className="border-b border-line">
      {stages.map((stage) => {
        const d = done?.[stage.slug] ?? 0;
        const total = stage.checklist.length;
        const complete = d > 0 && d === total;
        return (
          <li key={stage.slug} className="border-t border-line">
            <Link
              href={`/guide/${stage.slug}`}
              className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] sm:gap-5"
            >
              <span className="font-label text-2xl leading-none font-semibold text-ink">
                {String(stage.order).padStart(2, "0")}
              </span>
              <span className="block">
                <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                  {stage.title}
                </span>
                <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                  {stage.description}
                </span>
              </span>
              <span className="col-start-2 flex gap-3 text-xs text-ink-soft sm:col-start-auto sm:flex-col sm:items-end sm:gap-1 sm:pt-1.5 sm:text-right">
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
                      role="img"
                      aria-label="완료"
                    >
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                    {d}/{total}
                  </span>
                ) : (
                  <span className={done && d > 0 ? "text-ink" : undefined}>
                    {done ? d : 0}/{total}
                  </span>
                )}
                <span>도구 {stage.toolCount}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
