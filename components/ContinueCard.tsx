"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDone } from "@/lib/checklist";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklist: string[];
};

export function ContinueCard({ stages }: { stages: StageInfo[] }) {
  const [state, setState] = useState<{
    doneItems: number;
    nextStage: StageInfo | null;
  } | null>(null);

  useEffect(() => {
    const perStageDone = stages.map((s) => countDone(s.slug, s.checklist));
    const doneItems = perStageDone.reduce((a, b) => a + b, 0);
    const nextIndex = stages.findIndex(
      (s, i) => perStageDone[i] < s.checklist.length,
    );
    setState({
      doneItems,
      nextStage: nextIndex === -1 ? null : stages[nextIndex],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 아직 아무것도 체크 안 했거나(신규 방문자), localStorage를 못 읽으면 보여줄 게 없다.
  if (!state || state.doneItems === 0) return null;

  return (
    <Link
      href={state.nextStage ? `/guide/${state.nextStage.slug}` : "/guide"}
      className="card mt-8 flex items-center justify-between gap-4 px-5 py-4 transition hover:border-accent"
    >
      <div>
        <p className="text-sm font-medium text-ink">이어서 진행하기</p>
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
