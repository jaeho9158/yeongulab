"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

const LEADING_PATTERNS: { re: RegExp; hint: string }[] = [
  { re: /당연히/, hint: "\"당연히\" — 응답자에게 특정 답을 암시할 수 있습니다." },
  { re: /(않나요|않으세요|안\s*그런가요)\?/, hint: "부정 의문문 — \"~하지 않나요?\" 형태는 특정 답을 유도할 수 있습니다." },
  { re: /매우\s*(좋|훌륭|만족)/, hint: "긍정적 형용사가 질문에 미리 들어가 있으면 응답이 쏠릴 수 있습니다." },
  { re: /(반드시|꼭)\s*(필요|해야)/, hint: "\"반드시 필요하다\"는 전제를 질문에 깔고 있지 않은지 확인해보세요." },
  { re: /[^.]{0,20}(그리고|또한).{0,20}(그리고|또한)/, hint: "한 문항에 두 가지 이상을 동시에 묻고 있지 않은지 확인해보세요(이중질문)." },
];

export function SurveyBiasChecker() {
  const [text, setText] = usePersistentState("survey-bias", "");
  const [checked, setChecked] = useState(false);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const flagged = lines.map((line) => ({
    line,
    hints: LEADING_PATTERNS.filter((p) => p.re.test(line)).map((p) => p.hint),
  }));

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">설문 문항 편향 체크</h2>
      <p className="mt-1 text-sm text-ink-soft">
        설문 문항을 한 줄에 하나씩 붙여넣으면 유도성 표현이 있는지 규칙
        기반으로 훑어봅니다. 걸리지 않았다고 문제가 없다는 뜻은 아니니
        참고용으로만 쓰세요.
      </p>

      <textarea
        aria-label="설문 문항 입력 (한 줄에 하나씩)"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setChecked(false);
        }}
        placeholder={"이 제품이 당연히 좋다고 생각하지 않으세요?\n하루 몇 시간 정도 사용하시나요?"}
        rows={6}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />

      <button
        type="button"
        onClick={() => setChecked(true)}
        disabled={lines.length === 0}
        className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-50"
      >
        문항 점검하기
      </button>

      {checked && (
        <ul className="mt-4 space-y-2">
          {flagged.map((f, i) => (
            <li
              key={i}
              className={`rounded-lg px-4 py-2.5 text-sm ${
                f.hints.length > 0 ? "bg-surface" : "bg-surface/50"
              }`}
            >
              <p className="text-ink">{f.line}</p>
              {f.hints.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-xs text-ink-soft">
                  {f.hints.map((h, j) => (
                    <li key={j}>⚠ {h}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-ink-soft">
                  ✓ 눈에 띄는 유도성 표현이 없습니다.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
