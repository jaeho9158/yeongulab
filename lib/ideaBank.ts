/**
 * 연구주제 아이디어 뱅크.
 *
 * 각 분야마다 독립변수 후보(factors) · 종속변수 후보(outcomes) · 대상/맥락
 * (contexts)을 따로 두고, 세 칸의 모든 조합이 말이 되도록 손으로 골랐다.
 * 실험실·신체 시료·호르몬·병원체·위험 화학물질 없이, 또래의 건강을 건드리지
 * 않고 중·고등학생이 실제로 해볼 수 있는 범위로 제한한다.
 */

export type IdeaSlots = {
  /** 독립변수 후보 — 바꾸거나 비교할 조건 */
  factors: readonly string[];
  /** 종속변수 후보 — 측정할 결과 */
  outcomes: readonly string[];
  /** 대상/맥락 — 괄호 안에 붙는다 */
  contexts: readonly string[];
};

export const IDEA_CATEGORIES: Record<string, IdeaSlots> = {
  "과학·공학": {
    factors: [
      "주변 온도",
      "용기의 재질(종이/플라스틱/금속)",
      "용기의 색깔",
      "물의 염분 농도",
      "바람(선풍기)의 세기",
      "물의 양",
      "용기 뚜껑의 유무",
    ],
    outcomes: [
      "물이 식는 속도",
      "물이 증발하는 양",
      "얼음이 녹는 데 걸리는 시간",
      "물의 온도가 유지되는 시간",
      "용기 표면에 맺히는 물방울의 양",
    ],
    contexts: ["교실 실험", "가정 실험", "야외 실험"],
  },
  "생명·환경": {
    factors: [
      "빛의 색(LED 색상)",
      "하루 일조 시간",
      "물 주는 양",
      "토양의 종류(모래/상토/흙)",
      "커피 찌꺼기 퇴비의 양",
      "씨앗 사이의 간격(심는 밀도)",
      "물의 온도",
    ],
    outcomes: [
      "발아율",
      "새싹의 키 성장",
      "잎의 개수",
      "잎의 녹색 정도(색 점수)",
      "뿌리의 길이",
    ],
    contexts: ["강낭콩", "상추", "무순", "바질"],
  },
  "사회·심리": {
    factors: [
      "하루 SNS 사용 시간",
      "평균 수면 시간(자기 보고)",
      "통학 시간",
      "주당 운동 횟수(자기 보고)",
      "주당 동아리 활동 시간",
      "스마트폰 알림 개수",
      "주간 계획표 작성 여부",
    ],
    outcomes: [
      "학교생활 만족도(설문)",
      "하루 집중 학습 시간(자기 보고)",
      "친구 관계 만족도(설문)",
      "학습 동기(설문)",
      "여가 시간 만족도(설문)",
    ],
    contexts: ["중학생", "고등학생", "우리 학교 학생"],
  },
  "교육·학습": {
    factors: [
      "배경 음악의 종류",
      "필기 방식(손글씨/타자)",
      "학습 시간 배분(한 번에/나눠서)",
      "조명의 밝기",
      "쉬는 시간의 간격",
      "학습 자료의 형식(글/그림/영상)",
      "학습 장소(교실/도서관/집)",
    ],
    outcomes: [
      "단어 암기 개수",
      "독해 문제 정답률",
      "과제 완료 시간",
      "1주 후 기억 유지율",
      "자기 보고 집중도",
    ],
    contexts: ["중학생", "고등학생", "같은 반 친구 20명"],
  },
  "컴퓨터·데이터": {
    factors: [
      "학습 데이터의 개수",
      "모델의 종류(결정트리/k-NN/로지스틱 회귀)",
      "입력 특징(feature)의 개수",
      "데이터에 섞인 잡음의 비율",
      "데이터 정규화(표준화)의 여부",
      "학습/검증 데이터의 분할 비율",
    ],
    outcomes: [
      "분류 정확도",
      "학습에 걸리는 시간",
      "새 데이터에서의 정확도(일반화)",
      "과적합 정도(학습·검증 정확도 차이)",
      "범주별 정확도 편차",
    ],
    contexts: [
      "손글씨 숫자 분류",
      "스팸 문자 분류",
      "붓꽃 품종 분류",
      "영화 리뷰 감정 분류",
    ],
  },
  "예술·체육": {
    factors: [
      "배경 음악의 템포",
      "연습 간격(매일/격일)",
      "휴식 시간의 길이",
      "자기 영상 피드백의 유무",
      "목표 설정 방식(개인 기록/모둠 기록)",
      "연습 시간대(아침/오후)",
    ],
    outcomes: [
      "수행 정확도(성공률)",
      "목표 수준에 도달하기까지 걸린 연습 시간",
      "1주 후 실력 유지 정도",
      "자기 보고 자신감",
      "연습 중 실수 횟수",
    ],
    contexts: ["농구 자유투", "줄넘기", "리코더 연주", "따라 그리기", "종이접기"],
  },
};

export type Category = keyof typeof IDEA_CATEGORIES;

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

const LENSES = [
  (a: string, b: string, c: string) =>
    `${a}${josa(a, ["이", "가"])} ${b}에 미치는 영향 (${c})`,
  (a: string, b: string, c: string) =>
    `${a}${josa(a, ["과", "와"])} ${b}의 관계 (${c})`,
  (a: string, b: string, c: string) => `${a} 조건별 ${b} 비교 (${c})`,
];

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateIdea(category: Category): string {
  const slots = IDEA_CATEGORIES[category];
  const a = pickRandom(slots.factors);
  const b = pickRandom(slots.outcomes);
  const c = pickRandom(slots.contexts);
  const lens = pickRandom(LENSES);
  return lens(a, b, c);
}
