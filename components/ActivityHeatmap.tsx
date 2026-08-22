"use client";

import { useEffect, useState } from "react";
import { getActivityByDay } from "@/lib/activity";

const WEEKS = 12;
const DAYS_PER_WEEK = 7;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function levelFor(count: number): string {
  if (count <= 0) return "bg-surface";
  if (count === 1) return "bg-accent/30";
  if (count <= 3) return "bg-accent/60";
  return "bg-accent";
}

export function ActivityHeatmap() {
  const [hydrated, setHydrated] = useState(false);
  const [byDay, setByDay] = useState<Record<string, number>>({});

  useEffect(() => {
    setByDay(getActivityByDay());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = WEEKS * DAYS_PER_WEEK;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1) - today.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS + 1; w++) {
    const week: Date[] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">최근 12주간 활동</h2>
      <p className="mt-1 text-xs text-ink-soft">
        체크리스트 완료, 자가검증 기록 등을 날짜별로 담백하게 보여줍니다.
      </p>
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((date, di) => {
                const key = toDateKey(date);
                const isFuture = date.getTime() > today.getTime();
                const count = byDay[key] ?? 0;
                return (
                  <div
                    key={di}
                    title={isFuture ? undefined : `${key}: ${count}건`}
                    className={`h-3 w-3 rounded-sm ${
                      isFuture ? "bg-transparent" : levelFor(count)
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {WEEKDAY_LABELS[0]}부터 {WEEKDAY_LABELS[6]}까지, 왼쪽이 과거·오른쪽이 최근입니다.
      </p>
    </section>
  );
}
