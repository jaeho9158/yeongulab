import { describe, it, expect } from "vitest";
import { detectContactInfo, hasContactInfo } from "@/lib/advisors/safety";

describe("detectContactInfo", () => {
  it("휴대폰 번호를 찾는다", () => {
    expect(
      detectContactInfo("010-1234-5678로 연락 주세요").map((h) => h.kind),
    ).toContain("전화번호");
  });

  it("구분자 없는 번호도 찾는다", () => {
    expect(hasContactInfo("01012345678")).toBe(true);
  });

  it("점으로 구분된 번호도 찾는다", () => {
    expect(hasContactInfo("010.1234.5678")).toBe(true);
  });

  it("이메일 주소를 찾는다", () => {
    expect(
      detectContactInfo("kim@gmail.com으로 보내주세요").map((h) => h.kind),
    ).toContain("이메일");
  });

  it("카카오톡 아이디 안내를 찾는다", () => {
    expect(hasContactInfo("카톡 아이디 research123")).toBe(true);
    expect(hasContactInfo("카카오톡으로 얘기해요")).toBe(true);
  });

  it("인스타·텔레그램·디스코드를 찾는다", () => {
    expect(hasContactInfo("인스타 디엠 주세요")).toBe(true);
    expect(hasContactInfo("텔레그램으로 옮길까요")).toBe(true);
    expect(hasContactInfo("디스코드 서버 링크 드릴게요")).toBe(true);
  });

  it("외부 화상 링크를 찾는다", () => {
    expect(hasContactInfo("https://zoom.us/j/123456")).toBe(true);
    expect(hasContactInfo("meet.google.com/abc-defg-hij")).toBe(true);
  });

  it("평범한 연구 이야기는 걸리지 않는다", () => {
    expect(hasContactInfo("대조군을 20명으로 잡으면 검정력이 부족합니다.")).toBe(
      false,
    );
    expect(hasContactInfo("p값이 0.011이라 유의수준 0.05에서 유의합니다.")).toBe(
      false,
    );
  });

  it("연도·숫자가 많은 문장을 오탐하지 않는다", () => {
    expect(hasContactInfo("2024년 논문 3편, 표본 150명, 응답률 87.5%")).toBe(
      false,
    );
  });

  it("학술 논문 DOI 링크는 막지 않는다 — 정상적인 자문 내용이다", () => {
    expect(hasContactInfo("https://doi.org/10.1038/s41586-024-07123-4")).toBe(
      false,
    );
  });

  it("찾은 위치를 함께 돌려준다", () => {
    const hits = detectContactInfo("연락처는 010-1234-5678입니다");
    expect(hits[0].match).toBe("010-1234-5678");
  });

  it("여러 개를 모두 찾는다", () => {
    expect(detectContactInfo("kim@gmail.com 아니면 010-1234-5678").length).toBe(
      2,
    );
  });
});
