/**
 * 선행연구 검색 결과를 클라이언트가 기대하는 한 가지 형태로 맞추는 매퍼.
 *
 * 1차 공급자는 Semantic Scholar, 429/5xx/네트워크 오류 시 OpenAlex로 폴백한다.
 * 두 API의 응답 형태가 다르므로 여기서 Paper 타입으로 정규화한다.
 */

export type Paper = {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: { name: string }[];
  url: string | null;
  /** 학술지·학회 이름 (없으면 null) */
  venue: string | null;
};

export type SearchSource = "semantic-scholar" | "crossref" | "openalex";

export type SearchResponse = {
  data: Paper[];
  source: SearchSource;
};

type SemanticScholarPaper = {
  paperId?: string | null;
  title?: string | null;
  abstract?: string | null;
  year?: number | null;
  venue?: string | null;
  authors?: { name?: string | null }[] | null;
  url?: string | null;
};

export function mapSemanticScholar(json: unknown): Paper[] {
  const data = (json as { data?: SemanticScholarPaper[] } | null)?.data;
  if (!Array.isArray(data)) return [];
  return data
    .filter((p) => p && typeof p.title === "string" && p.title.trim())
    .map((p, i) => ({
      paperId: p.paperId || `s2-${i}`,
      title: p.title!.trim(),
      abstract: p.abstract?.trim() || null,
      year: typeof p.year === "number" ? p.year : null,
      authors: (p.authors ?? [])
        .map((a) => ({ name: a?.name?.trim() ?? "" }))
        .filter((a) => a.name),
      url: p.url || null,
      venue: p.venue?.trim() || null,
    }));
}

type CrossrefItem = {
  DOI?: string | null;
  URL?: string | null;
  title?: string[] | null;
  abstract?: string | null;
  "container-title"?: string[] | null;
  issued?: { "date-parts"?: (number | null)[][] | null } | null;
  author?: { given?: string | null; family?: string | null; name?: string | null }[] | null;
};

/** Crossref 초록은 JATS XML로 온다 — 태그를 걷어내고 본문만 남긴다. */
function stripJats(xml: string | null | undefined): string | null {
  if (!xml) return null;
  const text = xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  // JATS는 보통 "Abstract"로 시작한다 — 중복 라벨은 떼어낸다
  return text.replace(/^abstract\s*/i, "").trim() || null;
}

export function mapCrossref(json: unknown): Paper[] {
  const items = (json as { message?: { items?: CrossrefItem[] } } | null)?.message
    ?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it, i) => {
      const title = it?.title?.find((t) => typeof t === "string" && t.trim())?.trim();
      if (!title) return null;
      // date-parts는 [[연, 월, 일]] 이고 연도가 null인 항목도 있다
      const year = it.issued?.["date-parts"]?.[0]?.[0];
      return {
        paperId: it.DOI || `cr-${i}`,
        title,
        abstract: stripJats(it.abstract),
        year: typeof year === "number" ? year : null,
        authors: (it.author ?? [])
          .map((a) => ({
            name: (
              a?.name ?? `${a?.given ?? ""} ${a?.family ?? ""}`
            ).replace(/\s+/g, " ").trim(),
          }))
          .filter((a) => a.name),
        url: it.URL || (it.DOI ? `https://doi.org/${it.DOI}` : null),
        venue:
          it["container-title"]?.find((c) => typeof c === "string" && c.trim())?.trim() ||
          null,
      } satisfies Paper;
    })
    .filter((p): p is Paper => p !== null);
}

type OpenAlexWork = {
  id?: string | null;
  doi?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  authorships?: { author?: { display_name?: string | null } | null }[] | null;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
};

/**
 * OpenAlex는 초록을 { 단어: [위치, ...] } 형태의 역색인으로 준다.
 * 위치 순으로 단어를 다시 늘어놓아 문장으로 복원한다.
 */
export function reconstructAbstract(
  index: Record<string, number[]> | null | undefined,
): string | null {
  if (!index || typeof index !== "object") return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      if (Number.isInteger(pos) && pos >= 0) words[pos] = word;
    }
  }
  const text = words.filter(Boolean).join(" ").trim();
  return text || null;
}

export function mapOpenAlex(json: unknown): Paper[] {
  const results = (json as { results?: OpenAlexWork[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  return results
    .filter((w) => w && typeof w.display_name === "string" && w.display_name.trim())
    .map((w, i) => ({
      paperId: w.id?.replace(/^https?:\/\/openalex\.org\//, "") || `oa-${i}`,
      title: w.display_name!.trim(),
      abstract: reconstructAbstract(w.abstract_inverted_index),
      year:
        typeof w.publication_year === "number" ? w.publication_year : null,
      authors: (w.authorships ?? [])
        .map((a) => ({ name: a?.author?.display_name?.trim() ?? "" }))
        .filter((a) => a.name),
      url: w.doi || w.primary_location?.landing_page_url || w.id || null,
      venue: w.primary_location?.source?.display_name?.trim() || null,
    }));
}
