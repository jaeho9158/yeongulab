"use client";

import { useState } from "react";
import { IDEA_CATEGORIES, generateIdea, type Category } from "@/lib/ideaBank";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";

const CATEGORIES = Object.keys(IDEA_CATEGORIES) as Category[];

export function TopicIdeaGenerator() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  function draw() {
    setIdeas((prev) => [generateIdea(category), ...prev].slice(0, 5));
  }

  async function copy(idea: string, index: number) {
    try {
      await navigator.clipboard.writeText(idea);
      setCopyFailed(false);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 이전 클립보드 내용을 붙여넣는다
      setCopyFailed(true);
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">연구주제 아이디어 뽑기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        관심 분야를 고르고 뽑아보면 조합을 무작위로 던져줍니다. 실제
        정답이 아니라 생각을 틔우기 위한 브레인스토밍용 프롬프트입니다 —
        나온 조합을 그대로 쓰기보다 힌트로 삼아 다듬어보세요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
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
        아이디어 뽑기
      </button>

      {ideas.length > 0 && (
        <ul className="mt-4 space-y-2">
          {ideas.map((idea, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-ink"
            >
              <span>{idea}</span>
              <button
                type="button"
                onClick={() => copy(idea, i)}
                // 알약 크기가 약 24px이라 터치 타겟이 작다. 목록 행 안이라
                // 패딩을 키우면 행 높이가 크게 달라지므로, 보이지 않는
                // ::before로 히트 영역만 넓힌다(시각 크기는 그대로).
                className="relative shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition before:absolute before:-inset-2.5 before:content-[''] hover:border-accent"
              >
                {copiedIndex === i ? "복사됨" : "복사"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
      </p>
    </section>
  );
}
