"use client";

import { usePersistentState } from "@/lib/usePersistentState";

export function LengthChecker() {
  const [text, setText] = usePersistentState("length-checker", "");

  const withSpaces = text.length;
  const withoutSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">분량 체크기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        초록이나 본문을 붙여넣으면 글자수·단어수를 세줍니다. 대회·학술지마다
        규정이 다르니 정확한 제한은 투고 요강에서 직접 확인하세요.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="초록이나 본문을 붙여넣어보세요."
        rows={8}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />

      <div
        aria-live="polite"
        className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-surface px-4 py-3 text-sm sm:grid-cols-4"
      >
        <div>
          <p className="text-xs text-ink-soft">글자수(공백 포함)</p>
          <p className="mt-0.5 font-medium text-ink">
            {withSpaces.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">글자수(공백 제외)</p>
          <p className="mt-0.5 font-medium text-ink">
            {withoutSpaces.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">단어수</p>
          <p className="mt-0.5 font-medium text-ink">
            {words.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">문단수</p>
          <p className="mt-0.5 font-medium text-ink">{paragraphs}</p>
        </div>
      </div>
    </section>
  );
}
