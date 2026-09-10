import { describe, it, expect } from "vitest";
import { pickSpotlight, weekKey } from "@/lib/advisors/spotlight";
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

describe("pickSpotlight", () => {
  it("'쉬는 중'은 뽑지 않는다", () => {
    expect(pickSpotlight([advisor({ status: "쉬는 중" })], "2026-W37")).toEqual([]);
  });

  it("답변이 적은 사람을 먼저 뽑는다 — 첫 질문을 몰아주는 것이 목적이다", () => {
    const busy = advisor({ id: "busy", answerCount: 100 });
    const fresh = advisor({ id: "fresh", answerCount: 0 });
    expect(pickSpotlight([busy, fresh], "2026-W37", 1).map((a) => a.id)).toEqual([
      "fresh",
    ]);
  });

  it("요청한 수만큼만 뽑는다", () => {
    const many = Array.from({ length: 10 }, (_, i) => advisor({ id: `a${i}` }));
    expect(pickSpotlight(many, "2026-W37", 3).length).toBe(3);
  });

  it("같은 주에는 같은 결과를 낸다", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      advisor({ id: `a${i}`, answerCount: 5 }),
    );
    const first = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    const second = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    expect(first).toEqual(second);
  });

  it("주가 바뀌면 결과가 달라진다 — 매주 다른 사람이 노출돼야 한다", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      advisor({ id: `a${i}`, answerCount: 5 }),
    );
    const w37 = pickSpotlight(many, "2026-W37", 3).map((a) => a.id);
    const w38 = pickSpotlight(many, "2026-W38", 3).map((a) => a.id);
    expect(w37).not.toEqual(w38);
  });

  it("자문위원이 없으면 빈 배열", () => {
    expect(pickSpotlight([], "2026-W37")).toEqual([]);
  });
});

describe("weekKey", () => {
  it("ISO 주차를 낸다", () => {
    expect(weekKey(new Date("2026-09-10T00:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("같은 주의 다른 날은 같은 키다", () => {
    // 2026-09-07(월) ~ 2026-09-13(일) 은 같은 주
    const mon = weekKey(new Date("2026-09-07T03:00:00Z"));
    const sun = weekKey(new Date("2026-09-13T03:00:00Z"));
    expect(mon).toBe(sun);
  });

  it("주가 넘어가면 키가 바뀐다", () => {
    const thisWeek = weekKey(new Date("2026-09-13T03:00:00Z"));
    const nextWeek = weekKey(new Date("2026-09-14T03:00:00Z"));
    expect(thisWeek).not.toBe(nextWeek);
  });

  it("한국 시각 기준이다 — 일요일 밤 UTC는 한국에서 이미 월요일이다", () => {
    // 2026-09-13T20:00Z = 2026-09-14 05:00 KST (월요일)
    expect(weekKey(new Date("2026-09-13T20:00:00Z"))).toBe(
      weekKey(new Date("2026-09-14T03:00:00Z")),
    );
  });
});
