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
