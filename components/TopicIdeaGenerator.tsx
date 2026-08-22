"use client";

import { useState } from "react";
import { IDEA_CATEGORIES, generateIdea, type Category } from "@/lib/ideaBank";

const CATEGORIES = Object.keys(IDEA_CATEGORIES) as Category[];

export function TopicIdeaGenerator() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function draw() {
    setIdeas((prev) => [generateIdea(category), ...prev].slice(0, 5));
  }

  async function copy(idea: string, index: number) {
    try {
      await navigator.clipboard.writeText(idea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    } catch {
      // 클립보드 접근 불가 — 조용히 무시
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
                className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent"
              >
                {copiedIndex === i ? "복사됨" : "복사"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
