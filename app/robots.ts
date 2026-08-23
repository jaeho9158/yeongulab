import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API 프록시, 인쇄용 페이지, 개인 활동 기록은 색인 대상이 아니다
      disallow: ["/api/", "/guide/print", "/activity"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
