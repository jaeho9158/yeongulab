import { describe, it, expect } from "vitest";
import { earnedAchievements, ACHIEVEMENTS } from "@/lib/advisors/achievements";

describe("earnedAchievements", () => {
  it("답변이 없으면 아무 배지도 없다", () => {
    expect(
      earnedAchievements({ answerCount: 0, medianResponseHours: null }),
    ).toEqual([]);
  });

  it("첫 답변에 '첫 답변' 배지", () => {
    const earned = earnedAchievements({ answerCount: 1, medianResponseHours: 10 });
    expect(earned.map((a) => a.id)).toContain("first-answer");
  });

  it("답변이 쌓이면 누적 배지가 붙는다", () => {
    const earned = earnedAchievements({
      answerCount: 10,
      medianResponseHours: 10,
    });
    expect(earned.map((a) => a.id)).toContain("ten-answers");
  });

  it("24시간 안에 답하면 '빠른 답변' 배지", () => {
    const earned = earnedAchievements({ answerCount: 5, medianResponseHours: 6 });
    expect(earned.map((a) => a.id)).toContain("fast-responder");
  });

  it("답변이 3건 미만이면 '빠른 답변'을 주지 않는다 — 한 건으로 판단할 수 없다", () => {
    const earned = earnedAchievements({ answerCount: 1, medianResponseHours: 1 });
    expect(earned.map((a) => a.id)).not.toContain("fast-responder");
  });

  it("모든 배지에 설명이 있다", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });
});
