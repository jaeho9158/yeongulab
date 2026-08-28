import fs from "fs";
import path from "path";
import matter from "gray-matter";

const GUIDE_DIR = path.join(process.cwd(), "content", "guide");

export type GuideStage = {
  order: number;
  slug: string;
  title: string;
  description: string;
  estimatedWeeks: string;
  keywords: string[];
  checklist: string[];
  selfCheck: string[];
  content: string;
};

function readStageFile(filename: string): GuideStage {
  const raw = fs.readFileSync(path.join(GUIDE_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  return {
    order: data.order,
    slug: data.slug,
    title: data.title,
    description: data.description,
    estimatedWeeks: data.estimatedWeeks,
    keywords: data.keywords ?? [],
    checklist: data.checklist ?? [],
    selfCheck: data.selfCheck ?? [],
    content,
  };
}

export function getAllStages(): GuideStage[] {
  const files = fs.readdirSync(GUIDE_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map(readStageFile).sort((a, b) => a.order - b.order);
}

export function getStageBySlug(slug: string): GuideStage | undefined {
  return getAllStages().find((s) => s.slug === slug);
}

export type Heading = { id: string; text: string };

/**
 * 제목 → 앵커 id. 한글은 그대로 두고(URL에서 퍼센트 인코딩되지만 동작한다)
 * 공백만 하이픈으로 바꾼다.
 */
function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      // 링크·강조 같은 인라인 마크다운 기호는 제외하고 글자만 남긴다
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}

/**
 * 같은 제목이 두 번 나와도 id가 겹치지 않게 번호를 붙이는 슬러그 생성기.
 *
 * 레일 목차와 본문 <h2>가 **같은 순서로 같은 생성기 규칙**을 쓰기 때문에
 * 두 곳의 id가 어긋날 수 없다. 지금은 파일 안에 중복 제목이 없지만,
 * 나중에 본문을 고치다 중복이 생겨도 앵커가 깨지지 않도록 둔다.
 */
export function makeSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base = slugify(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/**
 * 본문의 H2 목록 — 단계 페이지 왼쪽 레일의 목차로 쓴다.
 * 코드펜스(```) 안의 "## "는 제목이 아니므로 건너뛴다.
 */
export function extractHeadings(content: string): Heading[] {
  const slug = makeSlugger();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of content.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      const text = match[1];
      headings.push({ id: slug(text), text });
    }
  }
  return headings;
}
