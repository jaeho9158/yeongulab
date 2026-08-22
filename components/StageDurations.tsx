"use client";

import { useEffect, useState } from "react";
import { getStageDurations } from "@/lib/activity";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklistCount: number;
};

type DurationInfo = { firstAt: string | null; lastAt: string | null; days: number | null };

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export function StageDurations({ stages }: { stages: StageInfo[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [durations, setDurations] = useState<Record<string, DurationInfo>>({});

  useEffect(() => {
    setDurations(getStageDurations(stages));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return null;

  const hasAny = stages.some((s) => durations[s.slug]?.days !== null && durations[s.slug]?.days !== undefined);

  return (
    <section className="card mt-6 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">단계별 실제 소요일수</h2>
      <p className="mt-1 text-xs text-ink-soft">
        각 단계에서 처음 활동한 날부터 마지막 활동한 날까지의 기록입니다.
      </p>
      {!hasAny ? (
        <p className="mt-4 text-sm text-ink-soft">아직 기록이 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {stages.map((stage) => {
            const info = durations[stage.slug];
            if (!info || info.days === null) return null;
            return (
              <li
                key={stage.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm"
              >
                <span className="text-ink">
                  {stage.order}. {stage.title}
                </span>
                <span className="text-ink-soft">
                  {info.firstAt && formatDate(info.firstAt)} ~{" "}
                  {info.lastAt && formatDate(info.lastAt)} · {info.days}일
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
