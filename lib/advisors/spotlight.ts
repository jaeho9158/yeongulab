import type { Advisor } from "./types";

/** 문자열에서 안정적인 32비트 해시를 만든다. 같은 주에는 같은 값이 나온다. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 이번 주에 앞세울 자문위원을 뽑는다.
 *
 * 답변이 적은 순이 1순위인 이유 — 이 기능의 목적은 '잘하는 사람 보여주기'가 아니라
 * '아직 첫 질문을 못 받은 사람에게 기회 주기'다. 무급 자문위원은 등록만 하고
 * 아무 일도 일어나지 않으면 조용히 사라진다.
 *
 * 동률일 때 주차 해시로 섞는 이유는, 그렇게 하지 않으면 같은 사람이 매주 고정되기 때문이다.
 */
export function pickSpotlight(
  list: Advisor[],
  weekKey: string,
  count = 3,
): Advisor[] {
  return list
    .filter((a) => a.status === "받는 중")
    .map((a) => ({ a, tie: hash(`${weekKey}:${a.id}`) }))
    .sort((x, y) => {
      if (x.a.answerCount !== y.a.answerCount) {
        return x.a.answerCount - y.a.answerCount;
      }
      return x.tie - y.tie;
    })
    .slice(0, count)
    .map((entry) => entry.a);
}

/** 한국 시각 기준 ISO 주차 키. `pickSpotlight`의 weekKey로 쓴다. */
export function weekKey(at: Date): string {
  const kst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  const target = new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()),
  );
  // ISO 주차: 목요일이 속한 해가 그 주의 해다
  const day = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week =
    1 +
    Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
