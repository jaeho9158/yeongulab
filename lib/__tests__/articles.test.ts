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

describe("getAdjacentInCategory", () => {
  it("research-ethics는 prev=survey-questions, next=undefined", () => {
    const { prev, next } = getAdjacentInCategory("research-ethics");
    expect(prev?.slug).toBe("survey-questions");
    expect(next).toBeUndefined();
  });

  it("faq는 prev·next 모두 undefined", () => {
    const { prev, next } = getAdjacentInCategory("faq");
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it("statistics는 next=abstract-and-title", () => {
    const { next } = getAdjacentInCategory("statistics");
    expect(next?.slug).toBe("abstract-and-title");
  });

  it("abstract-and-title는 prev=statistics, next=presentation", () => {
    const { prev, next } = getAdjacentInCategory("abstract-and-title");
    expect(prev?.slug).toBe("statistics");
    expect(next?.slug).toBe("presentation");
  });
});

describe("getAllArticles 순서 (writing)", () => {
  it("writing 카테고리는 [statistics, abstract-and-title, presentation] 순이다", () => {
    const writing = getAllArticles().filter((a) => a.category === "writing");
    expect(writing.map((a) => a.slug)).toEqual([
      "statistics",
      "abstract-and-title",
      "presentation",
    ]);
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
