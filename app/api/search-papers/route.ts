import { NextRequest, NextResponse } from "next/server";

/**
 * Semantic Scholar 검색 프록시.
 *
 * 브라우저에서 api.semanticscholar.org를 직접 호출하면 CORS로 막힌다.
 * 이 라우트가 서버(Vercel Function)에서 대신 호출해 결과만 넘겨준다.
 * 계정·API 키 불필요 — Semantic Scholar 공개 API는 미인증 요청을 허용하되
 * 요청량이 몰리면 429를 준다(캐시 없이 그대로 클라이언트에 전달).
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "query가 필요합니다." }, { status: 400 });
  }

  const upstream = new URL(
    "https://api.semanticscholar.org/graph/v1/paper/search",
  );
  upstream.searchParams.set("query", query);
  upstream.searchParams.set("limit", "8");
  upstream.searchParams.set("fields", "title,abstract,year,authors,url");

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      // 검색 결과를 잠깐 캐시해 반복 검색 시 429를 덜 만나게 함
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "검색 서비스에 연결할 수 없습니다." },
      { status: 502 },
    );
  }
}
