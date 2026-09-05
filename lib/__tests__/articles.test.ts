import { describe, it, expect } from "vitest";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_KEYS,
  getAdjacentInCategory,
  getAllArticles,
  getArticlesByCategory,
  getFeaturedArticles,
  isArticleCategory,
} from "../articles";
import { extractInternalLinks } from "../articleLinks";
import {
  STAGE_SLUGS,
  STAGE_TOOL_TITLES,
  TOOL_IDS,
  isStageSlug,
} from "../stageToolMeta";

// 실제 content/articles 디렉터리를 그대로 읽는 통합 테스트다 (ogFont.test.ts와 같은 방식).

describe("ARTICLE_CATEGORIES", () => {
  it("모든 카테고리 키에 label과 intro가 있다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      expect(ARTICLE_CATEGORIES[key].label).toBeTruthy();
      expect(ARTICLE_CATEGORIES[key].intro).toBeTruthy();
    }
  });
});

describe("getAllArticles", () => {
  it("카테고리 순 → order 순으로 정렬된다", () => {
    const all = getAllArticles();
    let prevCategoryIndex = -1;
    let prevOrder = -Infinity;
    for (const article of all) {
      const categoryIndex = article.category
        ? ARTICLE_CATEGORY_KEYS.indexOf(article.category)
        : -1;
      if (categoryIndex !== prevCategoryIndex) {
        expect(categoryIndex).toBeGreaterThanOrEqual(prevCategoryIndex);
        prevOrder = -Infinity;
      } else {
        expect(article.order).toBeGreaterThanOrEqual(prevOrder);
      }
      prevCategoryIndex = categoryIndex;
      prevOrder = article.order;
    }
  });

  it("미분류 문서는 정확히 하나이고 faq다", () => {
    const uncategorized = getAllArticles().filter((a) => !a.category);
    expect(uncategorized).toHaveLength(1);
    expect(uncategorized[0].slug).toBe("faq");
  });

  it("분류된 문서의 category는 모두 유효한 키다", () => {
    const categorized = getAllArticles().filter((a) => a.category);
    for (const article of categorized) {
      expect(ARTICLE_CATEGORY_KEYS).toContain(article.category);
    }
  });
});

describe("getArticlesByCategory", () => {
  it("모든 카테고리 키가 존재한다", () => {
    const byCategory = getArticlesByCategory();
    for (const key of ARTICLE_CATEGORY_KEYS) {
      expect(byCategory[key]).toBeDefined();
      expect(Array.isArray(byCategory[key])).toBe(true);
    }
  });
});

describe("getFeaturedArticles", () => {
  it("최대 6편, 전부 featured다", () => {
    const featured = getFeaturedArticles(6);
    expect(featured.length).toBeLessThanOrEqual(6);
    for (const article of featured) {
      expect(article.featured).toBe(true);
    }
  });
});

describe("카테고리별 문서 순서", () => {
  const byCategory = getArticlesByCategory();

  it("topic 순서", () => {
    expect(byCategory.topic.map((a) => a.slug)).toEqual([
      "topic-ideas",
      "question-vs-researchable",
      "from-curriculum",
      "from-a-paper",
      "why-topics-go-stale",
      "right-sized-topic",
      "replication-is-research",
      "public-data-topics",
    ]);
  });

  it("search 순서", () => {
    expect(byCategory.search.map((a) => a.slug)).toEqual([
      "start-with-reviews",
      "riss-kci",
      "pubmed-mesh",
      "free-full-text",
      "citation-chaining",
      "reading-english-papers",
      "figure-first",
      "borrowing-methods",
      "scholar-alerts",
    ]);
  });

  it("method 순서", () => {
    expect(byCategory.method.map((a) => a.slug)).toEqual([
      "question-to-test",
      "control-group-mistakes",
      "small-sample",
      "survey-questions",
      "research-ethics",
      "lab-notebook",
      "archiving-by-semester",
    ]);
  });

  it("writing 순서", () => {
    expect(byCategory.writing.map((a) => a.slug)).toEqual([
      "statistics",
      "negative-results",
      "limitations",
      "abstract-and-title",
      "presentation",
      "finding-calls",
    ]);
  });
});

describe("getAdjacentInCategory", () => {
  it("카테고리 첫 글(question-to-test)은 prev가 없다", () => {
    const { prev, next } = getAdjacentInCategory("question-to-test");
    expect(prev).toBeUndefined();
    expect(next?.slug).toBe("control-group-mistakes");
  });

  it("중간 글(abstract-and-title)은 앞뒤가 모두 있다", () => {
    const { prev, next } = getAdjacentInCategory("abstract-and-title");
    expect(prev?.slug).toBe("limitations");
    expect(next?.slug).toBe("presentation");
  });

  it("카테고리 마지막 글(scholar-alerts)은 next가 없다", () => {
    const { prev, next } = getAdjacentInCategory("scholar-alerts");
    expect(prev?.slug).toBe("borrowing-methods");
    expect(next).toBeUndefined();
  });

  it("faq는 prev·next 모두 undefined", () => {
    const { prev, next } = getAdjacentInCategory("faq");
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });
});

describe("isArticleCategory", () => {
  it("유효한 카테고리 값은 true다", () => {
    expect(isArticleCategory("topic")).toBe(true);
  });

  it("프로토타입 키·빈 문자열·undefined는 false다", () => {
    expect(isArticleCategory("toString")).toBe(false);
    expect(isArticleCategory("")).toBe(false);
    expect(isArticleCategory(undefined)).toBe(false);
  });
});

// § 자료실 글끼리 거는 내부 링크는 렌더링 시점에 검증되지 않는다. 존재하지
// 않는 slug를 걸어도 빌드는 통과하고, 배포된 뒤 독자가 404를 만나야 알게
// 된다. 실제로 R3 글들이 아직 없는 /articles/from-a-paper 등을 걸었던 적이
// 있어서, 그 상태가 다시 조용히 배포되지 않도록 여기서 막는다.
describe("자료실 내부 링크", () => {
  const articles = getAllArticles();
  const slugs = new Set(articles.map((a) => a.slug));

  /** 도구 앵커 id → 그 도구가 속한 단계들 (같은 도구가 여러 단계에 있을 수 있다) */
  const stagesByToolId = new Map<string, string[]>();
  for (const stage of STAGE_SLUGS) {
    for (const title of STAGE_TOOL_TITLES[stage]) {
      const id = TOOL_IDS[title];
      stagesByToolId.set(id, [...(stagesByToolId.get(id) ?? []), stage]);
    }
  }

  // 자료실 글이 걸어도 되는 그 밖의 내부 경로. 새 페이지가 생기면 여기에
  // 추가한다 — 오타난 경로가 통과하지 않도록 화이트리스트로 둔다.
  const ALLOWED_PATHS = new Set([
    "/",
    "/guide",
    "/articles",
    "/tools",
    "/example",
    "/about",
    "/privacy",
    "/showcase",
    "/activity",
  ]);

  const linksOf = (article: (typeof articles)[number]) =>
    extractInternalLinks(article.content);

  it("모든 /articles/{slug} 링크가 실재하는 문서를 가리킨다", () => {
    const broken: string[] = [];
    for (const article of articles) {
      for (const link of linksOf(article)) {
        if (!link.path.startsWith("/articles/")) continue;
        const target = link.path.slice("/articles/".length);
        if (!slugs.has(target)) {
          broken.push(`${article.slug}.mdx → /articles/${target}`);
        }
      }
    }
    expect(broken, `존재하지 않는 자료실 문서로 링크:\n${broken.join("\n")}`).toEqual([]);
  });

  it("모든 /guide/{stage} 링크가 유효한 단계 slug를 쓴다", () => {
    const broken: string[] = [];
    for (const article of articles) {
      for (const link of linksOf(article)) {
        if (!link.path.startsWith("/guide/")) continue;
        const stage = link.path.slice("/guide/".length);
        if (!isStageSlug(stage)) {
          broken.push(`${article.slug}.mdx → /guide/${stage}`);
        }
      }
    }
    expect(broken, `알 수 없는 단계 slug:\n${broken.join("\n")}`).toEqual([]);
  });

  // 도구 앵커는 해당 단계 페이지에만 렌더된다. 다른 단계에 걸린 #tool-xxx는
  // 404는 아니지만 아무 데도 스크롤되지 않는 '조용한 실패'라 더 나쁘다.
  it("/guide 링크의 #tool-{id} 앵커가 그 단계에 실제로 있는 도구다", () => {
    const broken: string[] = [];
    for (const article of articles) {
      for (const link of linksOf(article)) {
        if (!link.path.startsWith("/guide/") || !link.hash) continue;
        if (!link.hash.startsWith("tool-")) continue;
        const stage = link.path.slice("/guide/".length);
        const id = link.hash.slice("tool-".length);
        const owners = stagesByToolId.get(id);
        if (!owners) {
          broken.push(`${article.slug}.mdx → 없는 도구 id "${id}"`);
        } else if (!owners.includes(stage)) {
          broken.push(
            `${article.slug}.mdx → /guide/${stage}#tool-${id} (이 도구는 ${owners.join(", ")} 단계에 있다)`,
          );
        }
      }
    }
    expect(broken, `도구 앵커 불일치:\n${broken.join("\n")}`).toEqual([]);
  });

  it("그 밖의 내부 경로는 허용 목록 안에 있다", () => {
    const unknown: string[] = [];
    for (const article of articles) {
      for (const link of linksOf(article)) {
        if (link.path.startsWith("/articles/") || link.path.startsWith("/guide/")) {
          continue;
        }
        if (!ALLOWED_PATHS.has(link.path)) {
          unknown.push(`${article.slug}.mdx → ${link.path}`);
        }
      }
    }
    expect(unknown, `허용 목록에 없는 내부 경로:\n${unknown.join("\n")}`).toEqual([]);
  });
});
