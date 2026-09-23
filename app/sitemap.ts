import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getAllShowcases } from "@/lib/showcase";
import { getAllStages } from "@/lib/guide";
import { SITE_URL } from "@/lib/site";

// 단계·정적 페이지는 빌드 시점 — 실제로 코드와 함께 바뀐다.
// 글(articles)·사례(showcase)는 문서 자체의 날짜를 쓴다. 배포마다 40여 URL이
// 전부 "방금 수정됨"으로 나가면 크롤러가 lastmod 신호를 버리므로 (백로그 A2).
const lastModified = new Date();

/** frontmatter 날짜(YYYY-MM-DD)를 Date로. 형식이 깨졌으면 빌드 시각으로 물러선다. */
function docDate(value: string | undefined): Date {
  const parsed = value ? new Date(value) : new Date(NaN);
  return Number.isNaN(parsed.getTime()) ? lastModified : parsed;
}

/**
 * /activity(개인 기록)와 /guide/print(인쇄용, noindex)는 의도적으로 뺀다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const stages = getAllStages();
  const articles = getAllArticles();
  const showcases = getAllShowcases();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}/guide`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/example`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...stages.map((stage) => ({
      url: `${SITE_URL}/guide/${stage.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/tools`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: docDate(article.updated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    // 사례가 없을 때는 /showcase가 notFound()를 반환하므로 sitemap에도 넣지 않는다
    ...(showcases.length > 0
      ? [
          {
            url: `${SITE_URL}/showcase`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
          ...showcases.map((showcase) => ({
            url: `${SITE_URL}/showcase/${showcase.slug}`,
            lastModified: docDate(showcase.published),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          })),
        ]
      : []),
  ];
}
