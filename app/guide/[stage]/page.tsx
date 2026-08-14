import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllStages, getStageBySlug } from "@/lib/guide";
import { StageStamp } from "@/components/StageStamp";
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

  const prev = stages.find((s) => s.order === stage.order - 1);
  const next = stages.find((s) => s.order === stage.order + 1);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/guide"
        className="font-label text-xs uppercase tracking-widest text-ink-soft hover:text-stamp"
      >
        ← 전체 가이드
      </Link>

      <div className="mt-6 flex items-start gap-5">
        <StageStamp order={stage.order} weeks={stage.estimatedWeeks} />
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-ink-soft">
            {stage.order} / {stages.length}단계
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            {stage.title}
          </h1>
        </div>
      </div>

      <div className="notebook-rule mt-10 rounded-sm border border-rule-strong px-6 py-6 sm:px-10 sm:py-8">
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-stamp prose-a:no-underline hover:prose-a:underline">
          <MDXRemote
            source={stage.content}
            options={{
              mdxOptions: { remarkPlugins: [remarkGfm] },
            }}
          />
        </div>
      </div>

      <AdSlot label="본문 하단 광고" />

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-rule-strong/60 pt-8">
        {prev ? (
          <Link
            href={`/guide/${prev.slug}`}
            className="font-label text-xs uppercase tracking-widest text-ink-soft hover:text-stamp"
          >
            ← {prev.order}. {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/guide/${next.slug}`}
            className="rounded-full bg-ink px-6 py-3 font-label text-xs font-medium uppercase tracking-widest text-paper transition hover:bg-stamp"
          >
            다음: {next.title} →
          </Link>
        )}
      </div>
    </article>
  );
}
