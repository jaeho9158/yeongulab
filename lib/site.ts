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
