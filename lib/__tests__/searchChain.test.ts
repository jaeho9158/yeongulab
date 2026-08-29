import { describe, it, expect } from "vitest";
import { runSearchChain, shouldFallback, type SearchFetchers } from "../searchChain";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const S2_OK = { data: [{ paperId: "s2", title: "S2 Paper" }] };
const CR_OK = {
  message: { items: [{ DOI: "10.1/a", title: ["CR Paper"] }] },
};
const OA_OK = { results: [{ id: "https://openalex.org/W1", display_name: "OA Paper" }] };

const never = () => {
  throw new Error("호출되면 안 되는 단계");
};

function fetchers(over: Partial<SearchFetchers>): SearchFetchers {
  return {
    semanticScholar: never,
    crossref: never,
    openAlexByDois: never,
    openAlex: never,
    ...over,
  };
}

describe("shouldFallback", () => {
  it("429와 5xx만 폴백한다", () => {
    expect(shouldFallback(429)).toBe(true);
    expect(shouldFallback(500)).toBe(true);
    expect(shouldFallback(503)).toBe(true);
    expect(shouldFallback(400)).toBe(false);
    expect(shouldFallback(404)).toBe(false);
  });
});

describe("runSearchChain", () => {
  it("1차 성공이면 뒤 단계를 건드리지 않는다 (정상)", async () => {
    const r = await runSearchChain("q", fetchers({ semanticScholar: async () => json(S2_OK) }));
    expect(r.status).toBe(200);
    if (!("data" in r.body)) throw new Error("성공 응답이어야 함");
    expect(r.body.source).toBe("semantic-scholar");
    expect(r.body.data[0].title).toBe("S2 Paper");
  });

  it("1차 4xx는 폴백 없이 그대로 전달한다 (경계)", async () => {
    const r = await runSearchChain(
      "q",
      fetchers({ semanticScholar: async () => json({}, 400) }),
    );
    expect(r.status).toBe(400);
    if ("data" in r.body) throw new Error("오류 응답이어야 함");
    expect(r.body.error).toContain("(400)");
  });

  it("1차 429 → 2차 Crossref로 폴백하고 초록을 보강한다", async () => {
    const r = await runSearchChain(
      "q",
      fetchers({
        semanticScholar: async () => json({}, 429),
        crossref: async () => json(CR_OK),
        openAlexByDois: async () =>
          json({
            results: [
              { doi: "https://doi.org/10.1/a", abstract_inverted_index: { filled: [0] } },
            ],
          }),
      }),
    );
    if (!("data" in r.body)) throw new Error("성공 응답이어야 함");
    expect(r.body.source).toBe("crossref");
    expect(r.body.data[0].abstract).toBe("filled");
  });

  it("초록 보강 실패는 무해 — Crossref 결과를 그대로 준다 (실패 격리)", async () => {
    const r = await runSearchChain(
      "q",
      fetchers({
        semanticScholar: async () => json({}, 500),
        crossref: async () => json(CR_OK),
        openAlexByDois: async () => {
          throw new Error("network");
        },
      }),
    );
    if (!("data" in r.body)) throw new Error("성공 응답이어야 함");
    expect(r.body.data[0].abstract).toBeNull();
  });

  it("1차 예외·2차 0건 → 3차 OpenAlex", async () => {
    const r = await runSearchChain(
      "q",
      fetchers({
        semanticScholar: async () => {
          throw new Error("timeout");
        },
        crossref: async () => json({ message: { items: [] } }),
        openAlex: async () => json(OA_OK),
      }),
    );
    if (!("data" in r.body)) throw new Error("성공 응답이어야 함");
    expect(r.body.source).toBe("openalex");
  });

  it("3차 429는 429로, 그 외 실패는 502로 (실패)", async () => {
    const base = {
      semanticScholar: async () => json({}, 500),
      crossref: async () => json({}, 500),
    };
    const r429 = await runSearchChain(
      "q",
      fetchers({ ...base, openAlex: async () => json({}, 429) }),
    );
    expect(r429.status).toBe(429);

    const r502 = await runSearchChain(
      "q",
      fetchers({
        ...base,
        openAlex: async () => {
          throw new Error("down");
        },
      }),
    );
    expect(r502.status).toBe(502);
  });
});
