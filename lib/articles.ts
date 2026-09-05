import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { buildOnlyCache } from "./contentCache";

/**
 * 자료실 문서 — 6단계 가이드가 '순서'를 다룬다면, 여기는 한 가지 주제를
 * 깊게 파는 독립 문서다. 가이드와 중복되지 않는 범위만 다루고, 겹치는
 * 지점은 해당 단계로 링크한다.
 */
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export const ARTICLE_CATEGORIES = {
  topic: { label: "주제 잡기", intro: "무엇을 연구할지 정하는 단계에서 막힐 때." },
  search: {
    label: "선행연구 찾고 읽기",
    intro: "논문을 찾고, 다 읽지 않고도 필요한 것을 꺼내는 기술.",
  },
  method: {
    label: "설계와 데이터",
    intro: "데이터를 모으기 전에 종이 위에서 끝내야 하는 판단들.",
  },
  writing: {
    label: "쓰기와 발표",
    intro: "결과를 글과 발표로 옮길 때 자주 어긋나는 지점.",
  },
} as const;
export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;
export const ARTICLE_CATEGORY_KEYS = Object.keys(
  ARTICLE_CATEGORIES,
) as ArticleCategory[];

export type Article = {
  /** 카테고리 안에서의 순서 (전역 순서가 아니다) */
  order: number;
  slug: string;
  title: string;
  description: string;
  /** 목록에 쓰는 한 줄 요약 (description보다 짧다) */
  summary: string;
  keywords: string[];
  /** 이 문서와 이어지는 가이드 단계 slug (없을 수 있다) */
  relatedStage?: string;
  /** FAQ만 undefined — 카테고리 없이 목록 맨 위에 고정 */
  category?: ArticleCategory;
  /** 홈 노출 여부. 기본 false */
  featured: boolean;
  updated: string;
  content: string;
};

/** category 값이 실제 ARTICLE_CATEGORIES 키인지 판별한다. */
export function isArticleCategory(value: unknown): value is ArticleCategory {
  return (
    typeof value === "string" && Object.hasOwn(ARTICLE_CATEGORIES, value)
  );
}

function readArticleFile(filename: string): Article {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf-8");
  const { data, content } = matter(raw);

  // 오타로 잘못된 카테고리를 쓰면 조용히 "분류 없음"으로 빠져 목록에서
  // 사라진다. 그 상태를 아무도 눈치채지 못하므로 빌드 때 바로 터뜨린다.
  // `in`은 프로토타입 키(toString 등)를 통과시킨다.
  if (data.category !== undefined && !isArticleCategory(data.category)) {
    throw new Error(
      `${filename}: 알 수 없는 category "${data.category}" — ARTICLE_CATEGORIES 키 중 하나여야 합니다`,
    );
  }

  return {
    order: data.order,
    slug: data.slug,
    title: data.title,
    description: data.description,
    summary: data.summary ?? data.description,
    keywords: data.keywords ?? [],
    relatedStage: data.relatedStage,
    category: data.category,
    featured: data.featured ?? false,
    updated: data.updated,
    content,
  };
}

/**
 * 빌드 1회당 166번 호출되던 자리라 프로덕션 빌드에서만 결과를 캐시한다.
 * 캐시 조건과 개발 모드 함정은 lib/contentCache.ts 주석 참고.
 */
export const getAllArticles = buildOnlyCache((): Article[] => {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readArticleFile)
    .sort((a, b) => {
      // 카테고리 순 (미분류는 맨 앞) → 카테고리 안에서는 order 순
      const ai = a.category ? ARTICLE_CATEGORY_KEYS.indexOf(a.category) : -1;
      const bi = b.category ? ARTICLE_CATEGORY_KEYS.indexOf(b.category) : -1;
      if (ai !== bi) return ai - bi;
      return a.order - b.order;
    });
});

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getArticlesByCategory(): Record<ArticleCategory, Article[]> {
  const all = getAllArticles();
  const result = {} as Record<ArticleCategory, Article[]>;
  for (const key of ARTICLE_CATEGORY_KEYS) {
    result[key] = all.filter((a) => a.category === key);
  }
  return result;
}

/**
 * 카테고리 없는 문서(FAQ)를 목록 맨 위 고정 카드로 쓰기 위한 조회.
 * 고정 자리는 하나뿐이라는 설계라서, 미분류 문서가 둘 이상이면 설계
 * 위반이므로 조용히 하나만 고르지 않고 바로 던진다.
 */
export function getPinnedArticle(): Article | undefined {
  const uncategorized = getAllArticles().filter((a) => !a.category);
  if (uncategorized.length > 1) {
    throw new Error(
      `고정 문서는 하나여야 하는데 카테고리 없는 문서가 ${uncategorized.length}개입니다: ${uncategorized
        .map((a) => a.slug)
        .join(", ")}`,
    );
  }
  return uncategorized[0];
}

/**
 * 홈에 노출할 문서. featured:true가 하나도 없으면 홈 섹션이 비어버리므로,
 * 그 경우엔 카테고리별 첫 글로 대체한다.
 */
export function getFeaturedArticles(limit = 6): Article[] {
  const all = getAllArticles();
  const featured = all.filter((a) => a.featured);
  if (featured.length > 0) return featured.slice(0, limit);

  const byCategory = getArticlesByCategory();
  const fallback = ARTICLE_CATEGORY_KEYS.map((key) => byCategory[key][0]).filter(
    (a): a is Article => a !== undefined,
  );
  return fallback.slice(0, limit);
}

/**
 * relatedStage → 문서 역인덱스. 문서 쪽엔 "이어지는 단계" 링크가 있지만
 * 단계 쪽엔 반대 방향이 없어서, 단계 페이지에서 "함께 읽기"로 보여주려면
 * 이 역방향 조회가 필요하다.
 */
export function getArticlesForStage(stageSlug: string): Article[] {
  return getAllArticles().filter((a) => a.relatedStage === stageSlug);
}

/** 같은 카테고리 안에서의 이전/다음 글. 미분류(FAQ)는 카테고리가 없어 둘 다 undefined. */
export function getAdjacentInCategory(
  slug: string,
): { prev?: Article; next?: Article } {
  const article = getArticleBySlug(slug);
  if (!article || !article.category) return {};
  const siblings = getArticlesByCategory()[article.category];
  const index = siblings.findIndex((a) => a.slug === slug);
  if (index === -1) return {};
  return { prev: siblings[index - 1], next: siblings[index + 1] };
}
