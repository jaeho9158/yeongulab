import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getAllStages } from "@/lib/guide";
import { SITE_URL } from "@/lib/site";

// 빌드 시점 고정 — 배포할 때마다 갱신된다
const lastModified = new Date();

/**
 * /activity(개인 기록)와 /guide/print(인쇄용, noindex)는 의도적으로 뺀다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const stages = getAllStages();
  const articles = getAllArticles();

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
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
  ];
}
