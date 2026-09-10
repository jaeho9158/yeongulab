import type { Advisor } from "./types";

export type MatchInput = {
  /** 질문에 붙은 분야 태그 */
  fields: string[];
  /** 자문위원 id별 이번 달 답변 수 */
  answeredThisMonth: Record<string, number>;
};

/**
 * 질문에 맞는 자문위원을 고른다.
 *
 * 정렬 2순위를 '답변 적은 순'으로 둔 것이 이 함수의 핵심이다. 답변 많은 사람에게
 * 계속 몰아주면 신규 자문위원은 첫 질문을 못 받고 그대로 떠난다. 무급 공급에서는
 * 이 이탈이 곧 서비스 종료다.
 */
export function matchAdvisors(list: Advisor[], input: MatchInput): Advisor[] {
  const wanted = new Set(input.fields);
  if (wanted.size === 0) return [];

  const scored = list
    .filter((a) => a.status === "받는 중")
    .filter((a) => (input.answeredThisMonth[a.id] ?? 0) < a.monthlyQuota)
    .map((a) => ({
      advisor: a,
      overlap: a.fields.filter((f) => wanted.has(f)).length,
    }))
    .filter((entry) => entry.overlap > 0);

  scored.sort((x, y) => {
    if (y.overlap !== x.overlap) return y.overlap - x.overlap;
    return x.advisor.answerCount - y.advisor.answerCount;
  });

  return scored.map((entry) => entry.advisor);
}
