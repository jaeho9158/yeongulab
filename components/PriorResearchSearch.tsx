"use client";

import { useState } from "react";
import { addReference } from "@/lib/citations";
import type { Paper, SearchSource } from "@/lib/paperSearch";

const CLIENT_TIMEOUT_MS = 10000;

type ErrorKind = "input" | "rate-limit" | "upstream" | "timeout" | "network";

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  input: "검색어를 확인해주세요. 너무 길거나 비어 있으면 검색할 수 없습니다.",
  "rate-limit":
    "지금은 검색 요청이 많이 몰려 있습니다. 잠시 후 다시 시도해보세요.",
  upstream:
    "외부 학술 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해보세요.",
  timeout:
    "응답이 너무 오래 걸려 검색을 중단했습니다. 키워드를 줄이거나 잠시 후 다시 시도해보세요.",
  network: "검색 서비스에 연결하지 못했습니다. 인터넷 연결을 확인해주세요.",
};

/** 예시 검색 칩 — 세 소스 모두에서 관련 결과가 잘 나오는 것을 확인한 키워드. */
const EXAMPLE_QUERIES = [
  "white noise short-term memory",
  "screen time sleep quality teenagers",
  "microplastic freshwater fish",
];

function classifyStatus(status: number): ErrorKind {
  if (status === 400) return "input";
  if (status === 429) return "rate-limit";
  return "upstream";
}

export function PriorResearchSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [errorKind, setErrorKind] = useState<ErrorKind>("network");
  const [results, setResults] = useState<Paper[]>([]);
  const [source, setSource] = useState<SearchSource | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  function save(paper: Paper) {
    addReference({
      authors: paper.authors.map((a) => a.name).join(", "),
      year: paper.year ? String(paper.year) : "",
      title: paper.title,
      source: paper.venue ?? "",
      url: paper.url ?? "",
    });
    window.dispatchEvent(new Event("research-guide:references-updated"));
    setSavedIds((prev) => ({ ...prev, [paper.paperId]: true }));
  }

  // 폼 제출과 예시 칩 클릭이 같은 경로를 쓴다 — 칩은 setQuery 직후 상태가
  // 아직 안 바뀐 시점이므로 검색어를 인자로 직접 받는다.
  async function runSearch(rawQuery: string) {
    const q = rawQuery.trim();
    if (!q) return;
    setStatus("loading");

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const url = new URL("/api/search-papers", window.location.origin);
      url.searchParams.set("query", q);
      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) {
        setErrorKind(classifyStatus(res.status));
        setStatus("error");
        return;
      }
      const data = await res.json();
      setResults(Array.isArray(data.data) ? data.data : []);
      setSource(
        data.source === "openalex" || data.source === "crossref"
          ? data.source
          : "semantic-scholar",
      );
      setStatus("done");
    } catch (err) {
      setErrorKind(
        err instanceof DOMException && err.name === "AbortError"
          ? "timeout"
          : "network",
      );
      setStatus("error");
    } finally {
      window.clearTimeout(timer);
    }
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">선행연구 검색해보기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Semantic Scholar 학술 검색 API로 키워드를 검색합니다(요청이 몰리면
        Crossref로 대신 검색). 계정 없이 바로 써볼 수 있습니다.
      </p>
      <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          required
          maxLength={200}
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
        영어 키워드로 검색할 때 결과가 훨씬 많이 나옵니다. (예:
        &ldquo;미세플라스틱&rdquo; 보다 &ldquo;microplastic&rdquo;)
      </p>

      {/* 첫 검색의 문턱을 낮추는 예시 칩 — 실제로 결과가 잘 나오는 걸 확인한
          키워드만 둔다. 첫 번째는 /example의 가상 연구와 같은 주제. */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ink-soft">이런 식으로:</span>
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={status === "loading"}
            onClick={() => {
              setQuery(example);
              void runSearch(example);
            }}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition hover:border-accent hover:text-ink disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-ink-soft" role="alert">
          {ERROR_MESSAGES[errorKind]}
        </p>
      )}

      {status === "done" && results.length === 0 && (
        <p className="mt-4 text-sm text-ink-soft">
          검색 결과가 없습니다. 다른 키워드로 시도해보세요.
        </p>
      )}

      {status === "done" && results.length > 0 && source !== "semantic-scholar" && (
        <p className="mt-4 text-xs text-ink-soft">
          {source === "crossref" ? "Crossref" : "OpenAlex"} 결과 — Semantic
          Scholar가 혼잡해 대신 검색했습니다.
          {source === "crossref" &&
            " 초록이 비어 있는 항목은 링크로 들어가 확인하세요."}
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
                {paper.venue ? ` · ${paper.venue}` : ""}
              </p>
              {paper.abstract && (
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                  {paper.abstract}
                </p>
              )}
              <button
                type="button"
                onClick={() => save(paper)}
                className="-mx-2 -mb-3 mt-2 flex min-h-11 items-center px-2 py-3 text-xs text-ink-soft hover:text-ink"
              >
                {savedIds[paper.paperId] ? "저장됨" : "내 레퍼런스에 저장"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
