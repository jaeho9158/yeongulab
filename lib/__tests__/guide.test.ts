import { describe, it, expect } from "vitest";
import { extractHeadings, makeSlugger } from "../guide";

describe("makeSlugger", () => {
  it("한글·영문 제목을 슬러그로 만든다", () => {
    const slug = makeSlugger();
    expect(slug("이 단계에서 하는 일")).toBe("이-단계에서-하는-일");
    expect(slug("Data & Methods!")).toBe("data-methods");
  });
  it("중복 제목에는 번호를 붙인다 (경계)", () => {
    const slug = makeSlugger();
    expect(slug("정리")).toBe("정리");
    expect(slug("정리")).toBe("정리-2");
    expect(slug("정리")).toBe("정리-3");
  });
  it("기호만 있는 제목은 'section' 폴백 (실패)", () => {
    expect(makeSlugger()("???")).toBe("section");
  });
});

describe("extractHeadings", () => {
  it("H2만 순서대로 뽑는다 (H3·본문 제외)", () => {
    const md = "# 제목\n\n## 첫 절\n본문\n### 소절\n## 둘째 절\n";
    expect(extractHeadings(md)).toEqual([
      { id: "첫-절", text: "첫 절" },
      { id: "둘째-절", text: "둘째 절" },
    ]);
  });
  it("코드펜스 안의 '## '는 제목이 아니다 (경계)", () => {
    const md = "## 진짜\n```\n## 가짜\n```\n## 진짜2\n";
    expect(extractHeadings(md).map((h) => h.text)).toEqual(["진짜", "진짜2"]);
  });
  it("빈 문서는 빈 배열 (실패)", () => {
    expect(extractHeadings("")).toEqual([]);
  });
});
