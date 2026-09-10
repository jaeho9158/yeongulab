import {
  MAX_BIO_LENGTH,
  MAX_FIELDS,
  MAX_QUOTA,
  MIN_QUOTA,
  POSITIONS,
  type AdvisorProfileInput,
  type Position,
} from "./types";

export type ValidationResult =
  | { ok: true; value: AdvisorProfileInput }
  | { ok: false; errors: string[] };

/** 공백만 남은 항목과 중복을 버리고 입력 순서를 지킨 목록을 만든다. */
function cleanList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * 자문위원 프로필 입력 검증.
 *
 * Server Action은 인증되지 않은 POST 엔드포인트라(next docs: 02-guides/server-actions.md
 * — "Treat every action as an untrusted entry point") 브라우저에서 이미 검사했더라도
 * 서버에서 반드시 다시 통과시켜야 한다. 그래서 이 함수는 DOM도 DB도 모른다.
 */
export function validateAdvisorProfile(
  input: AdvisorProfileInput,
): ValidationResult {
  const errors: string[] = [];

  const displayName = input.displayName.trim();
  if (!displayName) errors.push("표시명을 입력해주세요.");

  const institution = input.institution.trim();
  if (!institution) errors.push("소속 기관을 입력해주세요.");

  const department = input.department.trim();
  if (!department) errors.push("학과를 입력해주세요.");

  if (!POSITIONS.includes(input.position as Position)) {
    errors.push("직위를 선택해주세요.");
  }

  const fields = cleanList(input.fields);
  if (fields.length === 0) errors.push("연구분야를 1개 이상 선택해주세요.");
  if (fields.length > MAX_FIELDS) {
    errors.push(`연구분야는 최대 ${MAX_FIELDS}개까지 선택할 수 있습니다.`);
  }

  const bio = input.bio.trim();
  if (bio.length > MAX_BIO_LENGTH) {
    errors.push(`한 줄 소개는 ${MAX_BIO_LENGTH}자 이내로 써주세요.`);
  }

  const quota = input.monthlyQuota;
  if (!Number.isInteger(quota) || quota < MIN_QUOTA || quota > MAX_QUOTA) {
    errors.push(
      `월 답변 가능 건수는 ${MIN_QUOTA}~${MAX_QUOTA} 사이로 정해주세요.`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      displayName,
      institution,
      department,
      position: input.position,
      labName: input.labName.trim(),
      fields,
      bio,
      answerableTopics: cleanList(input.answerableTopics),
      monthlyQuota: quota,
      acceptsPrivate: input.acceptsPrivate,
    },
  };
}
