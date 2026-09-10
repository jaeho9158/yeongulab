/**
 * 월 쿼터 계산.
 *
 * 자문위원이 "시간을 얼마나 뺏길지 모른다"고 느끼면 등록 자체를 하지 않는다.
 * 상한을 본인이 정하게 하는 것이 무급 공급을 유지하는 장치다
 * (Letters to a Pre-Scientist가 '연 4통'으로 자원봉사자 1,000명 이상을 모은 원리).
 */

/**
 * 한국 시각 기준 'YYYY-MM'.
 *
 * UTC로 계산하면 매월 1일 0~9시 사이 답변이 지난달로 집계돼, 자문위원이
 * "이번 달에 하나도 안 했는데 쿼터가 찼다"는 상황을 겪는다.
 */
export function monthKey(at: Date): string {
  const kst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function countThisMonth(answeredAt: string[], now: Date): number {
  const key = monthKey(now);
  return answeredAt.filter((t) => monthKey(new Date(t)) === key).length;
}

export function quotaRemaining(quota: number, used: number): number {
  return Math.max(0, quota - used);
}
