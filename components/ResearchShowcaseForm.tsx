"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

/**
 * 연구 사례 공유 양식.
 *
 * 이 사이트에는 서버가 없고, 개인정보처리방침에 "입력값은 서버로 전송되지
 * 않는다"고 공개적으로 약속했다. 그래서 사례를 모으되 **사이트가 아무것도
 * 수집하지 않는** 방식으로 만든다 — 여기서는 정리된 텍스트를 만들어 주기만
 * 하고, 실제 전송은 사용자가 자기 메일로 직접 한다.
 *
 * 입력값은 usePersistentState로 이 브라우저에만 남는다("research-guide:tool:"
 * 프리픽스라 백업·전체삭제 대상에 자동으로 포함된다).
 */

const SCHOOL_LEVELS = ["중학생", "고등학생", "기타"] as const;
type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

type Draft = {
  schoolLevel: SchoolLevel;
  topic: string;
  question: string;
  method: string;
  finding: string;
  stuck: string;
  anonymous: boolean;
  nickname: string;
};

const EMPTY: Draft = {
  schoolLevel: "고등학생",
  topic: "",
  question: "",
  method: "",
  finding: "",
  stuck: "",
  anonymous: true,
  nickname: "",
};

// 메일 클라이언트마다 mailto 본문 길이 상한이 다르고, 넘치면 조용히 잘린다.
// 잘린 줄 모르고 보내는 게 최악이라 이 길이를 넘으면 복사 사용을 권한다.
const MAILTO_SAFE_LENGTH = 1500;

function buildText(d: Draft): string {
  const byline = d.anonymous || !d.nickname.trim() ? "익명" : d.nickname.trim();
  const lines = [
    "[연구랩 사례 공유]",
    "",
    `표기 이름: ${byline}`,
    `학교급: ${d.schoolLevel}`,
    "",
    `연구 주제: ${d.topic.trim()}`,
    `연구질문: ${d.question.trim()}`,
  ];
  if (d.method.trim()) lines.push("", "[어떻게 확인했나]", d.method.trim());
  if (d.finding.trim()) lines.push("", "[무엇을 알아냈나]", d.finding.trim());
  if (d.stuck.trim()) lines.push("", "[가장 막혔던 지점]", d.stuck.trim());
  return lines.join("\n");
}

export function ResearchShowcaseForm() {
  const [draft, setDraft] = usePersistentState<Draft>("showcase-draft", EMPTY);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setCopied("idle");
  }

  const ready = draft.topic.trim() !== "" && draft.question.trim() !== "";
  const text = ready ? buildText(draft) : "";
  const tooLongForMail = text.length > MAILTO_SAFE_LENGTH;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
      setTimeout(() => setCopied("idle"), 2000);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 빈 내용을 붙여넣는다
      setCopied("failed");
    }
  }

  const mailHref = `mailto:${SITE_CONTACT_EMAIL}?subject=${encodeURIComponent(
    "연구랩 사례 공유",
  )}&body=${encodeURIComponent(text)}`;

  const field =
    "mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent";
  const labelClass = "block text-xs font-medium text-ink-soft";

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">내 연구 사례 나누기</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        끝냈든 중간에 멈췄든, 해본 사람의 기록은 다음 사람에게 가장 쓸모가
        큽니다. 아래를 채우면 보내기 좋은 형태로 정리해 드립니다. 이 도구는
        아무것도 자동으로 전송하지 않습니다 — 직접 복사하거나 메일 앱을 열어
        보내야 합니다.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="showcase-level" className={labelClass}>
            학교급
          </label>
          <select
            id="showcase-level"
            value={draft.schoolLevel}
            onChange={(e) =>
              update("schoolLevel", e.target.value as SchoolLevel)
            }
            className={field}
          >
            {SCHOOL_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="showcase-topic" className={labelClass}>
            연구 주제 (필수)
          </label>
          <input
            id="showcase-topic"
            value={draft.topic}
            onChange={(e) => update("topic", e.target.value)}
            placeholder="예: 백색소음과 단어 암기"
            className={field}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="showcase-question" className={labelClass}>
          연구질문 (필수)
        </label>
        <input
          id="showcase-question"
          value={draft.question}
          onChange={(e) => update("question", e.target.value)}
          placeholder="예: 백색소음 환경은 단어 회상 점수를 낮추는가?"
          className={field}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="showcase-method" className={labelClass}>
          어떻게 확인했나
        </label>
        <textarea
          id="showcase-method"
          value={draft.method}
          onChange={(e) => update("method", e.target.value)}
          rows={3}
          placeholder="대상, 인원, 측정 방법을 한두 문장으로"
          className={`${field} resize-y`}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="showcase-finding" className={labelClass}>
          무엇을 알아냈나
        </label>
        <textarea
          id="showcase-finding"
          value={draft.finding}
          onChange={(e) => update("finding", e.target.value)}
          rows={3}
          placeholder="예상과 달랐다면 그것도 좋은 결과입니다"
          className={`${field} resize-y`}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="showcase-stuck" className={labelClass}>
          가장 막혔던 지점과 어떻게 넘었는지
        </label>
        <textarea
          id="showcase-stuck"
          value={draft.stuck}
          onChange={(e) => update("stuck", e.target.value)}
          rows={3}
          placeholder="이 부분이 다음 사람에게 가장 도움이 됩니다"
          className={`${field} resize-y`}
        />
      </div>

      <fieldset className="mt-5">
        <legend className={labelClass}>이름 표기</legend>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="showcase-byline"
              checked={draft.anonymous}
              onChange={() => update("anonymous", true)}
            />
            익명으로
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="showcase-byline"
              checked={!draft.anonymous}
              onChange={() => update("anonymous", false)}
            />
            닉네임으로
          </label>
          {!draft.anonymous && (
            <input
              aria-label="표기할 닉네임"
              value={draft.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              placeholder="닉네임"
              className="w-40 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
            />
          )}
        </div>
      </fieldset>

      <div className="mt-5 rounded-lg bg-surface px-4 py-3" aria-live="polite">
        {ready ? (
          <>
            <p className="text-xs font-medium text-ink-soft">보낼 내용</p>
            <pre className="mt-2 overflow-x-auto text-[13px] leading-[1.7] whitespace-pre-wrap text-ink">
              {text}
            </pre>
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            연구 주제와 연구질문을 채우면 보낼 내용이 여기에 만들어집니다.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          disabled={!ready}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-40"
        >
          복사하기
        </button>
        {!tooLongForMail && (
          <a
            href={ready ? mailHref : undefined}
            aria-disabled={!ready}
            className={`rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition ${
              ready
                ? "text-ink hover:border-accent hover:text-accent"
                : "pointer-events-none text-ink-soft opacity-40"
            }`}
          >
            메일로 보내기
          </a>
        )}
        <span aria-live="polite" className="text-xs text-ink-soft">
          {copied === "done" && "복사했습니다"}
          {copied === "failed" &&
            "복사하지 못했습니다. 위 내용을 직접 선택해 복사해주세요."}
        </span>
      </div>

      {tooLongForMail && (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          내용이 길어 메일 링크로는 잘릴 수 있습니다. 복사하기를 눌러 받은
          내용을 메일에 직접 붙여넣어 {SITE_CONTACT_EMAIL} 으로 보내주세요.
        </p>
      )}

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-soft">
        실명·학교명·연락처는 적지 마세요. 사이트에 실을 때는 미리 회신으로
        확인합니다. 여기 입력한 내용은 이 브라우저에도 임시로 저장되며,
        가이드 목록의 &lsquo;내 기록&rsquo;에서 전체 삭제할 수 있습니다.
      </p>
    </section>
  );
}
