"use client";

import { useState } from "react";

const OPTIONS = [
  { key: "draft", label: "초안 작성 보조 (문장 구조·표현 제안)" },
  { key: "translate", label: "번역 (외국어 자료 번역·요약)" },
  { key: "grammar", label: "문법·맞춤법 교정" },
  { key: "analysis", label: "데이터 분석 코드 작성·디버깅" },
  { key: "brainstorm", label: "아이디어 브레인스토밍 보조" },
] as const;

export function DisclosureGenerator() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [toolName, setToolName] = useState("");
  const [copied, setCopied] = useState(false);

  const selected = OPTIONS.filter((o) => checked[o.key]).map((o) => o.label);

  const text =
    selected.length === 0
      ? ""
      : `본 연구는 작성 과정에서 AI 도구${toolName ? `(${toolName})` : ""}를 다음 범위에서 활용하였다: ${selected.join(", ")}. 연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접 검토하고 작성하였다.`;

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">AI 활용 disclosure 문구 만들기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        어느 범위에서 AI를 썼는지 체크하면 투고용 문구를 조립해줍니다.
      </p>

      <div className="mt-4">
        <label className="text-xs font-medium text-ink-soft">
          사용한 도구 이름 (선택, 예: ChatGPT, Claude)
        </label>
        <input
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
        />
      </div>

      <ul className="mt-4 space-y-2">
        {OPTIONS.map((opt) => (
          <li key={opt.key}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface">
              <input
                type="checkbox"
                checked={checked[opt.key] ?? false}
                onChange={() => toggle(opt.key)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
              <span className="text-sm text-ink">{opt.label}</span>
            </label>
          </li>
        ))}
      </ul>

      {text && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3">
          <p className="text-sm text-ink">{text}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-2 text-xs text-ink-soft hover:text-ink"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      )}
    </section>
  );
}
