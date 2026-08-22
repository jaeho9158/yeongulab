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

export function ContinueCard({ stages }: { stages: StageInfo[] }) {
  const [state, setState] = useState<{
    doneItems: number;
    totalItems: number;
    nextStage: StageInfo | null;
  } | null>(null);

  useEffect(() => {
    const perStageDone = stages.map((s) => readDone(s.slug, s.checklistCount));
    const doneItems = perStageDone.reduce((a, b) => a + b, 0);
    const totalItems = stages.reduce((a, s) => a + s.checklistCount, 0);
    const nextIndex = stages.findIndex(
      (s, i) => perStageDone[i] < s.checklistCount,
    );
    setState({
      doneItems,
      totalItems,
      nextStage: nextIndex === -1 ? null : stages[nextIndex],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 아직 아무것도 체크 안 했거나(신규 방문자), localStorage를 못 읽으면 보여줄 게 없다.
  if (!state || state.doneItems === 0) return null;

  const percent =
    state.totalItems > 0 ? Math.round((state.doneItems / state.totalItems) * 100) : 0;

  return (
    <Link
      href={state.nextStage ? `/guide/${state.nextStage.slug}` : "/guide"}
      className="card mt-8 flex items-center justify-between gap-4 px-5 py-4 transition hover:border-accent"
    >
      <div>
        <p className="text-sm font-medium text-ink">
          이어서 진행하기 · {percent}% 완료
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">
          {state.nextStage
            ? `다음: ${state.nextStage.order}. ${state.nextStage.title}`
            : "6단계를 모두 체크했어요"}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-accent">계속하기 →</span>
    </Link>
  );
}
