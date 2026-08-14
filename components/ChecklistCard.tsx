"use client";

import { useEffect, useState } from "react";

function storageKey(slug: string) {
  return `research-guide:checklist:${slug}`;
}

export function ChecklistCard({
  slug,
  items,
}: {
  slug: string;
  items: string[];
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    Array(items.length).fill(false),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(slug));
      if (raw) {
        const saved = JSON.parse(raw) as boolean[];
        if (Array.isArray(saved) && saved.length === items.length) {
          setChecked(saved);
        }
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — 기본값으로 진행
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function toggle(index: number) {
    const next = checked.map((v, i) => (i === index ? !v : v));
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
    } catch {
      // 저장 실패해도 화면 상태는 유지
    }
  }

  if (items.length === 0) return null;

  const doneCount = checked.filter(Boolean).length;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">체크리스트</h2>
        <span
          className="text-xs text-ink-soft"
          suppressHydrationWarning
        >
          {hydrated ? `${doneCount} / ${items.length} 완료` : ""}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        이 기기의 브라우저에만 저장됩니다. 계정은 필요 없습니다.
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface">
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={() => toggle(i)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
              <span
                className={`text-sm leading-relaxed ${
                  checked[i] ? "text-ink-soft line-through" : "text-ink"
                }`}
              >
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
