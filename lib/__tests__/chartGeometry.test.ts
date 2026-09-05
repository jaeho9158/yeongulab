import { describe, it, expect } from "vitest";
import { arcPath, parsePairs } from "../chartGeometry";

describe("parsePairs", () => {
  it("항목명과 값을 쌍으로 파싱한다 (정상)", () => {
    expect(parsePairs("A, B, C", "1, 2, 3")).toEqual({
      labels: ["A", "B", "C"],
      values: [1, 2, 3],
      droppedCount: 0,
      thousandsMergedCount: 0,
    });
  });
  it("값에 천 단위 쉼표가 있어도 라벨 정렬이 깨지지 않는다 (회귀)", () => {
    const r = parsePairs("A\nB\nC", "1,200\n1,500\n1,350");
    expect(r.labels).toEqual(["A", "B", "C"]);
    expect(r.values).toEqual([1200, 1500, 1350]);
    expect(r.droppedCount).toBe(0);
    expect(r.thousandsMergedCount).toBe(3);
  });
  it("값 하나가 깨져도 뒤 항목명이 밀리지 않는다 (경계 — 정렬 붕괴 회귀 방지)", () => {
    const r = parsePairs("A, B, C", "1, x, 3");
    expect(r.labels).toEqual(["A", "C"]);
    expect(r.values).toEqual([1, 3]);
    expect(r.droppedCount).toBe(1);
  });
  it("빈 토큰이 유령 0이 되지 않는다 (경계)", () => {
    const r = parsePairs("A, B", "1, ");
    expect(r.values).toEqual([1]);
    expect(r.droppedCount).toBe(1);
  });
  it("꼬리 쉼표는 조용히 무시, 개수 불일치는 dropped로 (실패)", () => {
    expect(parsePairs("A, B,", "1, 2,").droppedCount).toBe(0);
    expect(parsePairs("A, B, C", "1").droppedCount).toBe(2);
  });
});

describe("arcPath", () => {
  it("rInner=0이면 중심에서 시작하는 파이 조각", () => {
    const d = arcPath(100, 100, 50, 0, 0, Math.PI / 2);
    expect(d.startsWith("M 100 100 L")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
  it("도넛 조각은 바깥·안쪽 호 두 개를 가진다", () => {
    const d = arcPath(100, 100, 50, 30, 0, Math.PI / 2);
    expect((d.match(/A /g) ?? []).length).toBe(2);
  });
  it("180도 초과면 large-arc 플래그가 1 (경계)", () => {
    expect(arcPath(0, 0, 10, 0, 0, Math.PI * 1.5)).toContain("0 1 1");
  });
});
