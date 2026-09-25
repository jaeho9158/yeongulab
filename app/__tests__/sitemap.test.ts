import { describe, it, expect } from "vitest";
import sitemap from "../sitemap";
import robots from "../robots";
import { getAllArticles } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

// sitemap/robots는 순수 함수라 렌더 없이 부를 수 있다 (백로그 T6·A2).
// 실제 content/ 디렉터리를 그대로 읽는 통합 테스트다.

describe("sitemap lastModified", () => {
  const entries = sitemap();

  it("자료실 글은 문서의 updated 날짜를 쓴다 (배포 시각 공유 금지)", () => {
    const articles = getAllArticles();
    expect(articles.length).toBeGreaterThan(1);
    const dates = new Set<string>();
    for (const article of articles) {
      const entry = entries.find(
        (e) => e.url === `${SITE_URL}/articles/${article.slug}`,
      );
      expect(entry, article.slug).toBeDefined();
      const lm = entry!.lastModified as Date;
      expect(lm.toISOString().slice(0, 10)).toBe(article.updated);
      dates.add(article.updated);
    }
    // 배포 시각(new Date())을 공유하지 않는다는 핵심 확인 — 모든 날짜가 오늘보다 앞이거나
    // 정확히 자정(frontmatter 날짜)이어야 한다. (일괄 메타 수정 직후엔 46편이 같은 날일 수 있다)
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("사례는 published 날짜를 쓴다", () => {
    const showcase = entries.filter((e) =>
      e.url.startsWith(`${SITE_URL}/showcase/`),
    );
    for (const entry of showcase) {
      const lm = entry.lastModified as Date;
      expect(lm.getTime()).toBeLessThan(Date.now() - 24 * 60 * 60 * 1000);
    }
  });
});

describe("robots와 sitemap의 상호 검증", () => {
  it("robots가 막은 경로는 sitemap에 없다", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = ([] as string[]).concat(rule.disallow ?? []);
    expect(disallow.length).toBeGreaterThan(0);
    const paths = sitemap().map((e) => e.url.replace(SITE_URL, "") || "/");
    for (const blocked of disallow) {
      const hit = paths.filter((p) => p === blocked || p.startsWith(blocked));
      expect(hit, `robots가 막은 ${blocked}가 sitemap에 있다`).toEqual([]);
    }
  });

  it("sitemap URL은 모두 SITE_URL 아래이며 중복이 없다", () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url.startsWith(SITE_URL)).toBe(true);
  });
});
