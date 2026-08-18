"use client";

import { useState } from "react";
import { QUESTION_BANK, type QuestionCategory } from "@/lib/questionBank";

const CATEGORIES = Object.keys(QUESTION_BANK) as QuestionCategory[];

export function PresentationQuestionBank() {
  const [category, setCategory] = useState<QuestionCategory>(CATEGORIES[0]);
  const [drawn, setDrawn] = useState<string[]>([]);

  function draw() {
    const pool = QUESTION_BANK[category];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setDrawn(shuffled.slice(0, 3));
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
      )}
    </section>
  );
}
