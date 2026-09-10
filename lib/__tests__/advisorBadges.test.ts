import { describe, it, expect } from "vitest";
import {
  deriveBadge,
  isInstitutionalDomain,
  badgeExplanation,
} from "@/lib/advisors/badges";

describe("isInstitutionalDomain", () => {
  it("대학·연구기관 도메인을 인정한다", () => {
    expect(isInstitutionalDomain("kim@snu.ac.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@kaist.ac.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@kist.re.kr")).toBe(true);
    expect(isInstitutionalDomain("kim@mit.edu")).toBe(true);
    expect(isInstitutionalDomain("kim@cam.ac.uk")).toBe(true);
  });

  it("개인 메일 서비스를 거절한다", () => {
    expect(isInstitutionalDomain("kim@gmail.com")).toBe(false);
    expect(isInstitutionalDomain("kim@naver.com")).toBe(false);
    expect(isInstitutionalDomain("kim@daum.net")).toBe(false);
    expect(isInstitutionalDomain("kim@kakao.com")).toBe(false);
  });

  it("대소문자와 공백에 흔들리지 않는다", () => {
    expect(isInstitutionalDomain("  KIM@SNU.AC.KR  ")).toBe(true);
  });

  it("형태가 깨진 주소를 거절한다", () => {
    expect(isInstitutionalDomain("kim")).toBe(false);
    expect(isInstitutionalDomain("kim@")).toBe(false);
    expect(isInstitutionalDomain("@snu.ac.kr")).toBe(false);
    expect(isInstitutionalDomain("kim@@snu.ac.kr")).toBe(false);
  });

  it("기업 자문위원은 도메인만으로 판정하지 않는다 — 서류 경로로 보낸다", () => {
    expect(isInstitutionalDomain("kim@samsung.com")).toBe(false);
  });
});

describe("deriveBadge", () => {
  it("이메일만 인증하면 '이메일 인증'", () => {
    expect(
      deriveBadge({
        emailVerifiedAt: "2026-09-01T00:00:00Z",
        documentVerifiedAt: null,
      }),
    ).toBe("이메일 인증");
  });

  it("서류까지 확인되면 '서류 확인'", () => {
    expect(
      deriveBadge({
        emailVerifiedAt: "2026-09-01T00:00:00Z",
        documentVerifiedAt: "2026-09-05T00:00:00Z",
      }),
    ).toBe("서류 확인");
  });

  it("이메일 인증 없이 서류만 있으면 '서류 확인' — 기업 자문위원 경로", () => {
    expect(
      deriveBadge({
        emailVerifiedAt: null,
        documentVerifiedAt: "2026-09-05T00:00:00Z",
      }),
    ).toBe("서류 확인");
  });

  it("둘 다 없으면 null — 공개 대상이 아니다", () => {
    expect(
      deriveBadge({ emailVerifiedAt: null, documentVerifiedAt: null }),
    ).toBeNull();
  });
});

describe("badgeExplanation", () => {
  it("두 배지의 의미 차이를 학생에게 설명한다", () => {
    expect(badgeExplanation("이메일 인증")).toContain("소속 기관 이메일");
    expect(badgeExplanation("서류 확인")).toContain("서류");
  });

  it("설명이 서로 달라야 한다 — 같으면 배지를 나눈 의미가 없다", () => {
    expect(badgeExplanation("이메일 인증")).not.toBe(
      badgeExplanation("서류 확인"),
    );
  });
});
