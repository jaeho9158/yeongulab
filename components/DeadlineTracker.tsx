"use client";

import { useEffect, useState } from "react";

type Deadline = { id: string; name: string; date: string };

const STORAGE_KEY = "research-guide:deadlines";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function DeadlineTracker() {
  const [items, setItems] = useState<Deadline[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // 저장된 값이 없거나 접근 불가 — 빈 목록으로 시작
    }
    setHydrated(true);
  }, []);

  function persist(next: Deadline[]) {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장 실패해도 화면 상태는 유지
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) {
      setError("이름과 날짜를 모두 입력해주세요.");
      return;
    }
    const next = [
      ...items,
      { id: crypto.randomUUID(), name: name.trim(), date },
    ].sort((a, b) => a.date.localeCompare(b.date));
    persist(next);
    setName("");
    setDate("");
    setError(null);
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">마감일 트래커</h2>
      <p className="mt-1 text-sm text-ink-soft">
        지원하려는 대회·저널의 이름과 마감일을 직접 추가해두면 D-day로
        보여줍니다. 이 기기의 브라우저에만 저장됩니다.
      </p>

      <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="대회·저널 이름"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
        />
        <input
          type="date"
          value={date}
          aria-label="마감일"
          onChange={(e) => {
            setDate(e.target.value);
            setError(null);
          }}
          className="rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          추가
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {hydrated && items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const d = daysUntil(item.date);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink-soft">{item.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${d < 0 ? "text-ink-soft" : d <= 7 ? "text-accent" : "text-ink"}`}
                  >
                    {d === 0 ? "D-day" : d > 0 ? `D-${d}` : `${-d}일 지남`}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="-my-2.5 -mr-2 flex min-h-11 items-center px-2 py-2.5 text-xs text-ink-soft hover:text-ink"
                    aria-label={`${item.name} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
