"use client";

import { useState } from "react";

const ITEMS = [
  "이 질문의 답은 아직 정해져 있지 않다 (검색해도 딱 떨어지는 답이 안 나온다).",
  "답을 구하려면 내가 직접 비교·측정·설계해야 한다 (남이 낸 답을 옮겨적는 게 아니다).",
  "결과가 어떻게 나올지 지금은 확신할 수 없다.",
  "기존 자료들과는 다른 조합·조건·관점을 다루고 있다.",
];

export function ResearchQuestionQuiz() {
  const [checked, setChecked] = useState<boolean[]>(
    Array(ITEMS.length).fill(false),
  );
  const [revealed, setRevealed] = useState(false);

  const score = checked.filter(Boolean).length;

  function toggle(i: number) {
    setChecked(checked.map((v, idx) => (idx === i ? !v : v)));
    setRevealed(false);
  }

  function verdict() {
    if (score >= 3)
      return {
        label: "탐구형에 가깝습니다",
        detail:
          "이 정도면 스스로 검증·설계하는 탐구형 연구질문에 가깝습니다. 이 상태로 다음 단계(선행연구 조사)로 넘어가도 좋습니다.",
      };
    if (score === 2)
      return {
        label: "탐구형과 조사형 사이",
        detail:
          "조금만 더 구체화하면 탐구형이 될 수 있습니다. \"왜?\"를 한 번 더 물어보거나, 아직 답이 안 나온 세부 조건을 하나 추가해보세요.",
      };
    return {
      label: "아직 조사형에 가깝습니다",
      detail:
        "지금 상태로는 자료를 찾아 정리하는 조사에 머물 가능성이 높습니다. 위쪽 \"한 걸음 더 들어가는 세 가지 사고 습관\" 섹션을 다시 적용해보세요.",
    };
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">
        내 연구질문, 조사형일까 탐구형일까
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        지금 세운 연구질문을 떠올리면서 해당하는 항목을 체크해보세요.
      </p>

      <ul className="mt-4 space-y-2">
        {ITEMS.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
              <span className="text-sm text-ink">{item}</span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
      >
        결과 보기
      </button>

      {revealed && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
          <p className="font-medium text-ink">
            {score} / {ITEMS.length} · {verdict().label}
          </p>
          <p className="mt-1.5 text-ink-soft">{verdict().detail}</p>
        </div>
      )}
    </section>
  );
}
