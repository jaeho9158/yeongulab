import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllStages, getStageBySlug } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";
import { ChecklistCard } from "@/components/ChecklistCard";
import { ReflectionBox } from "@/components/ReflectionBox";
import { StageRail } from "@/components/StageRail";
import { ToolAccordion, getToolCount } from "@/components/StageTools";

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
    <div className="mx-auto grid max-w-[60rem] items-start gap-12 px-4 py-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
      <StageRail
        stages={stages.map((s) => ({
          order: s.order,
          slug: s.slug,
          title: s.title,
          checklistCount: s.checklist.length,
        }))}
        currentSlug={stage.slug}
        toolCount={getToolCount(stage.slug)}
      />

      <article className="min-w-0">
        <Link
          href="/guide"
          className="-my-3 -ml-1 flex w-fit items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink lg:hidden"
        >
          ← 전체 가이드
        </Link>

        <div className="mt-6 flex items-center gap-4 lg:mt-0">
          <span className="step-badge">
            {String(stage.order).padStart(2, "0")}
          </span>
          <div>
            <p className="font-label text-xs text-ink-soft">
              {stage.order} / {stages.length}단계 · {stage.estimatedWeeks}
            </p>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-ink">
              {stage.title}
            </h1>
          </div>
        </div>

        <div
          id="content"
          className="prose prose-neutral mt-8 max-w-none scroll-mt-24 prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-ink prose-td:text-ink-soft"
        >
          <MDXRemote
            source={stage.content}
            options={{
              mdxOptions: { remarkPlugins: [remarkGfm] },
            }}
            components={{
              table: (props) => (
                <div className="overflow-x-auto">
                  <table {...props} />
                </div>
              ),
            }}
          />
        </div>

        <ToolAccordion slug={stage.slug} />

        <div id="checklist" className="scroll-mt-24">
          <ChecklistCard slug={stage.slug} items={stage.checklist} />
        </div>
        <div id="self-check" className="scroll-mt-24">
          <ReflectionBox slug={stage.slug} questions={stage.selfCheck} />
        </div>

        <div className="2xl:hidden">
          <AdSlot label="본문 하단 광고" />
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-8">
          {prev ? (
            <Link
              href={`/guide/${prev.slug}`}
              className="-my-3 -ml-1 flex items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink"
            >
              ← {prev.order}. {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/guide/${next.slug}`}
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:opacity-85"
            >
              다음: {next.title} →
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
