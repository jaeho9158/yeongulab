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

export type SearchSource = "semantic-scholar" | "openalex";

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
