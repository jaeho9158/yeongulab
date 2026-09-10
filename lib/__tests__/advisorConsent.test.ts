import { describe, it, expect } from "vitest";
import {
  createConsentToken,
  isConsentExpired,
  CONSENT_TTL_HOURS,
  requiresGuardianConsent,
} from "@/lib/advisors/consent";

describe("createConsentToken", () => {
  it("URL에 안전한 문자만 쓴다", () => {
    expect(createConsentToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("추측하기 어려울 만큼 길다", () => {
    expect(createConsentToken().length).toBeGreaterThanOrEqual(32);
  });

  it("호출할 때마다 다르다", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createConsentToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("isConsentExpired", () => {
  const issued = "2026-09-10T00:00:00Z";

  it("유효 기간 안에서는 만료가 아니다", () => {
    expect(isConsentExpired(issued, new Date("2026-09-10T12:00:00Z"))).toBe(false);
  });

  it("유효 기간을 넘기면 만료다", () => {
    const after = new Date(
      Date.parse(issued) + (CONSENT_TTL_HOURS + 1) * 3600 * 1000,
    );
    expect(isConsentExpired(issued, after)).toBe(true);
  });

  it("경계 직전은 만료가 아니다", () => {
    const edge = new Date(
      Date.parse(issued) + (CONSENT_TTL_HOURS - 0.1) * 3600 * 1000,
    );
    expect(isConsentExpired(issued, edge)).toBe(false);
  });
});

describe("requiresGuardianConsent", () => {
  it("중학생은 보호자 동의가 필요하다", () => {
    expect(requiresGuardianConsent("중학생")).toBe(true);
  });

  it("고등학생도 필요하다 — 대부분 미성년자다", () => {
    expect(requiresGuardianConsent("고등학생")).toBe(true);
  });

  it("'기타'도 필요하다 — 미성년자가 아님을 확인할 수 없으면 보수적으로 간다", () => {
    expect(requiresGuardianConsent("기타")).toBe(true);
  });
});
