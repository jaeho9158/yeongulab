"use client";

import { useEffect, useState } from "react";
import { useSeededState } from "@/lib/useSeededState";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";
import Link from "next/link";

const STORAGE_KEY = "research-guide:disclosure";

const OPTIONS = [
  {
    key: "draft",
    label: "초안 작성 보조 (문장 구조·표현 제안)",
    discloseLabel: "초안 작성 보조",
  },
  {
    key: "translate",
    label: "번역 (외국어 자료 번역·요약)",
    discloseLabel: "번역",
  },
  { key: "grammar", label: "문법·맞춤법 교정", discloseLabel: "문법·맞춤법 교정" },
  {
    key: "analysis",
    label: "데이터 분석 코드 작성·디버깅",
    discloseLabel: "데이터 분석 코드 작성·디버깅",
  },
  {
    key: "brainstorm",
    label: "아이디어 브레인스토밍 보조",
    discloseLabel: "아이디어 브레인스토밍 보조",
  },
  {
    key: "statInterpret",
    label: "통계 분석 결과 해석 보조",
    discloseLabel: "통계 분석 결과 해석 보조",
  },
  {
    key: "citations",
    label: "참고문헌 형식 정리",
    discloseLabel: "참고문헌 형식 정리",
  },
  {
    key: "slides",
    label: "발표자료/슬라이드 구성 제안",
    discloseLabel: "발표자료·슬라이드 구성 제안",
  },
] as const;

/**
 * 04-research-ethics가 "해서는 안 되는 사용"으로 명시한 항목.
 * 막지는 않는다(사이트 기조가 게이트를 두지 않는 쪽이다) — 대신
 * 면책 문장에서 해당 조항을 빼고, 선택지 옆에 경고를 붙인다(U3).
 *
 * OPTIONS 바로 아래에 두는 이유: 새 선택지를 추가하는 사람이 이 표를
 * 잊으면 조용히 예전 동작(고정 면책 문장)으로 돌아간다.
 */
const CAUTION_KEYS: Record<string, string> = {
  brainstorm: "핵심 아이디어",
  statInterpret: "분석 결과 해석",
};

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
  const [copyFailed, setCopyFailed] = useState(false);
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

  // 문구에는 UI용 설명 괄호(label)가 아니라 discloseLabel을 쓴다 — label을
  // 그대로 쓰면 "초안 작성 보조 (문장 구조·표현 제안)(제한적으로 참고하였다)"처럼
  // 괄호가 연달아 붙어 투고 문서에 그대로 넣기 어색한 문장이 나왔다.
  const selected = OPTIONS.filter(
    (o) => usage[o.key] && usage[o.key] !== "none",
  ).map((o) => `${o.discloseLabel} (${usagePhrase(usage[o.key])})`);

  const today = hydrated ? new Date().toLocaleDateString("ko-KR") : "";

  function usedAtLevel(key: string): boolean {
    const lv = usage[key];
    return lv === "light" || lv === "heavy";
  }

  // 면책 문장을 선택 내용에 맞춰 조립한다. 예전에는 무엇을 고르든
  // "핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접 작성하였다"를
  // 고정으로 붙여서, 브레인스토밍·결과 해석을 체크한 학생의 문장이 한 문장
  // 안에서 앞뒤로 자기를 부정했다(U3).
  //
  // 항상 "…, 최종 결론은"으로 끝나므로 조사 처리가 필요 없다 — 순서를 바꾸지 마라.
  const claimedParts = [
    !usedAtLevel("brainstorm") && "연구의 핵심 아이디어",
    !usedAtLevel("statInterpret") && "분석 결과 해석",
    "최종 결론",
  ].filter((v): v is string => typeof v === "string");
  const disclaimer = `${claimedParts.join(", ")}은 저자가 직접 검토하고 작성하였다.`;

  const text =
    !hydrated || selected.length === 0
      ? ""
      : `본 연구는 작성 과정에서 AI 도구${toolName ? `(${toolName})` : ""}를 다음 범위에서 활용하였다: ${selected.join(", ")}. ${disclaimer} (작성일: ${today})`;

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
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 이전 클립보드 내용을 붙여넣는다
      setCopyFailed(true);
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">AI 활용 disclosure 문구 만들기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        AI를 어디에, 얼마나 썼는지 선택하면 투고용 문구를 만들어줍니다.
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
                aria-label={`${opt.label} 활용 정도`}
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
            {CAUTION_KEYS[opt.key] && usedAtLevel(opt.key) && (
              <p className="mt-1.5 text-xs leading-relaxed text-danger">
                이 항목은{" "}
                <Link
                  href="/articles/research-ethics"
                  className="underline underline-offset-2"
                >
                  연구윤리와 AI 활용
                </Link>
                에서 &lsquo;해서는 안 되는 사용&rsquo;으로 정리한 것입니다.
                체크해도 문구는 만들어지지만, 아래 문장에서 &lsquo;
                {CAUTION_KEYS[opt.key]}은 저자가 직접 작성하였다&rsquo;는 부분이
                빠집니다.
              </p>
            )}
          </li>
        ))}
      </ul>

      {text && (
        <div aria-live="polite" className="mt-4 rounded-lg bg-surface px-4 py-3">
          <p className="text-sm text-ink">{text}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-2 text-xs text-ink-soft hover:text-ink"
          >
            {copied ? "복사됨" : "복사"}
          </button>
          <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
            {copyFailed && COPY_FAILED_MESSAGE}
          </p>
        </div>
      )}
    </section>
  );
}
