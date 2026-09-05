"use client";

import { useState } from "react";
import { QUESTION_BANK, type QuestionCategory } from "@/lib/questionBank";
import { shuffle } from "@/lib/shuffle";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";

const CATEGORIES = Object.keys(QUESTION_BANK) as QuestionCategory[];

export function PresentationQuestionBank() {
  const [category, setCategory] = useState<QuestionCategory>(CATEGORIES[0]);
  const [drawn, setDrawn] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function draw() {
    const pool = QUESTION_BANK[category];
    setDrawn(shuffle(pool).slice(0, 3));
    setCopied(false);
  }

  async function copyDrawn() {
    if (drawn.length === 0) return;
    try {
      await navigator.clipboard.writeText(drawn.join("\n"));
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 이전 클립보드 내용을 붙여넣는다
      setCopyFailed(true);
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">예상 질문 뽑기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        실제 대회 기출이 아니라, 발표·심사에서 자주 나오는 일반적인 질문
        유형입니다. 답을 미리 생각해보는 연습용으로 쓰세요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c);
              setDrawn([]);
            }}
            className={`rounded-full px-4 py-2 text-xs font-medium ${
              category === c
                ? "bg-ink text-bg"
                : "border border-line text-ink-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={draw}
        className="mt-4 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
      >
        질문 3개 뽑기
      </button>

      {drawn.length > 0 && (
        <>
          <ul className="mt-4 space-y-2">
            {drawn.map((q, i) => (
              <li
                key={i}
                className="rounded-lg bg-surface px-4 py-2.5 text-sm text-ink"
              >
                {q}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={copyDrawn}
            className="mt-3 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent"
          >
            {copied ? "복사됨" : "질문 복사"}
          </button>
          <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
            {copyFailed && COPY_FAILED_MESSAGE}
          </p>
        </>
      )}
    </section>
  );
}
