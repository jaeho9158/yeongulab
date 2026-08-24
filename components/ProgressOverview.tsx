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

type Progress = {
  done: number;
  total: number;
};

export function ProgressOverview({ stages }: { stages: StageInfo[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<Record<string, Progress>>({});

  useEffect(() => {
    function load() {
      const next: Record<string, Progress> = {};
      for (const stage of stages) {
        next[stage.slug] = {
          done: countDone(stage.slug, stage.checklist),
          total: stage.checklist.length,
        };
      }
      setProgress(next);
      setHydrated(true);
    }
    load();
    return subscribeChecklist(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItems = stages.reduce((sum, s) => sum + s.checklist.length, 0);
  const doneItems = stages.reduce(
    (sum, s) => sum + (progress[s.slug]?.done ?? 0),
    0,
  );
  const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const nextStage = stages.find((s) => {
    const p = progress[s.slug];
    return !p || p.done < p.total;
  });

  // 서버 렌더/첫 페인트에는 저장된 값을 알 수 없으므로 같은 높이의 빈 셸을 그린다
  // (null을 돌려주면 hydration 뒤 카드가 끼어들며 아래 내용이 밀린다).
  return (
    <section
      className="card px-5 py-4.5 sm:px-6"
      aria-hidden={!hydrated || undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-ink">전체 진행 상황</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {hydrated ? `${doneItems} / ${totalItems} 항목 완료 · ` : ""}이 기기
            기준
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/guide/print"
            className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink-soft transition hover:border-accent"
          >
            인쇄용으로 보기
          </Link>
          {hydrated ? (
            nextStage && (
              <Link
                href={`/guide/${nextStage.slug}`}
                className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-bg transition hover:opacity-85"
              >
                이어서 하기: {nextStage.title} →
              </Link>
            )
          ) : (
            // 버튼 자리를 미리 잡아 줄바꿈 높이가 바뀌지 않게 한다
            <span className="invisible rounded-lg px-3.5 py-2 text-[13px] font-medium">
              이어서 하기: {stages[0]?.title ?? ""} →
            </span>
          )}
        </div>
      </div>

      <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${hydrated ? percent : 0}%` }}
        />
      </div>
    </section>
  );
}
