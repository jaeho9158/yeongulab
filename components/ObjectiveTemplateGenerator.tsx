"use client";

import { useState } from "react";

const METHODS = [
  { value: "실험적으로", label: "실험적으로" },
  { value: "문헌적으로", label: "문헌적으로" },
  { value: "이론적으로", label: "이론적으로" },
  { value: "모델을 구현하여", label: "모델을 구현하여" },
];

export function ObjectiveTemplateGenerator() {
  const [what, setWhat] = useState("");
  const [condition, setCondition] = useState("");
  const [outcome, setOutcome] = useState("");
  const [method, setMethod] = useState(METHODS[0].value);
  const [copied, setCopied] = useState(false);

  const sentence =
    what || condition || outcome
      ? `본 연구는 ${what || "[무엇]"}이 ${condition || "[어떤 조건에서]"} ${
          outcome || "[어떤 결과나 변화]"
        }를 보이는지를 ${method} 규명하는 것을 목적으로 한다.`
      : "";

  async function copy() {
    if (!sentence) return;
    try {
      await navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시 — 사용자가 직접 드래그해서 복사 가능
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">목적 진술 만들어보기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        빈칸을 채우면 완성된 문장이 바로 아래에 나타납니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-soft">
            무엇이 (연구 대상)
          </label>
          <input
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="예: 특정 청각 자극"
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            어떤 조건에서
          </label>
          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="예: 20분간 청취했을 때"
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            어떤 결과나 변화
          </label>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="예: 뇌파 동조와 집중력 향상"
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">방법 유형</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-surface px-4 py-3">
        <p className="text-sm leading-relaxed text-ink">
          {sentence || "빈칸을 채우면 여기에 문장이 완성됩니다."}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={!sentence}
        className="mt-3 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink disabled:opacity-50"
      >
        {copied ? "복사됨" : "문장 복사하기"}
      </button>
    </section>
  );
}
