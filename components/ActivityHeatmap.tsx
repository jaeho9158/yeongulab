"use client";

import { useEffect, useState } from "react";
import { getActivityByDay, toLocalDateKey } from "@/lib/activity";
import { SectionHead } from "@/components/SectionHead";

const WEEKS = 12;
const DAYS_PER_WEEK = 7;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 범례 스와치 — levelFor의 4단계와 같은 순서
const LEGEND_LEVELS = ["bg-surface", "bg-accent/30", "bg-accent/60", "bg-accent"];

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

  // 12주 전으로 간 뒤 그 주의 일요일까지 당겨서 첫 행이 항상 일요일이 되게 한다
  const totalDays = WEEKS * DAYS_PER_WEEK;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay());

  // 오늘까지만 렌더링 — 미래 날짜 칸은 만들지 않는다
  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= today.getTime()) {
    const week: Date[] = [];
    for (
      let d = 0;
      d < DAYS_PER_WEEK && cursor.getTime() <= today.getTime();
      d++
    ) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // 렌더링되는 기간 안의 총 활동 건수 (그리드 요약 레이블용)
  const totalCount = weeks
    .flat()
    .reduce((sum, date) => sum + (byDay[toLocalDateKey(date)] ?? 0), 0);

  return (
    <section className="mt-10">
      <SectionHead title="최근 12주간 활동" meta={`총 ${totalCount}건`} />
      <div className="border-b border-line py-5">
      <p className="sr-only">
        체크리스트 완료, 자가검증 기록 등을 날짜별로 담백하게 보여줍니다.
      </p>
      <div className="overflow-x-auto">
        <div
          // role="img"는 자식을 presentational로 취급해 칸별 라벨이 묻히므로 group을 쓴다
          role="group"
          aria-label={`최근 12주간 활동 히트맵, 총 ${totalCount}건`}
          className="flex gap-1"
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((date, di) => {
                const key = toLocalDateKey(date);
                const count = byDay[key] ?? 0;
                const label = `${date.getMonth() + 1}월 ${date.getDate()}일: ${count}건`;
                return (
                  <div
                    key={di}
                    title={`${key}: ${count}건`}
                    aria-label={count > 0 ? label : undefined}
                    aria-hidden={count === 0 ? true : undefined}
                    className={`h-3 w-3 rounded-sm ${levelFor(count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 font-label text-[11px] text-ink-soft">
        <p>
          {WEEKDAY_LABELS[0]}부터 {WEEKDAY_LABELS[6]}까지 · 왼쪽이 과거, 오른쪽이 최근
        </p>
        <div className="flex items-center gap-1.5">
          <span>적음</span>
          {LEGEND_LEVELS.map((cls) => (
            <span key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
          ))}
          <span>많음</span>
        </div>
      </div>
      </div>
    </section>
  );
}
