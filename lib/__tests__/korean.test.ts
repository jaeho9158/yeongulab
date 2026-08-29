import { describe, it, expect } from "vitest";
import { hasBatchim, josa } from "../korean";

describe("hasBatchim", () => {
  it("받침 있는/없는 한글을 구분한다", () => {
    expect(hasBatchim("연구")).toBe(false);
    expect(hasBatchim("실험")).toBe(true);
  });
  it("끝의 괄호 설명은 건너뛴다 (경계)", () => {
    expect(hasBatchim("측정 (사전·사후)")).toBe(true); // 괄호를 떼고 '정'으로 판정
    expect(hasBatchim("변수 (예: 온도)")).toBe(false); // '수'로 판정
  });
  it("숫자는 읽는 소리 기준 (0,1,3,6,7,8만 받침)", () => {
    expect(hasBatchim("3")).toBe(true); // 삼
    expect(hasBatchim("2")).toBe(false); // 이
  });
  it("빈 문자열·비한글은 받침 없음 취급 (실패)", () => {
    expect(hasBatchim("")).toBe(false);
    expect(hasBatchim("abc")).toBe(false);
  });
});

describe("josa", () => {
  it("받침에 맞는 조사를 고른다", () => {
    expect(josa("데이터", ["이", "가"])).toBe("가");
    expect(josa("실험", ["이", "가"])).toBe("이");
    expect(josa("변수", ["은", "는"])).toBe("는");
  });
});
