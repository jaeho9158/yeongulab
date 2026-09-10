import { describe, it, expect } from "vitest";
import { monthKey, countThisMonth, quotaRemaining } from "@/lib/advisors/quota";

describe("monthKey", () => {
  it("한국 시각 기준 YYYY-MM을 낸다", () => {
    expect(monthKey(new Date("2026-09-10T05:00:00Z"))).toBe("2026-09");
  });

  it("UTC 기준 월말 밤은 한국에서 다음 달이다", () => {
    // 2026-08-31T20:00Z = 2026-09-01 05:00 KST
    expect(monthKey(new Date("2026-08-31T20:00:00Z"))).toBe("2026-09");
  });

  it("연말을 넘긴다", () => {
    expect(monthKey(new Date("2026-12-31T20:00:00Z"))).toBe("2027-01");
  });
});

describe("countThisMonth", () => {
  const now = new Date("2026-09-10T00:00:00Z");

  it("이번 달 답변만 센다", () => {
    const times = [
      "2026-09-01T00:00:00Z",
      "2026-09-09T00:00:00Z",
      "2026-08-20T00:00:00Z",
    ];
    expect(countThisMonth(times, now)).toBe(2);
  });

  it("이력이 없으면 0", () => {
    expect(countThisMonth([], now)).toBe(0);
  });
});

describe("quotaRemaining", () => {
  it("남은 건수를 낸다", () => {
    expect(quotaRemaining(5, 2)).toBe(3);
  });

  it("음수가 되지 않는다 — 운영자가 쿼터를 낮췄을 수 있다", () => {
    expect(quotaRemaining(2, 5)).toBe(0);
  });
});
