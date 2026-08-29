"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  estimatedWeeks: string;
  checklist: string[];
};

/**
 * 홈 히어로 아래 6단계 스트립.
 *
 * 진행 기록이 없으면(첫 방문) 1단계를 '여기서 시작' 표시로 채워둔다. 기록이
 * 있으면 끝낸 단계는 체크로, 지금 할 단계는 채운 배지로 바꿔서 표시가 실제
 * 상태와 어긋나지 않게 한다. 서버 렌더와 첫 클라이언트 렌더가 같아야 하므로
 * (done === null) 마운트 전에는 서버와 똑같이 1단계만 채워 그린다.
 */
export function StageStrip({ stages }: { stages: StageInfo[] }) {
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

  const isComplete = (s: StageInfo) => {
    const d = done?.[s.slug] ?? 0;
    return s.checklist.length > 0 && d === s.checklist.length;
  };
  // 아직 안 끝낸 첫 단계가 '지금 할 단계'. 기록이 없으면 1단계다.
  const currentSlug = (stages.find((s) => !isComplete(s)) ?? stages[0]).slug;

  return (
    <ol className="card relative mt-11 grid grid-cols-3 gap-y-6 px-5 py-4.5 sm:grid-cols-6 sm:gap-y-0">
      <span
        aria-hidden
        className="absolute top-[31px] right-5 left-5 hidden h-px bg-line sm:block"
      />
      {stages.map((stage) => {
        const complete = done ? isComplete(stage) : false;
        const current = done ? stage.slug === currentSlug : stage.order === 1;
        return (
          <li key={stage.slug} className="relative">
            <Link
              href={`/guide/${stage.slug}`}
              aria-current={current ? "step" : undefined}
              className="group block"
            >
              <span
                className={`flex h-6.5 w-6.5 items-center justify-center rounded-full border font-label text-[11px] font-semibold transition group-hover:border-accent ${
                  complete
                    ? "border-accent bg-accent text-accent-contrast"
                    : current
                      ? "border-ink bg-ink text-bg"
                      : "border-line bg-bg text-ink"
                }`}
              >
                {complete ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label={`${stage.title} 완료`}
                  >
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                ) : (
                  String(stage.order).padStart(2, "0")
                )}
              </span>
              <span className="mt-2.5 block text-[13px] font-semibold text-ink">
                {stage.title}
              </span>
              <span className="mt-1 block text-xs text-ink-soft">
                {stage.estimatedWeeks.replace(/\s*\(.*\)|\s*\+.*$/, "")}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
