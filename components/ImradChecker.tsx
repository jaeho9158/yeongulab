"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

type SectionKey = "intro" | "method" | "result" | "discussion";

const SECTION_PATTERNS: Record<SectionKey, { label: string; re: RegExp }> = {
  intro: { label: "서론", re: /(서론|introduction)/i },
  method: { label: "방법", re: /(방법|methods?)/i },
  result: { label: "결과", re: /(결과|results?)/i },
  discussion: { label: "논의", re: /(논의|discussion)/i },
};

const INTERPRETIVE_WORDS = [
  "때문이다",
  "의미한다",
  "시사한다",
  "보여준다",
  "판단된다",
];

function splitBySections(text: string) {
  const markers: { key: SectionKey; index: number }[] = [];
  for (const key of Object.keys(SECTION_PATTERNS) as SectionKey[]) {
    const m = SECTION_PATTERNS[key].re.exec(text);
    if (m) markers.push({ key, index: m.index });
  }
  markers.sort((a, b) => a.index - b.index);

  const sections: Partial<Record<SectionKey, string>> = {};
  markers.forEach((m, i) => {
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
    sections[m.key] = text.slice(m.index, end);
  });
  return sections;
}

export function ImradChecker() {
  const [text, setText] = usePersistentState("imrad-draft", "");
  const [checked, setChecked] = useState(false);

  const sections = checked ? splitBySections(text) : {};
  const foundKeys = Object.keys(sections) as SectionKey[];

  const hasPurposeStatement = /(목적|규명|검증)/.test(sections.intro ?? "");
  const resultHasInterpretation = INTERPRETIVE_WORDS.some((w) =>
    (sections.result ?? "").includes(w),
  );

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">IMRaD 구조 점검</h2>
      <p className="mt-1 text-sm text-ink-soft">
        초록이나 전체 초고를 붙여넣으면 섹션 구조를 규칙 기반으로
        훑어봅니다. AI가 읽고 판단하는 게 아니라 키워드 패턴만 보는
        참고용 체크입니다 — 정답이 아니라 놓친 게 있는지 확인용으로
        쓰세요.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setChecked(false);
        }}
        placeholder="서론, 방법, 결과, 논의를 포함한 초고를 붙여넣어보세요."
        rows={8}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />

      <button
        type="button"
        onClick={() => setChecked(true)}
        disabled={!text.trim()}
        className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-50"
      >
        구조 점검하기
      </button>

      <div aria-live="polite">
        {checked && (
          <div className="mt-4 space-y-2 rounded-lg bg-surface px-4 py-3 text-sm">
            {(Object.keys(SECTION_PATTERNS) as SectionKey[]).map((key) => (
              <p key={key} className="text-ink">
                {foundKeys.includes(key) ? "✓" : "✗"}{" "}
                {SECTION_PATTERNS[key].label} 섹션{" "}
                {foundKeys.includes(key) ? "발견" : "못 찾음"}
              </p>
            ))}
            {foundKeys.includes("intro") && (
              <p className="text-ink-soft">
                {hasPurposeStatement
                  ? "✓ 서론에서 목적을 나타내는 표현(목적/규명/검증)이 보입니다."
                  : "✗ 서론에서 \"목적/규명/검증\" 같은 표현이 안 보입니다 — 왜 이 연구를 했는지 명시적으로 썼는지 확인해보세요."}
              </p>
            )}
            {foundKeys.includes("result") && (
              <p className="text-ink-soft">
                {resultHasInterpretation
                  ? "⚠ 결과 섹션에 해석성 표현(때문이다/의미한다 등)이 보입니다 — 논의 섹션으로 옮길 내용은 아닌지 확인해보세요."
                  : "✓ 결과 섹션에 해석성 표현이 눈에 띄지 않습니다."}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
