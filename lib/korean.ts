/**
 * 한국어 조사(助詞) 처리.
 *
 * ideaBank 안에 있던 것을 여기로 옮겼다 — 조사 판정만 필요한 도구가
 * 아이디어 데이터(수 KB)까지 함께 싣지 않도록 분리한다.
 */

/** 조사 판정에 쓸 마지막 글자 — 끝의 괄호 설명은 건너뛴다. */
function lastSyllable(word: string): string | undefined {
  return word
    .trim()
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .at(-1);
}

// 한글 종성(받침) 유무에 따라 조사를 올바르게 고른다.
export function hasBatchim(word: string): boolean {
  const last = lastSyllable(word);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0x30 && code <= 0x39) {
    // 숫자는 읽을 때 받침이 있는 것(0, 1, 3, 6, 7, 8)만 받침으로 취급
    return "013678".includes(last);
  }
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아니면 받침 없음으로 취급
  return (code - 0xac00) % 28 !== 0;
}

/** 받침 유무에 맞는 조사를 돌려준다. 예: josa("데이터", ["이", "가"]) → "가" */
export function josa(
  word: string,
  [withBatchim, noBatchim]: [string, string],
): string {
  return hasBatchim(word) ? withBatchim : noBatchim;
}
