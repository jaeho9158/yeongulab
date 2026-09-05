"use client";

import { useMemo, useState } from "react";
import {
  PHRASES,
  PHRASE_SECTIONS,
  SECTION_NOTES,
  type Phrase,
  type PhraseSection,
} from "@/lib/academicPhrases";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";
import { usePersistentState } from "@/lib/usePersistentState";

type Hit = Phrase & { section: PhraseSection };

function allPhrases(): Hit[] {
  return PHRASE_SECTIONS.flatMap((section) =>
    PHRASES[section].map((p) => ({ ...p, section })),
  );
}

export function AcademicPhrases() {
  const [form, setForm] = usePersistentState("academic-phrases", {
    section: "서론" as PhraseSection,
    query: "",
  });
  const { section, query } = form;
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0;

  // 검색 중에는 섹션을 넘어 전체에서 찾는다 — 어느 섹션에 있는지 모를 때가 많다
  const results = useMemo<Hit[]>(() => {
    if (!searching) {
      return PHRASES[section].map((p) => ({ ...p, section }));
    }
    return allPhrases().filter((p) =>
      `${p.en} ${p.ko} ${p.tag}`.toLowerCase().includes(trimmed),
    );
  }, [searching, trimmed, section]);

  async function copy(en: string) {
    try {
      await navigator.clipboard.writeText(en);
      setCopyFailed(false);
      setCopied(en);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 이전 클립보드 내용을 붙여넣는다
      setCopyFailed(true);
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">논문에 쓰는 영어 표현</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        영문 초록이나 영문 원고를 쓸 때 반복적으로 쓰이는 문형입니다.{" "}
        <code className="rounded bg-surface px-1 text-xs">___</code> 자리에 내
        연구 내용을 넣으세요. 이런 관용 문형은 그대로 써도 표절이 아니지만,
        내용이 담긴 문장을 남의 논문에서 통째로 가져오면 표절입니다.
      </p>

      <div className="mt-4">
        <label
          htmlFor="academic-phrases-search"
          className="text-xs font-medium text-ink-soft"
        >
          표현 검색 (한국어·영어 모두 가능)
        </label>
        <input
          id="academic-phrases-search"
          type="search"
          value={query}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, query: e.target.value }))
          }
          placeholder="예: 한계, limitation, 가설"
          className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
        />
      </div>

      {!searching && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {PHRASE_SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={section === s}
                onClick={() => setForm((prev) => ({ ...prev, section: s }))}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  section === s
                    ? "bg-ink text-bg"
                    : "bg-surface text-ink-soft hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
            {SECTION_NOTES[section]}
          </p>
        </>
      )}

      <p aria-live="polite" className="mt-4 text-xs text-ink-soft">
        {searching
          ? `"${query.trim()}" 검색 결과 ${results.length}개`
          : `${section} ${results.length}개`}
      </p>

      {results.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          검색 결과가 없습니다. 다른 낱말로 찾아보세요.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {results.map((p) => (
            <li key={`${p.section}-${p.en}`} className="rounded-lg bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft">
                  {p.tag}
                </span>
                {searching && (
                  <span className="text-[11px] text-ink-soft">{p.section}</span>
                )}
              </div>
              <p lang="en" className="mt-1.5 text-sm leading-relaxed text-ink">
                {p.en}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {p.ko}
              </p>
              <button
                type="button"
                onClick={() => copy(p.en)}
                className="-mb-2 mt-1 py-2 text-xs font-medium text-ink-soft transition hover:text-accent"
              >
                {copied === p.en ? "복사됨" : "영어 문장 복사"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="mt-3 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
      </p>
    </section>
  );
}
