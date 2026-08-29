import { describe, it, expect } from "vitest";
import {
  parseNumberListDetailed,
  pearsonCorrelation,
  simpleLinearRegression,
  tTestTwoTailedP,
  welchTTest,
} from "../stats";

describe("parseNumberListDetailed", () => {
  it("쉼표·공백·줄바꿈 혼합 입력을 파싱한다", () => {
    expect(parseNumberListDetailed("1, 2\n3 4.5").values).toEqual([1, 2, 3, 4.5]);
  });
  it("숫자가 아닌 토큰은 버리고 개수를 센다", () => {
    const r = parseNumberListDetailed("1 abc 2 Infinity");
    expect(r.values).toEqual([1, 2]);
    expect(r.droppedCount).toBe(2);
  });
  it("빈 입력은 빈 배열", () => {
    expect(parseNumberListDetailed("  ").values).toEqual([]);
  });
});

describe("tTestTwoTailedP", () => {
  it("알려진 값과 일치 (t=2.0, df=10 → p≈0.0734)", () => {
    expect(tTestTwoTailedP(2.0, 10)).toBeCloseTo(0.0734, 3);
  });
  it("극단 입력에서도 scipy 기준값과 일치 (t=15, df=3 / 소수 df)", () => {
    // scipy: 2*t.sf(15, 3) = 6.431193e-4, 2*t.sf(4.2, 2.5) = 0.0349643
    expect(tTestTwoTailedP(15, 3)).toBeCloseTo(0.000643119, 7);
    expect(tTestTwoTailedP(4.2, 2.5)).toBeCloseTo(0.0349643, 5);
  });
  it("t=0이면 p=1", () => {
    expect(tTestTwoTailedP(0, 10)).toBeCloseTo(1, 6);
  });
});

describe("welchTTest", () => {
  it("동일 분산 표본에서 알려진 t·df·p를 낸다", () => {
    // x=[1..5], y=[2..6]: t=-1, df=8, 양측 p≈0.3466
    const r = welchTTest([1, 2, 3, 4, 5], [2, 3, 4, 5, 6]);
    if ("error" in r) throw new Error(r.error);
    expect(r.t).toBeCloseTo(-1, 6);
    expect(r.df).toBeCloseTo(8, 6);
    expect(r.p).toBeCloseTo(0.3466, 3);
    expect(r.cohenD).toBeCloseTo(-0.6325, 3);
  });
  it("불균등 n(진짜 Welch 상황)에서 scipy와 일치 — df가 소수", () => {
    // scipy.ttest_ind(a, b, equal_var=False): t=-8.344554, df=14.817164, p=5.574e-7
    const r = welchTTest(
      [1, 2, 3, 4, 5],
      [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    );
    if ("error" in r) throw new Error(r.error);
    expect(r.t).toBeCloseTo(-8.344554, 5);
    expect(r.df).toBeCloseTo(14.817164, 5);
    expect(r.p).toBeCloseTo(5.574e-7, 9);
  });
  it("두 집단 모두 분산 0이면 error를 돌려준다 (경계)", () => {
    const r = welchTTest([3, 3, 3], [5, 5, 5]);
    expect("error" in r).toBe(true);
  });
});

describe("pearsonCorrelation", () => {
  it("완전 상관은 r=1", () => {
    const r = pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8]);
    if ("error" in r) throw new Error(r.error);
    expect(r.r).toBeCloseTo(1, 9);
  });
  it("분산 0 입력은 error (실패 케이스)", () => {
    const r = pearsonCorrelation([1, 1, 1], [2, 3, 4]);
    expect("error" in r).toBe(true);
  });
});

describe("simpleLinearRegression", () => {
  it("y=2x+1을 정확히 복원한다", () => {
    const r = simpleLinearRegression([1, 2, 3, 4], [3, 5, 7, 9]);
    if ("error" in r) throw new Error(r.error);
    expect(r.slope).toBeCloseTo(2, 9);
    expect(r.intercept).toBeCloseTo(1, 9);
    expect(r.r2).toBeCloseTo(1, 9);
  });
  it("X가 모두 같으면 error", () => {
    const r = simpleLinearRegression([2, 2, 2], [1, 2, 3]);
    expect("error" in r).toBe(true);
  });
});
