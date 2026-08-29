import { describe, it, expect } from "vitest";
import { formatAPA, formatIEEE } from "../citations";

const base = {
  authors: "Kim, J.",
  year: "2020",
  title: "A Study",
  source: "Journal of Tests",
  volume: "12",
  issue: "3",
  pages: "1-10",
  url: "https://doi.org/10.1/x",
};

describe("formatAPA", () => {
  it("전체 필드를 APA 형식으로 조합한다", () => {
    expect(formatAPA(base)).toBe(
      "Kim, J. (2020). A Study. Journal of Tests, 12(3), 1-10. https://doi.org/10.1/x",
    );
  });
  it("제목이 마침표로 끝나면 겹치지 않는다 (경계 — 'Study..' 방지)", () => {
    expect(formatAPA({ ...base, title: "A Study." })).toContain("A Study. Journal");
    expect(formatAPA({ ...base, title: "A Study." })).not.toContain("..");
  });
  it("연도 없으면 (n.d.), 선택 필드 없어도 동작 (실패/누락)", () => {
    const out = formatAPA({ authors: "", year: "", title: "T", source: "", url: "" });
    expect(out).toBe("(n.d.). T. ");
  });
});

describe("formatAPA 부분 필드 조합", () => {
  it("volume만: 괄호 없이 권만", () => {
    expect(formatAPA({ ...base, issue: undefined })).toContain("Journal of Tests, 12, 1-10.");
  });
  it("issue만: 저널명에 바로 붙지 않고 쉼표+괄호 (경계)", () => {
    expect(formatAPA({ ...base, volume: undefined })).toContain("Journal of Tests, (3), 1-10.");
  });
  it("pages만: 권·호 없이 쪽수만", () => {
    expect(formatAPA({ ...base, volume: undefined, issue: undefined })).toContain(
      "Journal of Tests, 1-10.",
    );
  });
});

describe("formatIEEE", () => {
  it("전체 필드를 IEEE 형식으로 조합한다", () => {
    expect(formatIEEE(base)).toBe(
      'Kim, J., "A Study," Journal of Tests, vol. 12, no. 3, pp. 1-10, 2020.',
    );
  });
  it("제목 끝 마침표는 따옴표 안에서 제거된다 (경계)", () => {
    expect(formatIEEE({ ...base, title: "A Study." })).toContain('"A Study,"');
  });
  it("연도가 없으면 꼬리 구분자를 정리하고 마침표로 끝낸다", () => {
    const out = formatIEEE({ ...base, year: "" });
    expect(out.endsWith("pp. 1-10.")).toBe(true);
  });
  it("전부 비면 빈 문자열 (실패)", () => {
    expect(formatIEEE({ authors: "", year: "", title: "", source: "" })).toBe("");
  });
});

describe("readReferences 손상 데이터 필터 (#9)", () => {
  it("배열 아님·필드 누락·타입 불일치 항목을 거른다", async () => {
    const { vi } = await import("vitest");
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
    const { readReferences } = await import("../citations");
    const good = { id: "1", authors: "Kim", year: "2020", title: "T", source: "J" };
    store.set(
      "research-guide:references",
      JSON.stringify([good, { id: 2, title: "bad" }, "garbage", null]),
    );
    expect(readReferences()).toEqual([good]);
    store.set("research-guide:references", JSON.stringify({ not: "array" }));
    expect(readReferences()).toEqual([]);
    vi.unstubAllGlobals();
  });
});
