import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * 사례 공유 아카이브 — 학생이 직접 보내온 연구 사례를 검토 후 mdx로 얹는다.
 * 사이트는 서버가 없어 자동 게시는 불가능하고, 운영자가 수동으로 파일을
 * 추가하는 방식이다. 그래서 디렉터리/파일이 아예 없어도 에러 없이 빈
 * 배열을 반환해야 한다(사례 0편 상태가 정상 상태).
 */
const SHOWCASE_DIR = path.join(process.cwd(), "content", "showcase");

export type SchoolLevel = "중학생" | "고등학생" | "기타";

export type Showcase = {
  slug: string;
  title: string;
  summary: string;
  schoolLevel: SchoolLevel;
  /** "익명" 또는 학생이 정한 닉네임 */
  byline: string;
  published: string;
  /** 이 사례와 이어지는 가이드 단계 slug (없을 수 있다) */
  relatedStage?: string;
  content: string;
};

function readShowcaseFile(filename: string): Showcase {
  const raw = fs.readFileSync(path.join(SHOWCASE_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    schoolLevel: data.schoolLevel,
    byline: data.byline,
    published: data.published,
    relatedStage: data.relatedStage,
    content,
  };
}

export function getAllShowcases(): Showcase[] {
  if (!fs.existsSync(SHOWCASE_DIR)) return [];
  return fs
    .readdirSync(SHOWCASE_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readShowcaseFile)
    .sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getShowcaseBySlug(slug: string): Showcase | undefined {
  return getAllShowcases().find((s) => s.slug === slug);
}
