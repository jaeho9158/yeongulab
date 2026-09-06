import { afterEach, describe, it, expect } from "vitest";
import { formatAPA, formatIEEE } from "../citations";
import { installMockStorage, restoreStorage } from "./_storage";

afterEach(restoreStorage);

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
    const { store } = installMockStorage();
    const { readReferences } = await import("../citations");
    const good = { id: "1", authors: "Kim", year: "2020", title: "T", source: "J" };
    store.set(
      "research-guide:references",
      JSON.stringify([good, { id: 2, title: "bad" }, "garbage", null]),
    );
    expect(readReferences()).toEqual([good]);
    store.set("research-guide:references", JSON.stringify({ not: "array" }));
    expect(readReferences()).toEqual([]);
  });
});

// § K1·K2가 202개 테스트를 통과한 이유는 "저장 실패를 거는 테스트가 경로마다
// 필요한데 아무도 안 썼다"는 것이다. 아래는 그 방지선의 첫 조각 —
// 예외가 밖으로 나가지 않는지만 본다. 실패를 호출부에 **알리는가**는 K2의 몫.
describe("저장 실패 (S2)", () => {
  it("addReference는 setItem이 throw해도 예외를 밖으로 내지 않는다", async () => {
    installMockStorage({ failSetFrom: 1 });
    const { addReference } = await import("../citations");
    expect(() =>
      addReference({ authors: "Kim", year: "2020", title: "T", source: "J" }),
    ).not.toThrow();
  });

  it("removeReference는 setItem이 throw해도 예외를 밖으로 내지 않는다", async () => {
    installMockStorage({ failSetFrom: 1 });
    const { removeReference } = await import("../citations");
    expect(() => removeReference("nope")).not.toThrow();
  });

  it("readReferences는 getItem이 throw해도 빈 배열을 준다", async () => {
    installMockStorage({ failGet: true });
    const { readReferences } = await import("../citations");
    expect(readReferences()).toEqual([]);
  });

  it("addReference는 저장에 성공하면 saved=true와 새 목록을 준다", async () => {
    installMockStorage();
    const { addReference } = await import("../citations");
    const r = addReference({ authors: "Kim", year: "2020", title: "T", source: "J" });
    expect(r.saved).toBe(true);
    expect(r.refs).toHaveLength(1);
    expect(typeof r.refs[0].id).toBe("string");
  });

  it("addReference는 setItem이 throw하면 saved=false를 준다 (K2 회귀)", async () => {
    installMockStorage({ failSetFrom: 1 });
    const { addReference } = await import("../citations");
    const r = addReference({ authors: "Kim", year: "2020", title: "T", source: "J" });
    expect(r.saved).toBe(false);
    // 화면용 목록은 살아 있어야 한다 — 입력이 사라지면 안 된다
    expect(r.refs).toHaveLength(1);
  });

  it("removeReference도 저장 실패를 saved=false로 알린다", async () => {
    installMockStorage({ failSetFrom: 1 });
    const { removeReference } = await import("../citations");
    expect(removeReference("nope").saved).toBe(false);
  });
});
