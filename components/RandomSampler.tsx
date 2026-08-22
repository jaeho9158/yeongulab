"use client";

import { useState } from "react";
import { shuffle } from "@/lib/shuffle";

export function RandomSampler() {
  const [text, setText] = useState("");
  const [count, setCount] = useState("5");
  const [picked, setPicked] = useState<string[] | null>(null);

  const items = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  function draw() {
    const n = Math.min(Number(count) || 0, items.length);
    if (n <= 0) {
      setPicked([]);
      return;
    }
    setPicked(shuffle(items).slice(0, n));
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">랜덤 표본 추첨기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        전체 명단(또는 번호)을 넣고 몇 명을 뽑을지 정하면 무작위로 추첨합니다.
        무작위 표집 실습이나 인터뷰 대상자 선정에 씁니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPicked(null);
        }}
        placeholder={"1반 1번\n1반 2번\n1반 3번\n..."}
        rows={5}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs font-medium text-ink-soft">
          뽑을 인원 수
        </label>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          min={1}
          className="w-20 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
        />
        <span className="text-xs text-ink-soft">/ 전체 {items.length}명</span>
        <button
          type="button"
          onClick={draw}
          disabled={items.length === 0}
          className="ml-auto rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-50"
        >
          추첨하기
        </button>
      </div>

      {picked && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3">
          {picked.length === 0 ? (
            <p className="text-sm text-ink-soft">뽑을 인원 수를 확인해주세요.</p>
          ) : (
            <p className="text-sm text-ink">{picked.join(", ")}</p>
          )}
        </div>
      )}
    </section>
  );
}
