import { describe, it, expect } from "vitest";
import { validateAdvisorProfile } from "@/lib/advisors/validate";
import type { AdvisorProfileInput } from "@/lib/advisors/types";

const VALID: AdvisorProfileInput = {
  displayName: "김연구",
  institution: "한국대학교",
  department: "화학과",
  position: "박사과정",
  labName: "분자설계연구실",
  fields: ["유기화학", "촉매"],
  bio: "고분자 촉매를 연구합니다.",
  answerableTopics: ["실험 설계", "논문 읽기"],
  monthlyQuota: 3,
  acceptsPrivate: true,
};

describe("validateAdvisorProfile", () => {
  it("올바른 입력을 통과시킨다", () => {
    expect(validateAdvisorProfile(VALID).ok).toBe(true);
  });

  it("표시명이 비면 거절한다", () => {
    const result = validateAdvisorProfile({ ...VALID, displayName: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain("표시명을 입력해주세요.");
  });

  it("소속과 학과가 비면 각각 거절한다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      institution: "",
      department: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("소속 기관을 입력해주세요.");
      expect(result.errors).toContain("학과를 입력해주세요.");
    }
  });

  it("연구분야가 하나도 없으면 거절한다 — 질문 매칭이 불가능하다", () => {
    const result = validateAdvisorProfile({ ...VALID, fields: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("연구분야를 1개 이상 선택해주세요.");
    }
  });

  it("연구분야가 5개를 넘으면 거절한다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      fields: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("연구분야는 최대 5개까지 선택할 수 있습니다.");
    }
  });

  it("한 줄 소개가 120자를 넘으면 거절한다", () => {
    const result = validateAdvisorProfile({ ...VALID, bio: "가".repeat(121) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("한 줄 소개는 120자 이내로 써주세요.");
    }
  });

  it("쿼터가 범위를 벗어나거나 정수가 아니면 거절한다", () => {
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 0 }).ok).toBe(false);
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 21 }).ok).toBe(false);
    expect(validateAdvisorProfile({ ...VALID, monthlyQuota: 2.5 }).ok).toBe(false);
  });

  it("허용되지 않은 직위를 거절한다 — Server Action은 신뢰할 수 없는 입력을 받는다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      position: "총장" as AdvisorProfileInput["position"],
    });
    expect(result.ok).toBe(false);
  });

  it("통과하면 공백을 제거한 값을 돌려준다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      displayName: "  김연구  ",
      fields: [" 유기화학 ", "촉매"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName).toBe("김연구");
      expect(result.value.fields).toEqual(["유기화학", "촉매"]);
    }
  });

  it("빈 연구분야 항목은 버리고 중복은 합친다", () => {
    const result = validateAdvisorProfile({
      ...VALID,
      fields: ["유기화학", "  ", "유기화학", "촉매"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fields).toEqual(["유기화학", "촉매"]);
  });

  it("소속 랩은 비어도 통과한다 — 기업 소속은 랩이 없다", () => {
    expect(validateAdvisorProfile({ ...VALID, labName: "" }).ok).toBe(true);
  });
});
