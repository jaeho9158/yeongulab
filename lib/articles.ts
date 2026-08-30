import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * 자료실 문서 — 6단계 가이드가 '순서'를 다룬다면, 여기는 한 가지 주제를
 * 깊게 파는 독립 문서다. 가이드와 중복되지 않는 범위만 다루고, 겹치는
 * 지점은 해당 단계로 링크한다.
 */
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type Article = {
  order: number;
  slug: string;
  title: string;
  description: string;
  /** 목록에 쓰는 한 줄 요약 (description보다 짧다) */
  summary: string;
  keywords: string[];
  /** 이 문서와 이어지는 가이드 단계 slug (없을 수 있다) */
  relatedStage?: string;
  updated: string;
  content: string;
};

function readArticleFile(filename: string): Article {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  return {
    order: data.order,
    slug: data.slug,
    title: data.title,
    description: data.description,
    summary: data.summary ?? data.description,
    keywords: data.keywords ?? [],
    relatedStage: data.relatedStage,
    updated: data.updated,
    content,
  };
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readArticleFile)
    .sort((a, b) => a.order - b.order);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}
