import { describe, it, expect } from "vitest";
import { groupByLab } from "@/lib/advisors/labs";
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

describe("groupByLab", () => {
  it("같은 기관·같은 랩을 하나로 묶는다", () => {
    const a = advisor({ id: "a", labName: "분자설계연구실" });
    const b = advisor({ id: "b", labName: "분자설계연구실" });
    const groups = groupByLab([a, b]);
    expect(groups.length).toBe(1);
    expect(groups[0].members.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("기관이 다르면 랩 이름이 같아도 나눈다 — 흔한 이름이 섞이면 안 된다", () => {
    const a = advisor({
      id: "a",
      institution: "한국대학교",
      labName: "생물학연구실",
    });
    const b = advisor({
      id: "b",
      institution: "대한대학교",
      labName: "생물학연구실",
    });
    expect(groupByLab([a, b]).length).toBe(2);
  });

  it("랩 이름이 없는 자문위원은 제외한다 — 기업 소속은 랩이 없다", () => {
    expect(groupByLab([advisor({ labName: "" })])).toEqual([]);
  });

  it("공백만 있는 랩 이름도 제외한다", () => {
    expect(groupByLab([advisor({ labName: "   " })])).toEqual([]);
  });

  it("'지금 질문 받는 중'인 인원 수를 함께 낸다", () => {
    const a = advisor({ id: "a", labName: "L", status: "받는 중" });
    const b = advisor({ id: "b", labName: "L", status: "쉬는 중" });
    expect(groupByLab([a, b])[0].activeCount).toBe(1);
  });

  it("인원이 많은 랩이 먼저 온다", () => {
    const solo = advisor({ id: "s", institution: "A대", labName: "혼자랩" });
    const x = advisor({ id: "x", institution: "B대", labName: "둘랩" });
    const y = advisor({ id: "y", institution: "B대", labName: "둘랩" });
    expect(groupByLab([solo, x, y])[0].labName).toBe("둘랩");
  });
});
