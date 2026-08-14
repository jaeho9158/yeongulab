"use client";

import { useEffect, useState } from "react";

function storageKey(slug: string) {
  return `research-guide:reflection:${slug}`;
}

export function ReflectionBox({
  slug,
  questions,
}: {
  slug: string;
  questions: string[];
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(slug));
      if (raw) setText(raw);
    } catch {
      // 무시하고 빈 값으로 진행
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function handleChange(value: string) {
    setText(value);
    try {
      window.localStorage.setItem(storageKey(slug), value);
      setSaved(true);
    } catch {
      // 저장 실패해도 입력은 유지
    }
  }

  if (questions.length === 0) return null;

  return (
    <section className="note-box mt-6 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">자가검증 질문</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
      <label className="mt-4 block text-xs font-medium text-ink-soft">
        내 생각 적어보기 (선택)
      </label>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="여기에 답을 적어보면 다음 단계로 넘어갈 준비가 됐는지 스스로 확인할 수 있습니다."
        rows={4}
        className="mt-2 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
      />
      <p className="mt-1.5 text-xs text-ink-soft" suppressHydrationWarning>
        {saved ? "이 기기에 자동저장됨" : "이 기기의 브라우저에만 저장됩니다"}
      </p>
    </section>
  );
}
