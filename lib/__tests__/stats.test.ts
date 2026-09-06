import { describe, it, expect } from "vitest";
import {
  parseNumberListDetailed,
  parsePairedLists,
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

  // --- 천 단위 쉼표 회귀 (엑셀/구글시트 붙여넣기) ---
  it("엑셀에서 붙여넣은 천 단위 쉼표를 하나의 수로 읽는다", () => {
    const r = parseNumberListDetailed("1,200 1,500 1,350");
    expect(r.values).toEqual([1200, 1500, 1350]);
    expect(r.droppedCount).toBe(0);
    expect(r.thousandsMergedCount).toBe(3);
  });
  it("쉼표를 값 구분자로 쓰던 기존 입력은 그대로 동작한다", () => {
    const r = parseNumberListDetailed("12,15,14");
    expect(r.values).toEqual([12, 15, 14]);
    expect(r.thousandsMergedCount).toBe(0);
    expect(r.ambiguousCommaCount).toBe(0);
  });
  it("쉼표+공백 구분자도 그대로 (1, 200 은 두 값)", () => {
    expect(parseNumberListDetailed("1, 200, 3").values).toEqual([1, 200, 3]);
  });
  it("천 단위 형식을 어긴 덩어리가 하나라도 있으면 입력 전체를 구분자로 본다", () => {
    const r = parseNumberListDetailed("1,200 12,15");
    expect(r.values).toEqual([1, 200, 12, 15]);
    expect(r.thousandsMergedCount).toBe(0);
    // "1,200"은 천 단위로도 읽힐 수 있었다 → 모호함 신호를 남긴다
    expect(r.ambiguousCommaCount).toBe(1);
  });
  it("모호한 단일 값은 천 단위로 읽되 신호를 남긴다", () => {
    const r = parseNumberListDetailed("12,345");
    expect(r.values).toEqual([12345]);
    expect(r.thousandsMergedCount).toBe(1);
  });
  it("음수·소수·백만 단위도 천 단위 쉼표로 읽는다", () => {
    expect(parseNumberListDetailed("-1,234.5 1,234,567").values).toEqual([
      -1234.5, 1234567,
    ]);
  });
  it("3자리가 아닌 그룹은 천 단위가 아니다 (경계)", () => {
    expect(parseNumberListDetailed("1,2345").values).toEqual([1, 2345]);
    expect(parseNumberListDetailed("0,123").values).toEqual([0, 123]);
  });
  it("탭·여러 줄바꿈·전각 공백·전각 쉼표 혼합", () => {
    const r = parseNumberListDetailed("1,200\t1,500\n\n　1，350");
    expect(r.values).toEqual([1200, 1500, 1350]);
    expect(r.droppedCount).toBe(0);
  });
  it("전각 쉼표를 구분자로 쓴 경우도 그대로 (전각 정규화 확인)", () => {
    expect(parseNumberListDetailed("12，15、14").values).toEqual([12, 15, 14]);
  });
  it("천 단위 모드에서도 숫자가 아닌 토큰은 dropped로 센다", () => {
    const r = parseNumberListDetailed("1,200 abc 1,500");
    expect(r.values).toEqual([1200, 1500]);
    expect(r.droppedCount).toBe(1);
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

// § K3 — 상관·회귀는 X의 i번째와 Y의 i번째가 같은 관측이라는 전제 위에 선다.
// 개수만 세면 양쪽에 빈 칸이 하나씩 있을 때 검사를 통과한 채 그 아래 전부가
// 한 칸씩 밀린 쌍으로 조용히 계산됐다.
describe("parsePairedLists (K3)", () => {
  it("정상 두 열은 그대로 쌍이 된다", () => {
    const r = parsePairedLists("1\n2\n3", "10\n20\n30");
    expect(r.x).toEqual([1, 2, 3]);
    expect(r.y).toEqual([10, 20, 30]);
    expect(r.issues).toEqual([]);
  });

  it("중간 빈 줄을 흡수하지 않고 그 행을 issue로 남긴다", () => {
    const r = parsePairedLists("1\n\n3", "10\n20\n30");
    expect(r.issues.map((i) => [i.row, i.side])).toEqual([[2, "x"]]);
    // 한쪽이라도 못 읽으면 그 행 전체를 버린다 — 밀리지 않는다
    expect(r.x).toEqual([1, 3]);
    expect(r.y).toEqual([10, 30]);
  });

  it("양쪽에 빈 칸이 하나씩 있어도 쌍이 밀리지 않는다 (K3 회귀)", () => {
    // 예전에는 X도 Y도 길이 3이 되어 검사를 통과하고
    // (1,10) (3,20) (4,40)처럼 어긋난 쌍이 계산됐다
    const r = parsePairedLists("1\n\n3\n4", "10\n20\n\n40");
    expect(r.lengths).toEqual({ x: 4, y: 4 });
    expect(r.x).toEqual([1, 4]);
    expect(r.y).toEqual([10, 40]);
    expect(new Set(r.issues.map((i) => i.row))).toEqual(new Set([2, 3]));
  });

  it("빈 칸이 유령 0이 되지 않는다", () => {
    const r = parsePairedLists("1\n\n3", "10\n\n30");
    expect(r.x).not.toContain(0);
    expect(r.y).not.toContain(0);
  });

  it("행 수가 다르면 lengths로 알린다", () => {
    const r = parsePairedLists("1\n2\n3", "10\n20");
    expect(r.lengths).toEqual({ x: 3, y: 2 });
  });

  it("줄바꿈 없는 기존 입력은 종전대로 읽는다", () => {
    const r = parsePairedLists("1, 2, 3", "10 20 30");
    expect(r.x).toEqual([1, 2, 3]);
    expect(r.y).toEqual([10, 20, 30]);
    expect(r.issues).toEqual([]);
  });
});
