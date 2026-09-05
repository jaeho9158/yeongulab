/**
 * 단계별 도구 "메타"(제목·개수)만 담는 모듈 — 컴포넌트를 import하지 않는다.
 *
 * 홈·가이드 목록은 '도구 N' 표기만 필요한데, 도구 컴포넌트까지 끌어오면
 * 모든 라우트에 21개 도구 번들이 실리므로 여기서 분리한다.
 * 실제 렌더러는 components/StageTools.tsx가 이 제목을 키로 연결한다.
 */

export const STAGE_SLUGS = [
  "topic",
  "prior-research",
  "methodology",
  "data-collection",
  "writing",
  "submission",
] as const;

export type StageSlug = (typeof STAGE_SLUGS)[number];

export const STAGE_TOOL_TITLES = {
  topic: ["연구주제 아이디어 뽑기", "내 연구질문, 조사형일까 탐구형일까"],
  "prior-research": ["선행연구 검색해보기", "내 레퍼런스 목록"],
  // 체크리스트 순서가 '설계 유형 선택 → 목적 진술'이라 진단 퀴즈가 맨 앞이다
  // (아코디언은 첫 도구를 펼쳐두므로, 이 단계에서 먼저 정할 것이 먼저 보인다)
  methodology: [
    "내 연구질문에 맞는 설계 유형 찾기",
    "목적 진술 만들어보기",
    "변수 정의표 만들기",
  ],
  "data-collection": ["표본 크기 계산기", "설문 문항 편향 체크", "랜덤 표본 추첨기"],
  writing: [
    "간이 통계 계산기",
    "간이 차트 그리기",
    "그림·표 캡션 도우미",
    "IMRaD 구조 점검",
    // 구조를 점검한 다음 그 섹션을 영어로 옮겨 쓰는 순서
    "논문에 쓰는 영어 표현",
    "분량 체크기",
    "인용 형식 만들어보기",
    "내 레퍼런스 목록",
    "연구윤리 · 재현가능성 체크리스트",
  ],
  submission: [
    "투고처 후보 모음",
    "AI 활용 disclosure 문구 만들기",
    "예상 질문 뽑기",
    "발표 시간 재보기",
    "마감일 트래커",
    "내 연구 사례 나누기",
  ],
} as const satisfies Record<StageSlug, readonly string[]>;

/** 도구 제목 유니온 — StageTools의 렌더러 표가 이 제목을 모두 갖도록 강제한다. */
export type ToolTitle = (typeof STAGE_TOOL_TITLES)[StageSlug][number];

/**
 * 도구 카드에 쓰는 한 줄 설명 — /tools 색인 페이지가 이걸로 목록을 그린다.
 * satisfies로 강제해서, 도구가 STAGE_TOOL_TITLES에 추가되는데 설명이
 * 빠지면 여기서 컴파일 에러로 바로 드러난다.
 */
export const TOOL_DESCRIPTIONS = {
  "연구주제 아이디어 뽑기":
    "관심 분야와 변수를 조합해 연구질문 초안을 만들어 봅니다.",
  "내 연구질문, 조사형일까 탐구형일까":
    "질문이 '찾아보면 나오는 것'인지 '확인해봐야 아는 것'인지 가려냅니다.",
  "선행연구 검색해보기": "키워드로 학술 논문을 검색하고 초록까지 확인합니다.",
  "내 레퍼런스 목록": "저장해 둔 논문을 APA·IEEE 형식으로 모아 봅니다.",
  "내 연구질문에 맞는 설계 유형 찾기":
    "네 문항으로 실험·상관·기술·사례 중 맞는 설계를 고릅니다.",
  "목적 진술 만들어보기": "빈칸을 채워 연구 목적 문장을 완성합니다.",
  "변수 정의표 만들기": "독립·종속·통제 변수를 표로 정리합니다.",
  "표본 크기 계산기": "설문에 필요한 인원을 오차 범위에서 역산합니다.",
  "설문 문항 편향 체크": "이중 질문·유도 질문을 자동으로 찾아냅니다.",
  "랜덤 표본 추첨기": "명단에서 편향 없이 무작위로 뽑습니다.",
  "간이 통계 계산기": "t-검정·상관·회귀를 p값과 효과크기까지 계산합니다.",
  "간이 차트 그리기": "항목과 값만 넣으면 논문에 붙일 SVG 그래프를 만듭니다.",
  "그림·표 캡션 도우미": "그림 1, 표 2 같은 캡션을 형식에 맞게 씁니다.",
  "IMRaD 구조 점검": "초고를 붙여넣어 빠진 섹션이 있는지 확인합니다.",
  "논문에 쓰는 영어 표현": "섹션별 정형 표현 36개를 뜻과 함께 찾아봅니다.",
  "분량 체크기": "글자수·단어수를 세어 제출 규정과 맞춰봅니다.",
  "인용 형식 만들어보기": "서지 정보를 넣으면 APA·IEEE 형식으로 바꿔줍니다.",
  "연구윤리 · 재현가능성 체크리스트": "제출 전 윤리 항목을 하나씩 확인합니다.",
  "투고처 후보 모음": "청소년이 낼 수 있는 대회·학술지를 조건별로 봅니다.",
  "AI 활용 disclosure 문구 만들기": "어디에 AI를 썼는지 밝히는 문장을 만듭니다.",
  "예상 질문 뽑기": "심사에서 나올 만한 질문을 미리 받아봅니다.",
  "발표 시간 재보기": "발표 연습 시간을 섹션별로 잽니다.",
  "마감일 트래커": "대회·저널 마감을 D-day로 관리합니다.",
  "내 연구 사례 나누기":
    "끝낸 연구를 짧게 정리해 다른 학생들이 볼 수 있게 보내줍니다.",
} as const satisfies Record<ToolTitle, string>;

export function isStageSlug(slug: string): slug is StageSlug {
  return (STAGE_SLUGS as readonly string[]).includes(slug);
}

export function getToolCount(slug: string): number {
  return isStageSlug(slug) ? STAGE_TOOL_TITLES[slug].length : 0;
}

/**
 * 사이트 전체 고유 도구 개수 — 같은 도구(예: "내 레퍼런스 목록")가 여러
 * 단계에 중복 등장하므로 Set으로 중복 제거해야 실제 개수가 나온다.
 * /tools 메타데이터·본문이 이 값을 쓰면 도구가 늘어도 하드코딩을 안 고쳐도 된다.
 */
export function getTotalUniqueToolCount(): number {
  const titles = Object.values(STAGE_TOOL_TITLES).flat();
  return new Set(titles).size;
}
