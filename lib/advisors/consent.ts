import { randomBytes } from "node:crypto";

/**
 * 보호자 동의 링크의 유효 기간.
 *
 * 짧으면 보호자가 메일을 늦게 보고 놓치고, 길면 유출된 링크가 오래 살아 있다.
 * 72시간은 주말을 한 번 넘길 수 있는 최소치다.
 */
export const CONSENT_TTL_HOURS = 72;

/**
 * 동의 링크 토큰.
 *
 * Math.random()을 쓰면 안 된다 — 예측 가능해서 남의 보호자 동의를 대신 눌러줄 수 있다.
 * 32바이트를 base64url로 인코딩하므로 43자가 나온다.
 */
export function createConsentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isConsentExpired(issuedAt: string, now: Date): boolean {
  const elapsedHours = (now.getTime() - Date.parse(issuedAt)) / 3_600_000;
  return elapsedHours > CONSENT_TTL_HOURS;
}

/**
 * 보호자 동의 필요 여부.
 *
 * 지금은 모든 학교급에 대해 true다. 이 사이트의 이용자는 중·고등학생이고,
 * 나이를 검증할 수단이 없는 상태에서 "성인일 것"이라고 가정하면 안 되기 때문이다.
 * 함수로 분리해 둔 이유는 나중에 성인 이용자 경로가 생겼을 때 여기만 고치기 위해서다.
 */
export function requiresGuardianConsent(
  // 학교급에 관계없이 항상 true다. 판정이 갈리게 될 때를 대비해 호출부가 학교급을
  // 넘기도록 API를 미리 고정해 둔다 — 그래야 기준이 바뀌어도 호출부를 안 고친다.
  // 어떤 경우에도 false로 새지 않는 것이 이 함수의 안전 속성이다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schoolLevel: "중학생" | "고등학생" | "기타",
): boolean {
  return true;
}
