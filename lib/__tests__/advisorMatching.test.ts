import { describe, it, expect } from "vitest";
import { matchAdvisors, type MatchInput } from "@/lib/advisors/matching";
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

const base: MatchInput = { fields: ["유기화학"], answeredThisMonth: {} };

describe("matchAdvisors", () => {
  it("분야가 겹치는 자문위원만 고른다", () => {
    const chem = advisor({ id: "chem", fields: ["유기화학"] });
    const bio = advisor({ id: "bio", fields: ["분자생물학"] });
    expect(matchAdvisors([chem, bio], base).map((a) => a.id)).toEqual(["chem"]);
  });

  it("겹치는 분야가 많을수록 앞에 온다", () => {
    const one = advisor({ id: "one", fields: ["유기화학"] });
    const two = advisor({ id: "two", fields: ["유기화학", "촉매"] });
    const input: MatchInput = {
      fields: ["유기화학", "촉매"],
      answeredThisMonth: {},
    };
    expect(matchAdvisors([one, two], input).map((a) => a.id)).toEqual([
      "two",
      "one",
    ]);
  });

  it("'쉬는 중'인 자문위원은 제외한다", () => {
    expect(matchAdvisors([advisor({ id: "r", status: "쉬는 중" })], base)).toEqual(
      [],
    );
  });

  it("이번 달 쿼터를 채웠으면 제외한다", () => {
    const full = advisor({ id: "full", monthlyQuota: 2 });
    const input: MatchInput = {
      fields: ["유기화학"],
      answeredThisMonth: { full: 2 },
    };
    expect(matchAdvisors([full], input)).toEqual([]);
  });

  it("쿼터에 여유가 있으면 포함한다", () => {
    const room = advisor({ id: "room", monthlyQuota: 3 });
    const input: MatchInput = {
      fields: ["유기화학"],
      answeredThisMonth: { room: 2 },
    };
    expect(matchAdvisors([room], input).map((a) => a.id)).toEqual(["room"]);
  });

  it("겹침 수가 같으면 답변이 적은 쪽을 먼저 — 신규에게 첫 질문을 준다", () => {
    const busy = advisor({ id: "busy", answerCount: 50 });
    const fresh = advisor({ id: "fresh", answerCount: 0 });
    expect(matchAdvisors([busy, fresh], base).map((a) => a.id)).toEqual([
      "fresh",
      "busy",
    ]);
  });

  it("맞는 사람이 없으면 빈 배열 — 호출부가 안내 문구를 띄운다", () => {
    expect(matchAdvisors([], base)).toEqual([]);
  });

  it("질문 분야가 비면 아무도 고르지 않는다", () => {
    expect(
      matchAdvisors([advisor()], { fields: [], answeredThisMonth: {} }),
    ).toEqual([]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const list = [advisor({ id: "x" }), advisor({ id: "y" })];
    matchAdvisors(list, base);
    expect(list.map((a) => a.id)).toEqual(["x", "y"]);
  });
});
