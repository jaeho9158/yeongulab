"use client";

import { useEffect, useState } from "react";
import { useSeededState } from "@/lib/useSeededState";

const STORAGE_KEY = "research-guide:disclosure";

const OPTIONS = [
  { key: "draft", label: "초안 작성 보조 (문장 구조·표현 제안)" },
  { key: "translate", label: "번역 (외국어 자료 번역·요약)" },
  { key: "grammar", label: "문법·맞춤법 교정" },
  { key: "analysis", label: "데이터 분석 코드 작성·디버깅" },
  { key: "brainstorm", label: "아이디어 브레인스토밍 보조" },
  { key: "statInterpret", label: "통계 분석 결과 해석 보조" },
  { key: "citations", label: "참고문헌 형식 정리" },
  { key: "slides", label: "발표자료/슬라이드 구성 제안" },
] as const;

type UsageLevel = "none" | "light" | "heavy";

const USAGE_LEVELS: { key: UsageLevel; label: string }[] = [
  { key: "none", label: "없음" },
  { key: "light", label: "경미 (제안을 참고만)" },
  { key: "heavy", label: "상당 (초안을 그대로 다수 활용)" },
];

function usagePhrase(level: UsageLevel): string {
  switch (level) {
    case "heavy":
      return "상당 부분 활용한 뒤 저자가 전면 수정하였다";
    case "light":
      return "제한적으로 참고하였다";
    default:
      return "";
  }
}

type SavedState = {
  usage: Record<string, UsageLevel>;
  toolName: string;
};

export function DisclosureGenerator() {
  const [seeded, setSeeded] = useSeededState<SavedState>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        if (saved && typeof saved === "object") {
          return {
            usage:
              saved.usage && typeof saved.usage === "object" ? saved.usage : {},
            toolName: typeof saved.toolName === "string" ? saved.toolName : "",
          };
        }
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — 기본값으로 진행
    }
    return { usage: {}, toolName: "" };
  });
  const [copied, setCopied] = useState(false);
  const hydrated = seeded !== null;
  const usage = seeded?.usage ?? {};
  const toolName = seeded?.toolName ?? "";

  function setToolName(value: string) {
    setSeeded((prev) => ({ usage: prev?.usage ?? {}, toolName: value }));
  }

  useEffect(() => {
    if (seeded === null) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch {
      // 저장 실패해도 화면 상태는 유지
    }
  }, [seeded]);

  const selected = OPTIONS.filter(
    (o) => usage[o.key] && usage[o.key] !== "none",
  ).map((o) => `${o.label}(${usagePhrase(usage[o.key])})`);

  const today = hydrated ? new Date().toLocaleDateString("ko-KR") : "";

  const text =
    !hydrated || selected.length === 0
      ? ""
      : `본 연구는 작성 과정에서 AI 도구${toolName ? `(${toolName})` : ""}를 다음 범위에서 활용하였다: ${selected.join(", ")}. 연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접 검토하고 작성하였다. (작성일: ${today})`;

  function setLevel(key: string, level: UsageLevel) {
    setSeeded((prev) => ({
      usage: { ...(prev?.usage ?? {}), [key]: level },
      toolName: prev?.toolName ?? "",
    }));
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
        어느 범위에서, 어느 정도로 AI를 썼는지 선택하면 투고용 문구를 조립해줍니다.
      </p>

      <div className="mt-4">
        <label
          htmlFor="disclosure-tool-name"
          className="text-xs font-medium text-ink-soft"
        >
          사용한 도구 이름 (선택, 예: ChatGPT, Claude)
        </label>
        <input
          id="disclosure-tool-name"
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
        />
      </div>

      <ul className="mt-4 space-y-3">
        {OPTIONS.map((opt) => (
          <li
            key={opt.key}
            className="rounded-lg px-2 py-2 hover:bg-surface"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-ink">{opt.label}</span>
              <select
                value={usage[opt.key] ?? "none"}
                onChange={(e) =>
                  setLevel(opt.key, e.target.value as UsageLevel)
                }
                className="w-full max-w-[220px] rounded-lg border border-line bg-bg px-2 py-1.5 text-xs text-ink focus:border-accent sm:w-auto"
              >
                {USAGE_LEVELS.map((lv) => (
                  <option key={lv.key} value={lv.key}>
                    {lv.label}
                  </option>
                ))}
              </select>
            </div>
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
