"use client";

import { useEffect, useState } from "react";
import { getStageDurations } from "@/lib/activity";
import { SectionHead } from "@/components/SectionHead";

type StageInfo = {
  order: number;
  slug: string;
  title: string;
  checklistCount: number;
};

type DurationInfo = { firstAt: string | null; lastAt: string | null; days: number | null };

// 2026-06-02 → 6.02 (모노 한 줄에 맞는 짧은 표기)
function formatDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}.${d}`;
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
    <section className="mt-10">
      <SectionHead title="단계별 실제 소요일수" meta="첫 활동 ~ 마지막 활동" />
      {!hasAny ? (
        <p className="border-b border-line py-5 text-sm text-ink-soft">
          아직 기록이 없어요.
        </p>
      ) : (
        <ul className="border-b border-line">
          {stages.map((stage) => {
            const info = durations[stage.slug];
            if (!info || info.days === null) return null;
            return (
              <li
                key={stage.slug}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-t border-line py-3.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
              >
                <span className="font-label text-xs text-ink-soft">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <span className="text-[15px] font-semibold text-ink">
                  {stage.title}
                </span>
                <span className="col-start-2 font-label text-xs text-ink-soft sm:col-start-auto">
                  {info.firstAt && formatDate(info.firstAt)} ~{" "}
                  {info.lastAt && formatDate(info.lastAt)} ·{" "}
                  <span className="text-ink">{info.days}일</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
