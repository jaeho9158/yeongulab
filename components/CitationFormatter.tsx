"use client";

import { useState } from "react";
import { addReference, formatAPA, formatIEEE } from "@/lib/citations";

export function CitationFormatter() {
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [pages, setPages] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<"apa" | "ieee" | null>(null);
  const [saved, setSaved] = useState(false);

  const hasInput = Boolean(authors || title || source);
  const ref = { authors, year, title, source, volume, issue, pages, url };
  const apa = hasInput ? formatAPA(ref) : "";
  const ieee = hasInput ? formatIEEE(ref) : "";

  async function copy(text: string, which: "apa" | "ieee") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  }

  function saveToReferences() {
    if (!hasInput) return;
    addReference(ref);
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
          <label className="text-xs font-medium text-ink-soft">
            저자 (예: Kim, J. S., &amp; Lee, H.)
          </label>
          <input
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-ink-soft">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            학술지·출처명
          </label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">연도</label>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">권(vol)</label>
          <input
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">호(no)</label>
          <input
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">페이지</label>
          <input
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">URL (선택)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
      </div>

      {hasInput && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-soft">APA</p>
              <button
                type="button"
                onClick={() => copy(apa, "apa")}
                className="text-xs text-ink-soft hover:text-ink"
              >
                {copied === "apa" ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink">{apa}</p>
          </div>
          <div className="rounded-lg bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-soft">IEEE</p>
              <button
                type="button"
                onClick={() => copy(ieee, "ieee")}
                className="text-xs text-ink-soft hover:text-ink"
              >
                {copied === "ieee" ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink">{ieee}</p>
          </div>
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
