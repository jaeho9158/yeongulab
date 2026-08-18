"use client";

import { useState } from "react";
import { IDEA_CATEGORIES, generateIdea, type Category } from "@/lib/ideaBank";

const CATEGORIES = Object.keys(IDEA_CATEGORIES) as Category[];

export function TopicIdeaGenerator() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [ideas, setIdeas] = useState<string[]>([]);

  function draw() {
    setIdeas((prev) => [generateIdea(category), ...prev].slice(0, 5));
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
              className="rounded-lg bg-surface px-4 py-2.5 text-sm text-ink"
            >
              {idea}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
