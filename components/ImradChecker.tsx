"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

type SectionKey = "intro" | "method" | "result" | "discussion";
type OptionalKey = "abstract" | "references";

// 제목 줄만 인정한다: 줄 전체가 "(번호) 섹션명"뿐이어야 하고, 본문 속의
// "연구 방법은…" 같은 문장은 잡지 않는다. 앞의 "##", "2.", "Ⅱ." 등은 허용.
const HEADING_PREFIX = String.raw`^\s*(#+\s*)?((\d+|[IVXⅠ-Ⅻ]+)\s*[.)]?\s*)?`;
const HEADING_SUFFIX = String.raw`\s*:?\s*$`;
function heading(body: string): RegExp {
  return new RegExp(`${HEADING_PREFIX}(${body})${HEADING_SUFFIX}`, "i");
}

const SECTION_PATTERNS: Record<SectionKey, { label: string; re: RegExp }> = {
  intro: { label: "서론", re: heading(String.raw`서\s*론|introduction`) },
  method: {
    label: "방법",
    re: heading(
      String.raw`(연구\s*)?(방\s*법|대상\s*(및|과)\s*방법)|(materials?\s*(and|&)\s*)?methods?`,
    ),
  },
  result: {
    label: "결과",
    re: heading(String.raw`(연구\s*)?결\s*과|results?`),
  },
  discussion: {
    label: "논의",
    re: heading(String.raw`논\s*의|고\s*찰|discussion`),
  },
};

// "결과 및 논의"처럼 합쳐진 제목은 결과·논의 둘 다로 인정한다.
const COMBINED_RESULT_DISCUSSION = heading(
  String.raw`결과\s*(및|와|과)\s*(논의|고찰)|results?\s*(and|&)\s*discussion`,
);

const OPTIONAL_PATTERNS: Record<OptionalKey, { label: string; re: RegExp }> = {
  abstract: { label: "초록", re: heading(String.raw`초\s*록|요\s*약|abstract`) },
  references: {
    label: "참고문헌",
    re: heading(String.raw`참고\s*문헌|references?|bibliography`),
  },
};

const INTERPRETIVE_WORDS = [
  "때문이다",
  "의미한다",
  "시사한다",
  "판단된다",
];

function splitBySections(text: string) {
  const lines = text.split("\n");
  const markers: { key: SectionKey; index: number }[] = [];
  const found = new Set<SectionKey>();
  let offset = 0;
  for (const line of lines) {
    if (COMBINED_RESULT_DISCUSSION.test(line)) {
      for (const key of ["result", "discussion"] as const) {
        if (!found.has(key)) {
          found.add(key);
          markers.push({ key, index: offset });
        }
      }
    } else {
      for (const key of Object.keys(SECTION_PATTERNS) as SectionKey[]) {
        if (!found.has(key) && SECTION_PATTERNS[key].re.test(line)) {
          found.add(key);
          markers.push({ key, index: offset });
          break;
        }
      }
    }
    offset += line.length + 1;
  }
  markers.sort((a, b) => a.index - b.index);

  const sections: Partial<Record<SectionKey, string>> = {};
  markers.forEach((m, i) => {
    // 같은 줄에서 시작한 섹션(결과 및 논의)은 다음 '다른' 위치까지를 본문으로 본다
    let next = i + 1;
    while (next < markers.length && markers[next].index === m.index) next++;
    const end = next < markers.length ? markers[next].index : text.length;
    sections[m.key] = text.slice(m.index, end);
  });
  return sections;
}

function findOptionalSections(text: string): OptionalKey[] {
  const lines = text.split("\n");
  return (Object.keys(OPTIONAL_PATTERNS) as OptionalKey[]).filter((key) =>
    lines.some((line) => OPTIONAL_PATTERNS[key].re.test(line)),
  );
}

export function ImradChecker() {
  const [text, setText, saveError] = usePersistentState("imrad-draft", "");
  const [checked, setChecked] = useState(false);

  const sections = checked ? splitBySections(text) : {};
  const foundKeys = Object.keys(sections) as SectionKey[];
  const optionalFound = checked ? findOptionalSections(text) : [];

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
        aria-label="점검할 초고 붙여넣기"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setChecked(false);
        }}
        placeholder={"섹션 제목을 한 줄에 하나씩 쓴 초고를 붙여넣어보세요. 예)\n1. 서론\n…\n2. 연구 방법\n…\n3. 결과\n…\n4. 논의"}
        rows={8}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
      />
      <p aria-live="polite" className="mt-2 text-xs leading-relaxed text-danger">
        {saveError}
      </p>

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
            {foundKeys.length === 0 && (
              <p className="text-ink-soft">
                섹션 제목은 &ldquo;2. 연구 방법&rdquo;처럼 한 줄에 제목만 따로
                써야 인식됩니다. 본문 문장 속의 &ldquo;연구 방법은…&rdquo;은
                세지 않습니다.
              </p>
            )}
            {(Object.keys(OPTIONAL_PATTERNS) as OptionalKey[]).map((key) => (
              <p key={key} className="text-ink-soft">
                {optionalFound.includes(key)
                  ? `✓ ${OPTIONAL_PATTERNS[key].label} 섹션 발견 (선택 항목)`
                  : `ℹ ${OPTIONAL_PATTERNS[key].label} 섹션이 안 보입니다 — 필수는 아니지만, 투고처가 요구한다면 추가하세요.`}
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
