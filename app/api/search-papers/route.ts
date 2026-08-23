import { NextRequest, NextResponse } from "next/server";
import { SITE_CONTACT_EMAIL } from "@/lib/site";
import {
  mapOpenAlex,
  mapSemanticScholar,
  type SearchResponse,
} from "@/lib/paperSearch";

/**
 * 선행연구 검색 프록시.
 *
 * 브라우저에서 학술 API를 직접 호출하면 CORS로 막히므로 이 라우트가
 * 서버(Vercel Function)에서 대신 호출해 결과만 넘겨준다.
 *
 * 1차: Semantic Scholar. 미인증 풀은 Vercel 공용 IP에서 자주 429가 나므로
 *      SEMANTIC_SCHOLAR_API_KEY가 있으면 x-api-key로 보낸다.
 * 폴백: 429/5xx/타임아웃/네트워크 오류면 OpenAlex(키 불필요)로 같은 검색을
 *      다시 시도하고, 응답의 source 필드로 어느 쪽 결과인지 알린다.
 */
const MAX_QUERY_LENGTH = 200;
const UPSTREAM_TIMEOUT_MS = 8000;
const RESULT_LIMIT = 10;
const CACHE_SECONDS = 600;

const SUCCESS_HEADERS = {
  // 같은 검색어는 CDN에서 10분간 재사용 — 업스트림 429를 덜 만나게 함
  "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
};

async function fetchSemanticScholar(query: string): Promise<Response> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(RESULT_LIMIT));
  url.searchParams.set("fields", "title,abstract,year,authors,url,venue");

  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
  if (apiKey) headers["x-api-key"] = apiKey;

  return fetch(url, {
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
}

async function fetchOpenAlex(query: string): Promise<Response> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(RESULT_LIMIT));
  // polite pool — 연락처를 밝히면 더 안정적인 요청 한도를 받는다
  url.searchParams.set("mailto", SITE_CONTACT_EMAIL);

  return fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });
}

function shouldFallback(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "query가 필요합니다." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `검색어가 너무 깁니다. ${MAX_QUERY_LENGTH}자 이내로 줄여주세요.` },
      { status: 400 },
    );
  }

  // 1차: Semantic Scholar
  try {
    const res = await fetchSemanticScholar(query);
    if (res.ok) {
      const body: SearchResponse = {
        data: mapSemanticScholar(await res.json()),
        source: "semantic-scholar",
      };
      return NextResponse.json(body, { headers: SUCCESS_HEADERS });
    }
    if (!shouldFallback(res.status)) {
      // 400대(잘못된 검색어 등)는 폴백해도 같은 결과이므로 그대로 전달
      return NextResponse.json(
        { error: `검색 서비스가 요청을 거부했습니다. (${res.status})` },
        { status: res.status },
      );
    }
  } catch {
    // 타임아웃·네트워크 오류 — 아래 폴백으로
  }

  // 폴백: OpenAlex
  try {
    const res = await fetchOpenAlex(query);
    if (res.ok) {
      const body: SearchResponse = {
        data: mapOpenAlex(await res.json()),
        source: "openalex",
      };
      return NextResponse.json(body, { headers: SUCCESS_HEADERS });
    }
    if (res.status === 429) {
      return NextResponse.json(
        { error: "검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: `검색 서비스에 일시적인 문제가 있습니다. (${res.status})` },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: "검색 서비스에 연결할 수 없습니다." },
      { status: 502 },
    );
  }
}
