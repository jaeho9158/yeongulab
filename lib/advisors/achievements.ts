/**
 * 활동 배지.
 *
 * 무급 자문위원에게 줄 수 있는 것은 보수가 아니라 인정이다. 다만 랭킹은 만들지 않는다 —
 * 30명 규모에서 순위표는 하위권을 그대로 이탈시키고, 경쟁 기능에 대한 멘토 반발 사례도
 * 조사에 기록돼 있다. 배지는 남과 비교하지 않고 자기 활동만 보여준다.
 */

export type Achievement = {
  id: string;
  label: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-answer", label: "첫 답변", description: "첫 질문에 답했습니다." },
  { id: "ten-answers", label: "답변 10건", description: "질문 10건에 답했습니다." },
  { id: "fifty-answers", label: "답변 50건", description: "질문 50건에 답했습니다." },
  {
    id: "fast-responder",
    label: "빠른 답변",
    description: "보통 하루 안에 답변합니다.",
  },
];

function byId(id: string): Achievement {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) throw new Error(`알 수 없는 배지: ${id}`);
  return found;
}

export function earnedAchievements(stats: {
  answerCount: number;
  medianResponseHours: number | null;
}): Achievement[] {
  const earned: Achievement[] = [];
  if (stats.answerCount >= 1) earned.push(byId("first-answer"));
  if (stats.answerCount >= 10) earned.push(byId("ten-answers"));
  if (stats.answerCount >= 50) earned.push(byId("fifty-answers"));
  // 표본이 적으면 '빠르다'고 말할 근거가 없다
  if (
    stats.answerCount >= 3 &&
    stats.medianResponseHours !== null &&
    stats.medianResponseHours < 24
  ) {
    earned.push(byId("fast-responder"));
  }
  return earned;
}
