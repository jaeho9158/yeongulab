"use client";

import { useMemo, useState } from "react";

const CHARS_PER_MINUTE = 320; // 한국어 발표 평균 속도 추정치 (참고용)

export function SpeechTimer() {
  const [text, setText] = useState("");

  const charCount = text.replace(/\s/g, "").length;
  const estimatedMinutes = charCount / CHARS_PER_MINUTE;

  const formatted = useMemo(() => {
    const totalSeconds = Math.round(estimatedMinutes * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}분 ${s.toString().padStart(2, "0")}초`;
  }, [estimatedMinutes]);

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">발표 시간 재보기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        발표 대본을 붙여넣으면 평균 말하기 속도(분당 약 {CHARS_PER_MINUTE}자)
        기준으로 예상 시간을 계산합니다. 실제 발표 속도는 사람마다 달라서
        참고용입니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="발표 대본을 붙여넣어보세요."
        rows={8}
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />

      <div className="mt-3 rounded-lg bg-surface px-4 py-3 text-sm">
        <p className="text-ink">
          공백 제외 {charCount.toLocaleString()}자 · 예상 발표 시간 약{" "}
          <strong>{formatted}</strong>
        </p>
      </div>
    </section>
  );
}
