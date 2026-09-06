"use client";

import { useState } from "react";
import { shuffle } from "@/lib/shuffle";
import { usePersistentState } from "@/lib/usePersistentState";

export function RandomSampler() {
  const [form, setForm] = usePersistentState("random-sampler", {
    text: "",
    count: "5",
  });
  const { text, count } = form;
  const [picked, setPicked] = useState<string[] | null>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  // 결과와 함께 보여줄 안내. 뽑기 자체는 막지 않고 사실만 알린다.
  const [notice, setNotice] = useState<string | null>(null);

  const items = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 명단이든 인원 수든 입력이 바뀌면 화면의 결과는 더 이상 그 입력의 결과가 아니다.
  function invalidatePicked() {
    setPicked(null);
    setCopied("idle");
    setNotice(null);
  }

  function draw() {
    setCopied("idle");
    setNotice(null);
    const requested = Number(count);
    if (!Number.isFinite(requested) || requested <= 0) {
      setPicked([]);
      return;
    }
    // 소수 입력은 slice가 조용히 잘라낸다 — 반올림하고 그 사실을 알린다
    const rounded = Math.round(requested);
    const messages: string[] = [];
    if (rounded !== requested) {
      messages.push(`${requested}명은 ${rounded}명으로 반올림했습니다.`);
    }
    if (rounded === 0) {
      setPicked([]);
      return;
    }
    const n = Math.min(rounded, items.length);
    if (rounded > items.length) {
      // 여기가 L1의 본체 — 조용히 깎으면 전수조사가 무작위 표본처럼 보인다
      messages.push(
        `명단이 ${items.length}명이라 ${items.length}명 전원이 뽑혔습니다. 이건 표본이 아니라 전수입니다 — 보고서에 "무작위 표집"이라고 쓰면 안 됩니다.`,
      );
    }
    if (messages.length > 0) setNotice(messages.join(" "));
    setPicked(shuffle(items).slice(0, n));
  }

  async function copyPicked() {
    if (!picked || picked.length === 0) return;
    try {
      await navigator.clipboard.writeText(picked.join(", "));
      setCopied("done");
      setTimeout(() => setCopied("idle"), 1500);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 엉뚱한 내용을 붙여넣는다
      setCopied("failed");
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">랜덤 표본 추첨기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        전체 명단(또는 번호)을 넣고 몇 명을 뽑을지 정하면 무작위로 추첨합니다.
        무작위 표집 실습이나 인터뷰 대상자 선정에 씁니다.
      </p>

      <textarea
        aria-label="전체 명단 입력"
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setForm((prev) => ({ ...prev, text: next }));
          invalidatePicked();
        }}
        placeholder={"1반 1번\n1반 2번\n1반 3번\n..."}
        rows={5}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
      />

      <div className="mt-3 flex items-center gap-2">
        <label
          htmlFor="random-sampler-count"
          className="text-xs font-medium text-ink-soft"
        >
          뽑을 인원 수
        </label>
        <input
          id="random-sampler-count"
          type="number"
          value={count}
          onChange={(e) => {
            const next = e.target.value;
            setForm((prev) => ({ ...prev, count: next }));
            invalidatePicked();
          }}
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
        <div aria-live="polite" className="mt-4 rounded-lg bg-surface px-4 py-3">
          {picked.length === 0 ? (
            <p className="text-sm text-ink-soft">뽑을 인원 수를 확인해주세요.</p>
          ) : (
            <>
              {notice && (
                <p className="mb-2 text-xs font-medium text-danger">{notice}</p>
              )}
              <p className="text-sm text-ink">{picked.join(", ")}</p>
              <button
                type="button"
                onClick={copyPicked}
                className="mt-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent"
              >
                {copied === "done" ? "복사됨" : "결과 복사"}
              </button>
              {copied === "failed" && (
                <p className="mt-1.5 text-xs text-ink-soft">
                  복사하지 못했습니다. 위 내용을 직접 선택해 복사해주세요.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
