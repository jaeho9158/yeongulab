import { describe, it, expect } from "vitest";
import { verdict } from "../statsVerdict";

describe("verdict", () => {
  it("p ≥ .05는 '유의하지 않음' 문구 (정상)", () => {
    expect(verdict("ttest", 0.3)).toContain("유의하지 않습니다");
  });
  it("모드별로 다른 안내를 준다", () => {
    expect(verdict("ttest", 0.03)).toContain("평균 차이");
    expect(verdict("correlation", 0.03)).toContain("상관");
    expect(verdict("regression", 0.03)).toContain("회귀계수");
  });
  it("p < .01과 .01≤p<.05를 구분한다 (경계)", () => {
    expect(verdict("ttest", 0.009)).toContain("(p < .01)");
    expect(verdict("ttest", 0.049)).toContain("(p < .05)");
    expect(verdict("ttest", 0.05)).toContain("유의하지 않습니다");
  });
  it("NaN/Infinity p는 판정 불가 문구 (실패)", () => {
    expect(verdict("ttest", NaN)).toContain("판정할 수 없습니다");
    expect(verdict("ttest", Infinity)).toContain("판정할 수 없습니다");
  });
});
