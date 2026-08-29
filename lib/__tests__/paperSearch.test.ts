import { describe, it, expect } from "vitest";
import {
  buildAbstractsByDoi,
  fillMissingAbstracts,
  mapCrossref,
  mapOpenAlex,
  mapSemanticScholar,
  reconstructAbstract,
  type Paper,
} from "../paperSearch";

const paper = (over: Partial<Paper>): Paper => ({
  paperId: "10.1/x",
  title: "T",
  abstract: null,
  year: 2020,
  authors: [],
  url: null,
  venue: null,
  ...over,
});

describe("mapSemanticScholar", () => {
  it("정상 응답을 Paper로 정규화한다", () => {
    const out = mapSemanticScholar({
      data: [
        {
          paperId: "abc",
          title: " Title ",
          abstract: " A ",
          year: 2021,
          venue: "Nature",
          authors: [{ name: " Kim " }, { name: "" }],
          url: "https://x",
        },
      ],
    });
    expect(out).toEqual([
      {
        paperId: "abc",
        title: "Title",
        abstract: "A",
        year: 2021,
        authors: [{ name: "Kim" }],
        url: "https://x",
        venue: "Nature",
      },
    ]);
  });
  it("제목 없는 항목은 버린다 (경계)", () => {
    expect(mapSemanticScholar({ data: [{ title: "  " }] })).toEqual([]);
  });
  it("깨진 응답은 빈 배열 (실패)", () => {
    expect(mapSemanticScholar(null)).toEqual([]);
    expect(mapSemanticScholar({ data: "oops" })).toEqual([]);
  });
});

describe("mapCrossref", () => {
  it("JATS 초록을 벗겨내고 필드를 매핑한다", () => {
    const out = mapCrossref({
      message: {
        items: [
          {
            DOI: "10.1/a",
            title: ["Hello"],
            abstract: "<jats:p>Abstract Body text</jats:p>",
            issued: { "date-parts": [[2019, 5]] },
            author: [{ given: "J", family: "Doe" }],
            "container-title": ["J. Test"],
          },
        ],
      },
    });
    expect(out[0].paperId).toBe("10.1/a");
    expect(out[0].abstract).toBe("Body text");
    expect(out[0].year).toBe(2019);
    expect(out[0].authors).toEqual([{ name: "J Doe" }]);
    expect(out[0].url).toBe("https://doi.org/10.1/a");
    expect(out[0].venue).toBe("J. Test");
  });
  it("연도 누락은 null, 제목 없으면 항목 제외", () => {
    const out = mapCrossref({
      message: {
        items: [{ title: ["Ok"], issued: { "date-parts": [[null]] } }, { title: [] }],
      },
    });
    expect(out).toHaveLength(1);
    expect(out[0].year).toBeNull();
  });
  it("깨진 응답은 빈 배열", () => {
    expect(mapCrossref({})).toEqual([]);
  });
});

describe("reconstructAbstract / OpenAlex", () => {
  it("역색인을 문장으로 복원한다", () => {
    expect(reconstructAbstract({ world: [1], Hello: [0] })).toBe("Hello world");
  });
  it("빈·잘못된 입력은 null (실패)", () => {
    expect(reconstructAbstract(null)).toBeNull();
    expect(reconstructAbstract({})).toBeNull();
  });
  it("mapOpenAlex가 필드를 매핑한다", () => {
    const out = mapOpenAlex({
      results: [
        {
          id: "https://openalex.org/W1",
          doi: "https://doi.org/10.1/b",
          display_name: "Work",
          publication_year: 2018,
          authorships: [{ author: { display_name: "Lee" } }],
          primary_location: { source: { display_name: "Venue" } },
          abstract_inverted_index: { hi: [0] },
        },
      ],
    });
    expect(out[0]).toMatchObject({
      paperId: "W1",
      title: "Work",
      abstract: "hi",
      year: 2018,
      venue: "Venue",
    });
  });
});

describe("초록 보강 (fillMissingAbstracts)", () => {
  it("빈 초록만 DOI 매칭으로 채우고 기존 초록은 유지한다", () => {
    const byDoi = buildAbstractsByDoi({
      results: [
        { doi: "https://doi.org/10.1/X", abstract_inverted_index: { filled: [0] } },
      ],
    });
    const out = fillMissingAbstracts(
      [paper({ paperId: "10.1/x" }), paper({ paperId: "10.1/y", abstract: "keep" })],
      byDoi,
    );
    expect(out[0].abstract).toBe("filled"); // 대소문자 무시 매칭
    expect(out[1].abstract).toBe("keep");
  });
  it("표가 비면 원본 배열을 그대로 돌려준다 (경계)", () => {
    const papers = [paper({})];
    expect(fillMissingAbstracts(papers, new Map())).toBe(papers);
  });
});
