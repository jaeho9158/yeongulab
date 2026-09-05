import { OPERATOR, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * JSON-LD 생성기 — 순수 함수만 모아둔다 (컴포넌트 아님).
 * 검색엔진이 페이지 성격(글인지, 누가 썼는지, 언제 갱신됐는지)을
 * 정확히 읽도록 schema.org 구조화 데이터를 만든다.
 *
 * 원칙: 실제로 아는 값만 넣는다. 모르는 필드(예: 이미지, 정확한 발행일)는
 * 지어내지 않고 아예 뺀다.
 */

/** SITE_URL과 합쳐 절대 URL을 만든다. path는 "/"로 시작해야 한다. */
function toAbsoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export type ArticleJsonLdInput = {
  title: string;
  description: string;
  /** "2026-08-30" 형식. */
  updated: string;
  /** 이 문서의 경로, 예: "/articles/faq" */
  path: string;
};

export function articleJsonLd(input: ArticleJsonLdInput): object {
  const url = toAbsoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    // datePublished를 따로 추적하지 않는다 (콘텐츠 관리 방식상 최초 작성일
    // 기록이 없다) — 부정확한 값을 지어내는 대신 갱신일(updated)을
    // datePublished/dateModified 양쪽에 그대로 쓴다.
    datePublished: input.updated,
    dateModified: input.updated,
    author: {
      "@type": "Person",
      name: OPERATOR.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    inLanguage: "ko",
  };
}

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}

/**
 * JSON.stringify 결과를 <script> 태그에 안전하게 넣기 위한 이스케이프.
 * "<"를 유니코드 이스케이프로 바꿔 </script> 조기 종료나 삽입된 마크업으로
 * 인한 XSS를 막는다. JSON 문법상 <는 "<"와 동치라 파싱 결과는 그대로다.
 */
export function serializeJsonLd(obj: object): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
