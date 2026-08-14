import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllStages, getStageBySlug } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";

export function generateStaticParams() {
  return getAllStages().map((stage) => ({ stage: stage.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}): Promise<Metadata> {
  const { stage: slug } = await params;
  const stage = getStageBySlug(slug);
  if (!stage) return {};
  return {
    title: `${stage.order}단계: ${stage.title}`,
    description: stage.description,
    keywords: stage.keywords,
  };
}

export default async function GuideStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: slug } = await params;
  const stages = getAllStages();
  const stage = stages.find((s) => s.slug === slug);
  if (!stage) notFound();

  const next = stages.find((s) => s.order === stage.order + 1);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/guide"
        className="text-sm text-black/50 hover:underline dark:text-white/50"
      >
        ← 전체 가이드
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {stage.order}단계 · {stage.estimatedWeeks}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        {stage.title}
      </h1>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-current">
        <MDXRemote source={stage.content} />
      </div>

      <AdSlot label="본문 하단 광고" />

      {next && (
        <Link
          href={`/guide/${next.slug}`}
          className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          다음: {next.title} →
        </Link>
      )}
    </article>
  );
}
