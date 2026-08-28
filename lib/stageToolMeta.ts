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
  ],
} as const satisfies Record<StageSlug, readonly string[]>;

/** 도구 제목 유니온 — StageTools의 렌더러 표가 이 제목을 모두 갖도록 강제한다. */
export type ToolTitle = (typeof STAGE_TOOL_TITLES)[StageSlug][number];

export function isStageSlug(slug: string): slug is StageSlug {
  return (STAGE_SLUGS as readonly string[]).includes(slug);
}

export function getToolCount(slug: string): number {
  return isStageSlug(slug) ? STAGE_TOOL_TITLES[slug].length : 0;
}
