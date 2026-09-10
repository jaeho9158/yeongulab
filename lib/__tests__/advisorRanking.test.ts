import { describe, it, expect } from "vitest";
import {
  responseRate,
  formatResponseTime,
  recommendationScore,
  sortAdvisors,
  SORT_KEYS,
} from "@/lib/advisors/ranking";
import type { Advisor } from "@/lib/advisors/types";

function advisor(over: Partial<Advisor> = {}): Advisor {
  return {
    id: "a1",
    displayName: "김연구",
    institution: "한국대학교",
    department: "화학과",
    position: "박사과정",
    labName: "",
    fields: ["유기화학"],
    bio: "",
    answerableTopics: [],
    monthlyQuota: 3,
    acceptsPrivate: true,
    status: "받는 중",
    badge: "이메일 인증",
    reviewState: "공개",
    answerCount: 0,
    assignedCount: 0,
    medianResponseHours: null,
    joinedAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("responseRate", () => {
  it("배정 대비 답변 비율을 낸다", () => {
    expect(responseRate(advisor({ answerCount: 3, assignedCount: 4 }))).toBe(0.75);
  });

  it("배정이 0이면 null — 0%로 표시하면 신규 자문위원이 부당하게 불리해진다", () => {
    expect(responseRate(advisor({ answerCount: 0, assignedCount: 0 }))).toBeNull();
  });

  it("1을 넘지 않는다", () => {
    expect(responseRate(advisor({ answerCount: 9, assignedCount: 4 }))).toBe(1);
  });
});

describe("formatResponseTime", () => {
  it("24시간 미만은 시간 단위", () => {
    expect(formatResponseTime(5)).toBe("보통 5시간 안에 답변");
  });

  it("1시간 미만은 '1시간 안에'로 묶는다", () => {
    expect(formatResponseTime(0.4)).toBe("보통 1시간 안에 답변");
  });

  it("24시간 이상은 일 단위로 반올림", () => {
    expect(formatResponseTime(30)).toBe("보통 1일 안에 답변");
    expect(formatResponseTime(50)).toBe("보통 2일 안에 답변");
  });

  it("이력이 없으면 안내 문구", () => {
    expect(formatResponseTime(null)).toBe("아직 답변 이력이 없어요");
  });
});

describe("recommendationScore", () => {
  it("'받는 중'이 '쉬는 중'보다 항상 앞선다", () => {
    const active = advisor({ status: "받는 중", answerCount: 0 });
    const resting = advisor({ status: "쉬는 중", answerCount: 100 });
    expect(recommendationScore(active)).toBeGreaterThan(
      recommendationScore(resting),
    );
  });

  it("서류 확인 배지가 이메일 인증보다 높다", () => {
    expect(recommendationScore(advisor({ badge: "서류 확인" }))).toBeGreaterThan(
      recommendationScore(advisor({ badge: "이메일 인증" })),
    );
  });

  it("배지가 없어도 계산된다 — 기업 자문위원은 배지 없이 공개될 수 있다", () => {
    expect(Number.isFinite(recommendationScore(advisor({ badge: null })))).toBe(
      true,
    );
  });

  it("답변 수가 많을수록 높다", () => {
    expect(
      recommendationScore(advisor({ answerCount: 10 })),
    ).toBeGreaterThan(recommendationScore(advisor({ answerCount: 1 })));
  });

  it("답변 수 기여는 상한이 있다 — 소수가 목록을 독점하면 신규가 첫 질문을 못 받는다", () => {
    const many = recommendationScore(advisor({ answerCount: 500 }));
    const some = recommendationScore(advisor({ answerCount: 50 }));
    expect(many - some).toBeLessThan(5);
  });
});

describe("sortAdvisors", () => {
  const a = advisor({
    id: "a",
    displayName: "가교수",
    joinedAt: "2026-01-01T00:00:00Z",
    medianResponseHours: 40,
  });
  const b = advisor({
    id: "b",
    displayName: "나교수",
    joinedAt: "2026-06-01T00:00:00Z",
    medianResponseHours: 2,
  });
  const c = advisor({
    id: "c",
    displayName: "다교수",
    joinedAt: "2026-03-01T00:00:00Z",
    medianResponseHours: null,
  });

  it("가나다순", () => {
    expect(sortAdvisors([c, b, a], "가나다순").map((x) => x.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("최근 합류순 — 최신이 먼저", () => {
    expect(sortAdvisors([a, b, c], "최근 합류순").map((x) => x.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("응답 빠른 순 — 이력 없는 사람은 뒤로", () => {
    expect(sortAdvisors([a, c, b], "응답 빠른 순").map((x) => x.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const input = [c, b, a];
    sortAdvisors(input, "가나다순");
    expect(input.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("정렬 키 4개가 모두 노출된다", () => {
    expect(SORT_KEYS).toEqual([
      "추천순",
      "응답 빠른 순",
      "최근 합류순",
      "가나다순",
    ]);
  });
});
