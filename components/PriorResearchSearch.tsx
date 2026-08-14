"use client";

import { useState } from "react";

type Paper = {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: { name: string }[];
  url: string | null;
};

export function PriorResearchSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [results, setResults] = useState<Paper[]>([]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setStatus("loading");
    try {
      const url = new URL("/api/search-papers", window.location.origin);
      url.searchParams.set("query", q);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.data ?? []);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">선행연구 검색해보기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Semantic Scholar 학술 검색 API로 키워드를 검색합니다. 계정 없이
        바로 써볼 수 있습니다.
      </p>
      <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: microplastic water treatment"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-50"
        >
          {status === "loading" ? "검색 중…" : "검색"}
        </button>
      </form>

      <p className="mt-2 text-xs text-ink-soft">
        영어 키워드로 검색할 때 결과가 훨씬 많이 나옵니다. (예: "미세플라스틱"
        보다 "microplastic")
      </p>

      {status === "error" && (
        <p className="mt-4 text-sm text-ink-soft">
          검색에 실패했습니다. 요청이 너무 많이 몰렸을 수 있으니 잠시 후 다시
          시도해보세요.
        </p>
      )}

      {status === "done" && results.length === 0 && (
        <p className="mt-4 text-sm text-ink-soft">
          검색 결과가 없습니다. 다른 키워드로 시도해보세요.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-3">
          {results.map((paper) => (
            <li
              key={paper.paperId}
              className="rounded-lg border border-line px-4 py-3"
            >
              <a
                href={paper.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink hover:text-accent hover:underline"
              >
                {paper.title}
              </a>
              <p className="mt-0.5 text-xs text-ink-soft">
                {paper.year ?? "연도 미상"} ·{" "}
                {paper.authors
                  .slice(0, 3)
                  .map((a) => a.name)
                  .join(", ") || "저자 미상"}
                {paper.authors.length > 3 ? " 외" : ""}
              </p>
              {paper.abstract && (
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                  {paper.abstract}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
