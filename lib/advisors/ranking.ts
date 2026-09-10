import type { Advisor } from "./types";

/** 물어볼Lab의 정렬축을 그대로 가져왔다. 첫 값이 기본 정렬이다. */
export const SORT_KEYS = [
  "추천순",
  "응답 빠른 순",
  "최근 합류순",
  "가나다순",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * 응답률. 배정 이력이 없으면 null을 돌려준다.
 *
 * 0/0을 0%로 표시하면 방금 합류한 자문위원이 "응답률 0%"로 보여서 아무도 고르지 않고,
 * 그러면 영원히 첫 질문을 못 받는다. 신규는 수치가 아니라 안내 문구로 처리한다.
 */
export function responseRate(a: Advisor): number | null {
  if (a.assignedCount <= 0) return null;
  return Math.min(1, a.answerCount / a.assignedCount);
}

/** 응답 시간을 학생이 읽을 문장으로 바꾼다. */
export function formatResponseTime(hours: number | null): string {
  if (hours === null) return "아직 답변 이력이 없어요";
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return `보통 ${h}시간 안에 답변`;
  }
  return `보통 ${Math.round(hours / 24)}일 안에 답변`;
}

/**
 * 추천 점수. 기본 정렬이라 목록의 첫인상을 결정한다.
 *
 * 설계 의도: "지금 답변을 받을 수 있는가"를 최우선으로 둔다. 아무리 훌륭한
 * 자문위원이라도 '쉬는 중'이면 학생에게는 쓸모가 없다.
 *
 * 답변 수에 로그를 씌우는 이유 — 선형으로 두면 상위 몇 명이 목록 앞을 영구히
 * 점유하고, 신규 자문위원은 첫 질문을 받지 못해 이탈한다. 무급 공급은 그렇게 죽는다.
 */
export function recommendationScore(a: Advisor): number {
  let score = 0;
  if (a.status === "받는 중") score += 100;
  if (a.badge === "서류 확인") score += 20;
  score += Math.log10(a.answerCount + 1) * 5;
  const rate = responseRate(a);
  if (rate !== null) score += rate * 10;
  return score;
}

/** 정렬. 항상 새 배열을 돌려준다 — 서버 컴포넌트가 받은 배열을 재사용하기 때문이다. */
export function sortAdvisors(list: Advisor[], key: SortKey): Advisor[] {
  const copy = [...list];
  switch (key) {
    case "가나다순":
      return copy.sort((x, y) =>
        x.displayName.localeCompare(y.displayName, "ko"),
      );
    case "최근 합류순":
      return copy.sort((x, y) => (x.joinedAt < y.joinedAt ? 1 : -1));
    case "응답 빠른 순":
      // 이력이 없는 사람은 '빠르다'고 볼 근거가 없으므로 뒤로 보낸다
      return copy.sort((x, y) => {
        const a = x.medianResponseHours;
        const b = y.medianResponseHours;
        if (a === null && b === null) return 0;
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
      });
    case "추천순":
    default:
      return copy.sort((x, y) => recommendationScore(y) - recommendationScore(x));
  }
}
