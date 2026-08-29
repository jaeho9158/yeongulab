import {
  buildAbstractsByDoi,
  fillMissingAbstracts,
  mapCrossref,
  mapOpenAlex,
  mapSemanticScholar,
  type Paper,
  type SearchResponse,
} from "./paperSearch";

/**
 * 선행연구 검색의 3단 폴백 제어 흐름.
 *
 * route에서 분리한 이유: fetch 함수를 주입받는 순수 조합 함수로 두면
 * 폴백 순서·상태코드 분기(429/5xx는 폴백, 4xx는 그대로 전달)를
 * 네트워크 목킹 없이 단위 테스트할 수 있다. 각 단계를 왜 이 순서로
 * 두는지는 route.ts 상단 주석 참고.
 */

export type SearchFetchers = {
  semanticScholar: (query: string) => Promise<Response>;
  crossref: (query: string) => Promise<Response>;
  /** Crossref 결과 중 초록이 빈 항목을 채울 DOI 조회 (보강 실패는 무해) */
  openAlexByDois: (dois: string[]) => Promise<Response>;
  openAlex: (query: string) => Promise<Response>;
};

export type SearchChainResult =
  | { status: 200; body: SearchResponse }
  | { status: number; body: { error: string } };

export function shouldFallback(status: number): boolean {
  return status === 429 || status >= 500;
}

async function withOpenAlexAbstracts(
  papers: Paper[],
  fetchByDois: SearchFetchers["openAlexByDois"],
): Promise<Paper[]> {
  const missing = papers
    .filter((p) => !p.abstract && p.paperId.startsWith("10."))
    .map((p) => p.paperId);
  if (missing.length === 0) return papers;

  try {
    const res = await fetchByDois(missing);
    if (!res.ok) return papers;
    return fillMissingAbstracts(papers, buildAbstractsByDoi(await res.json()));
  } catch {
    return papers;
  }
}

export async function runSearchChain(
  query: string,
  fetchers: SearchFetchers,
): Promise<SearchChainResult> {
  // 1차: Semantic Scholar
  try {
    const res = await fetchers.semanticScholar(query);
    if (res.ok) {
      return {
        status: 200,
        body: { data: mapSemanticScholar(await res.json()), source: "semantic-scholar" },
      };
    }
    if (!shouldFallback(res.status)) {
      // 400대(잘못된 검색어 등)는 폴백해도 같은 결과이므로 그대로 전달
      return {
        status: res.status,
        body: { error: `검색 서비스가 요청을 거부했습니다. (${res.status})` },
      };
    }
  } catch {
    // 타임아웃·네트워크 오류 — 아래 폴백으로
  }

  // 2차: Crossref
  try {
    const res = await fetchers.crossref(query);
    if (res.ok) {
      const data = mapCrossref(await res.json());
      // Crossref가 0건이면 마지막으로 OpenAlex에 물어본다
      if (data.length > 0) {
        return {
          status: 200,
          body: {
            data: await withOpenAlexAbstracts(data, fetchers.openAlexByDois),
            source: "crossref",
          },
        };
      }
    }
  } catch {
    // 타임아웃·네트워크 오류 — 아래 폴백으로
  }

  // 3차: OpenAlex
  try {
    const res = await fetchers.openAlex(query);
    if (res.ok) {
      return {
        status: 200,
        body: { data: mapOpenAlex(await res.json()), source: "openalex" },
      };
    }
    if (res.status === 429) {
      return {
        status: 429,
        body: { error: "검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      };
    }
    return {
      status: 502,
      body: { error: `검색 서비스에 일시적인 문제가 있습니다. (${res.status})` },
    };
  } catch {
    return { status: 502, body: { error: "검색 서비스에 연결할 수 없습니다." } };
  }
}
