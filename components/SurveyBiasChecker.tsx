"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

const LEADING_PATTERNS: { re: RegExp; hint: string }[] = [
  { re: /당연히/, hint: "\"당연히\" — 응답자에게 특정 답을 암시할 수 있습니다." },
  { re: /(않나요|않으세요|안\s*그런가요)\?/, hint: "부정 의문문 — \"~하지 않나요?\" 형태는 특정 답을 유도할 수 있습니다." },
  { re: /매우\s*(좋|훌륭|만족)/, hint: "긍정적 형용사가 질문에 미리 들어가 있으면 응답이 쏠릴 수 있습니다." },
  { re: /(반드시|꼭)\s*(필요|해야)/, hint: "\"반드시 필요하다\"는 전제를 질문에 깔고 있지 않은지 확인해보세요." },
  {
    // 이중질문: 질문 형태의 문장 안에 "그리고/및/또한"이 있거나, "A와/과 B(조사)"처럼
    // 서로 다른 두 대상을 나란히 묻는 경우. "친구와 함께", "~과 관련된", "A와 B 중" 같은
    // 동반·비교·선택 표현은 제외해 오탐을 줄인다.
    re: /^(?=.*(\?|나요|니까|세요|는가|은가|까요)\s*$).*(그리고|및|또한|[가-힣A-Za-z0-9]+[와과]\s+(?!함께|같이|비슷|다르|달리|관련|마찬가지|더불어|떨어져|친하|가깝|멀|상관|비교|대화|이야기|얘기|연락|약속|만남|갈등|싸움|사이)[가-힣A-Za-z0-9]+(\s[가-힣A-Za-z0-9]+)?(에|은|는|이|가|을|를|의|에게|에서|도|에는)\s)/,
    hint: "한 문항에 두 가지 이상을 동시에 묻고 있지 않은지 확인해보세요(이중질문).",
  },
];

const UNCAUGHT_BIASES = [
  "사회적 바람직성 — \"봉사활동을 자주 하나요?\"처럼 좋게 보이고 싶은 마음이 답을 바꾸는 문항",
  "불균형 척도 — 긍정 선택지는 3개, 부정 선택지는 1개처럼 한쪽으로 치우친 보기",
  "모호한 빈도어 — \"자주\", \"가끔\"은 사람마다 기준이 달라 숫자(주 1~2회 등)로 바꾸는 게 좋습니다",
  "전문용어 — 응답자가 모를 수 있는 용어는 풀어 쓰거나 예를 붙이세요",
  "문항 순서 효과 — 앞 문항이 뒤 문항의 답에 영향을 줄 수 있으니 순서를 바꿔 시험해보세요",
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
        placeholder={"우리 학교 급식이 당연히 맛있다고 생각하지 않으세요?\n하루에 몇 시간 정도 스마트폰을 사용하나요?"}
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

      <div className="mt-4 rounded-lg border border-line px-4 py-3">
        <p className="text-xs font-semibold text-ink">규칙으로 못 잡는 편향</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink-soft">
          {UNCAUGHT_BIASES.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
