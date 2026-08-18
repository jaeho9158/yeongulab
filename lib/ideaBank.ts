export const IDEA_CATEGORIES = {
  "과학·공학": [
    "빛의 파장",
    "미세플라스틱",
    "배터리 소재",
    "인공지능 알고리즘",
    "재생에너지",
    "신소재 코팅",
    "로봇 센서",
    "대기 오염 물질",
  ],
  "생명·보건": [
    "수면 패턴",
    "장내 미생물",
    "운동 강도",
    "식품 발효",
    "스트레스 호르몬",
    "청소년 영양 섭취",
    "감염병 확산",
  ],
  "사회·인문": [
    "SNS 사용 시간",
    "세대 간 언어 사용",
    "지역 방언",
    "청소년 소비 행태",
    "온라인 커뮤니티 문화",
    "역사적 인물의 재평가",
  ],
  "환경": [
    "도심 열섬 현상",
    "하천 수질",
    "재활용 참여율",
    "생물 다양성",
    "미세먼지 확산",
  ],
} as const;

const LENSES = [
  (a: string, b: string) => `${a}가 ${b}에 미치는 영향`,
  (a: string, b: string) => `${a}와 ${b}의 상관관계`,
  (a: string, b: string) => `${a}를 활용해 ${b}를 개선하는 방법`,
  (a: string, b: string) => `${a}의 변화가 ${b}에 미치는 시간적 패턴`,
  (a: string, b: string) => `${a}과 ${b} 사이의 조건별 차이 비교`,
];

export type Category = keyof typeof IDEA_CATEGORIES;

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateIdea(category: Category): string {
  const pool = IDEA_CATEGORIES[category];
  const a = pickRandom(pool);
  let b = pickRandom(pool);
  let guard = 0;
  while (b === a && guard < 10) {
    b = pickRandom(pool);
    guard++;
  }
  const lens = pickRandom(LENSES);
  return lens(a, b);
}
