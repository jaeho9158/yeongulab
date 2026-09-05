"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
import { addReference, formatAPA, formatIEEE } from "@/lib/citations";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";

type CitationForm = {
  authors: string;
  year: string;
  title: string;
  source: string;
  volume: string;
  issue: string;
  pages: string;
  url: string;
};

const EMPTY_FORM: CitationForm = {
  authors: "",
  year: "",
  title: "",
  source: "",
  volume: "",
  issue: "",
  pages: "",
  url: "",
};

export function CitationFormatter() {
  const [form, setForm] = usePersistentState<CitationForm>(
    "citation-form",
    EMPTY_FORM,
  );
  const { authors, year, title, source, volume, issue, pages, url } = form;
  const [copied, setCopied] = useState<"apa" | "ieee" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField(field: keyof CitationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const hasInput = Boolean(authors || title || source);
  const ref = { authors, year, title, source, volume, issue, pages, url };
  const apa = hasInput ? formatAPA(ref) : "";
  const ieee = hasInput ? formatIEEE(ref) : "";

  async function copy(text: string, which: "apa" | "ieee") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // 인용 형식은 실패를 모른 채 붙여넣으면 엉뚱한 출처가 보고서에 들어간다
      setCopyFailed(true);
    }
  }

  function saveToReferences() {
    if (!hasInput) return;
    addReference(ref);
    window.dispatchEvent(new Event("research-guide:references-updated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">인용 형식 만들어보기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        논문 정보를 입력하면 APA·IEEE 형식으로 조립해줍니다. 저자명 표기
        방식은 자동 변환하지 않으니, 각 스타일 규칙대로 입력해주세요.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="citation-authors" className="text-xs font-medium text-ink-soft">
            저자 (예: Kim, J. S., &amp; Lee, H.)
          </label>
          <input
            id="citation-authors"
            value={authors}
            onChange={(e) => setField("authors", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="citation-title" className="text-xs font-medium text-ink-soft">제목</label>
          <input
            id="citation-title"
            value={title}
            onChange={(e) => setField("title", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-source" className="text-xs font-medium text-ink-soft">
            학술지·출처명
          </label>
          <input
            id="citation-source"
            value={source}
            onChange={(e) => setField("source", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-year" className="text-xs font-medium text-ink-soft">연도</label>
          <input
            id="citation-year"
            value={year}
            onChange={(e) => setField("year", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-volume" className="text-xs font-medium text-ink-soft">권(vol)</label>
          <input
            id="citation-volume"
            value={volume}
            onChange={(e) => setField("volume", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-issue" className="text-xs font-medium text-ink-soft">호(no)</label>
          <input
            id="citation-issue"
            value={issue}
            onChange={(e) => setField("issue", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-pages" className="text-xs font-medium text-ink-soft">페이지</label>
          <input
            id="citation-pages"
            value={pages}
            onChange={(e) => setField("pages", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="citation-url" className="text-xs font-medium text-ink-soft">URL (선택)</label>
          <input
            id="citation-url"
            value={url}
            onChange={(e) => setField("url", e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
      </div>

      {hasInput && (
        <div className="mt-4 space-y-3">
          <div aria-live="polite" className="rounded-lg bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-soft">APA</p>
              <button
                type="button"
                onClick={() => copy(apa, "apa")}
                className="-mx-1 -my-2 px-3 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {copied === "apa" ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink">{apa}</p>
          </div>
          <div aria-live="polite" className="rounded-lg bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-soft">IEEE</p>
              <button
                type="button"
                onClick={() => copy(ieee, "ieee")}
                className="-mx-1 -my-2 px-3 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {copied === "ieee" ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink">{ieee}</p>
          </div>
          <p aria-live="polite" className="text-xs text-ink-soft">
            {copyFailed && COPY_FAILED_MESSAGE}
          </p>
          <button
            type="button"
            onClick={saveToReferences}
            className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {saved ? "내 레퍼런스에 저장됨" : "내 레퍼런스에 저장"}
          </button>
        </div>
      )}
    </section>
  );
}
