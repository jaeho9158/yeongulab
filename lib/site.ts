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
  (fromVercel ? `https://${fromVercel}` : "https://yeonguhallab.kr")
).replace(/\/+$/, "");

export const SITE_NAME = "연구할Lab";

/** 운영자 연락처 — 개인정보처리방침, 외부 API(OpenAlex polite pool) 식별용 */
export const SITE_CONTACT_EMAIL = "jaeho9158@gmail.com";

/**
 * Google AdSense 게시자 ID — 로더 스크립트(app/layout.tsx)·광고 슬롯
 * (components/AdSlot.tsx)·public/ads.txt가 전부 이 값과 같아야 한다.
 * 공개 식별자라 환경변수에 둘 이유가 없고, 두 곳에 두면 어긋난다(BR4).
 */
export const ADSENSE_CLIENT_ID = "ca-pub-7710727724213886";

/**
 * 광고 **슬롯**을 그릴 것인가. 로더 스크립트는 소유권 확인을 위해 항상 실리고,
 * 슬롯만 이 스위치를 따른다(승인 전 빈 점선 박스가 본문에 노출되는 것을 막는다).
 *
 * NEXT_PUBLIC_ 변수는 빌드 시 `process.env.NEXT_PUBLIC_ADSENSE_SLOTS` 리터럴이
 * 문자열로 치환된다 — 그래서 반드시 이 리터럴 형태로 접근하고, 값을 바꾸면
 * 재배포해야 한다. 함수인 이유: 모듈 상단 상수로 굳히면 vitest에서
 * vi.stubEnv가 import보다 늦어 테스트할 수 없다.
 */
export function adSlotsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADSENSE_SLOTS === "on";
}

/**
 * 운영 주체 — 소개 페이지·메타데이터·JSON-LD가 같은 값을 쓰도록 한 곳에 둔다.
 *
 * 개인이 아니라 단체다. JSON-LD의 author를 Person이 아니라 Organization으로
 * 내보내야 하므로(lib/jsonLd.ts) 이름만 바꾸면 안 되고 타입도 함께 봐야 한다.
 */
export const OPERATOR = {
  name: "지니어스 클럽",
} as const;

/**
 * 논문용어사전 — 연구할Lab과 함께 쓰는 별도 사이트.
 * 헤더 메뉴와 홈 섹션이 같은 값을 쓰도록 주소·문구를 여기 한 곳에 둔다.
 * 좁은 헤더에는 navLabel(짧은 이름)을, 본문에는 name(정식 이름)을 쓴다.
 */
export const GLOSSARY = {
  url: "https://termglossary.kr/index.html",
  name: "논문용어사전",
  navLabel: "용어사전",
  description:
    "논문 읽다가 막히는 학술용어를 쉬운 말로 풀어줍니다. 통계·의학·공학 등 98개 분야, 3만 7천여 개 용어를 담았습니다.",
} as const;
