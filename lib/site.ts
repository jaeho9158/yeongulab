/**
 * 사이트 공통 상수.
 *
 * SITE_URL 우선순위:
 * 1. NEXT_PUBLIC_SITE_URL (직접 지정)
 * 2. Vercel이 자동 주입하는 프로덕션 도메인 (VERCEL_PROJECT_PRODUCTION_URL)
 * 3. 고정 폴백 — 어떤 환경변수도 없을 때 sitemap/robots/canonical이
 *    localhost로 새어 나가지 않도록 한다.
 */
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const SITE_URL = (
  fromEnv ||
  (fromVercel ? `https://${fromVercel}` : "https://yeongulab.vercel.app")
).replace(/\/+$/, "");

export const SITE_NAME = "연구랩 가이드";

/** 운영자 연락처 — 개인정보처리방침, 외부 API(OpenAlex polite pool) 식별용 */
export const SITE_CONTACT_EMAIL = "jaeho9158@gmail.com";

/** 운영자 — 소개 페이지와 메타데이터가 같은 값을 쓰도록 한 곳에 둔다. */
export const OPERATOR = {
  name: "황재호",
  role: "지니어스 클럽 회장",
} as const;

/**
 * 논문용어사전 — 연구랩과 함께 쓰는 별도 사이트.
 * 헤더 메뉴와 홈 섹션이 같은 값을 쓰도록 주소·문구를 여기 한 곳에 둔다.
 * 좁은 헤더에는 navLabel(짧은 이름)을, 본문에는 name(정식 이름)을 쓴다.
 */
export const GLOSSARY = {
  url: "https://termglossary.kr/index.html",
  name: "논문용어사전",
  navLabel: "용어사전",
  description:
    "논문 읽다 막히는 학술용어를 쉬운 말로 풀어 설명합니다. 통계·의학·공학 등 98개 분야 37,000여 개.",
} as const;
