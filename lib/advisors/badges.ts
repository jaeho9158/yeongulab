import type { AdvisorBadge } from "./types";

/**
 * 기관 이메일 도메인 판정.
 *
 * 화이트리스트가 아니라 접미사 규칙으로 본다 — 국내 대학·연구기관만 해도 수백 개라
 * 목록을 유지할 수 없고, 빠진 기관을 거절하면 그 사람은 그냥 떠난다.
 *
 * 기업 도메인(@samsung.com 등)은 여기서 통과시키지 않는다. 아무나 살 수 있는
 * 도메인과 구별할 방법이 없기 때문이다. 기업 자문위원은 서류 확인 경로로 보낸다.
 */
const INSTITUTION_SUFFIXES = [
  ".ac.kr", // 대학
  ".re.kr", // 정부출연연구기관
  ".edu", // 미국 등
  ".ac.uk",
  ".ac.jp",
  ".edu.au",
  ".edu.cn",
];

export function isInstitutionalDomain(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split("@");
  // "a@b" 형태가 정확히 아니면 거절 — "kim@@snu.ac.kr"은 parts.length가 3이다
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return INSTITUTION_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

/**
 * 배지 산출. 서류 확인이 이메일 인증을 덮는다.
 *
 * 서류만 있고 이메일 인증이 없는 경우를 허용하는 이유는 기업 연구원·실무자다.
 * 이들은 기관 도메인 판정을 통과할 수 없지만 재직증명서는 낼 수 있다.
 */
export function deriveBadge(input: {
  emailVerifiedAt: string | null;
  documentVerifiedAt: string | null;
}): AdvisorBadge | null {
  if (input.documentVerifiedAt) return "서류 확인";
  if (input.emailVerifiedAt) return "이메일 인증";
  return null;
}

/**
 * 학생에게 배지의 의미를 설명하는 문구.
 *
 * 두 배지의 차이를 명시하지 않으면 학생은 둘 다 "검증된 사람"으로 읽는다.
 * 무엇이 확인됐고 무엇이 확인되지 않았는지를 정확히 말해야 한다.
 */
export function badgeExplanation(badge: AdvisorBadge): string {
  if (badge === "서류 확인") {
    return "재학·재직 서류를 운영자가 직접 확인했습니다.";
  }
  return "소속 기관 이메일 주소를 확인했습니다. 학위 과정은 본인이 적은 그대로이며 서류로 확인하지는 않았습니다.";
}
