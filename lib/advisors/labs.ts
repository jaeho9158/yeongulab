import type { Advisor } from "./types";

export type LabGroup = {
  institution: string;
  labName: string;
  members: Advisor[];
  /** 지금 질문을 받는 인원 수 — 물어볼Lab이 랩마다 붙이는 그 숫자다 */
  activeCount: number;
};

/**
 * 소속 랩으로 자문위원을 묶는다.
 *
 * 별도의 랩 테이블을 만들지 않는 이유 — 랩 정보를 따로 관리하면 프로필과 어긋나고,
 * 자문위원이 랩을 옮겼을 때 갱신할 주체가 없다. 프로필에서 파생시키면 항상 일치한다.
 *
 * 기관까지 키에 넣는 이유는 "생물학연구실" 같은 흔한 이름이 서로 다른 대학에서
 * 하나로 합쳐지는 것을 막기 위해서다.
 */
export function groupByLab(list: Advisor[]): LabGroup[] {
  const map = new Map<string, LabGroup>();

  for (const a of list) {
    const labName = a.labName.trim();
    if (!labName) continue;
    const key = JSON.stringify([a.institution, labName]);
    let group = map.get(key);
    if (!group) {
      group = { institution: a.institution, labName, members: [], activeCount: 0 };
      map.set(key, group);
    }
    group.members.push(a);
    if (a.status === "받는 중") group.activeCount += 1;
  }

  return [...map.values()].sort((x, y) => y.members.length - x.members.length);
}
