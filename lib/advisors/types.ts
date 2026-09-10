/** 자문위원 도메인 타입. DB 스키마와 UI가 공유하는 단일 출처다. */

export const POSITIONS = [
  "학부생",
  "석사과정",
  "박사과정",
  "박사후연구원",
  "교수",
  "기업 연구원",
  "기업 실무자",
] as const;
export type Position = (typeof POSITIONS)[number];

/** 자문위원이 직접 켜고 끈다 — 무급이라 부담 제어권이 본인에게 있어야 한다. */
export type AdvisorStatus = "받는 중" | "쉬는 중";

/**
 * 배지는 두 단계다. 기관 이메일 도메인만으로는 학위과정을 보증할 수 없기 때문이다
 * (@*.ac.kr은 학부생도 갖는다). 서류를 운영자가 확인해야 상위 배지가 붙는다.
 */
export type AdvisorBadge = "이메일 인증" | "서류 확인";

export type AdvisorReviewState = "심사 대기" | "공개" | "보류";

/** 자문위원이 직접 입력하는 값. 시스템 산출값은 여기 없다. */
export type AdvisorProfileInput = {
  displayName: string;
  institution: string;
  department: string;
  position: Position;
  labName: string;
  fields: string[];
  bio: string;
  answerableTopics: string[];
  monthlyQuota: number;
  acceptsPrivate: boolean;
};

/** 공개 화면에 내려가는 형태. institutionEmail은 의도적으로 없다. */
export type Advisor = AdvisorProfileInput & {
  id: string;
  status: AdvisorStatus;
  /**
   * null일 수 있다 — 기관 도메인이 아닌 자문위원(기업 소속 등)을 운영자가
   * 서류 확인 전에 먼저 공개시킬 수 있기 때문이다. 화면은 배지 없는 경우를
   * 반드시 처리해야 한다.
   */
  badge: AdvisorBadge | null;
  reviewState: AdvisorReviewState;
  /** 누적 답변 수 */
  answerCount: number;
  /** 배정된 질문 수 — 응답률의 분모 */
  assignedCount: number;
  /** 응답까지 걸린 시간의 중앙값. 답변 이력이 없으면 null */
  medianResponseHours: number | null;
  /** ISO 8601 */
  joinedAt: string;
};

export const MAX_FIELDS = 5;
export const MAX_BIO_LENGTH = 120;
export const MAX_QUOTA = 20;
export const MIN_QUOTA = 1;
