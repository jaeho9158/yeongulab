import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllStages, getStageBySlug } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";
import { ChecklistCard } from "@/components/ChecklistCard";
import { ReflectionBox } from "@/components/ReflectionBox";
import { PriorResearchSearch } from "@/components/PriorResearchSearch";
import { ObjectiveTemplateGenerator } from "@/components/ObjectiveTemplateGenerator";
import { ResearchQuestionQuiz } from "@/components/ResearchQuestionQuiz";
import { SampleSizeCalculator } from "@/components/SampleSizeCalculator";
import { StatsCalculator } from "@/components/StatsCalculator";
import { CitationFormatter } from "@/components/CitationFormatter";
import { DeadlineTracker } from "@/components/DeadlineTracker";
import { VariableTableBuilder } from "@/components/VariableTableBuilder";
import { DisclosureGenerator } from "@/components/DisclosureGenerator";
import { SimpleChart } from "@/components/SimpleChart";
import { ImradChecker } from "@/components/ImradChecker";
import { ReferenceList } from "@/components/ReferenceList";
import { TopicIdeaGenerator } from "@/components/TopicIdeaGenerator";
import { PresentationQuestionBank } from "@/components/PresentationQuestionBank";
import { SpeechTimer } from "@/components/SpeechTimer";
import { SurveyBiasChecker } from "@/components/SurveyBiasChecker";
import { RandomSampler } from "@/components/RandomSampler";
import { LengthChecker } from "@/components/LengthChecker";
import { FigureCaptionHelper } from "@/components/FigureCaptionHelper";
import { SubmissionVenues } from "@/components/SubmissionVenues";
import { EthicsChecklist } from "@/components/EthicsChecklist";

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
        className="-my-3 -ml-1 flex w-fit items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink"
      >
        ← 전체 가이드
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="step-badge">
          {String(stage.order).padStart(2, "0")}
        </span>
        <div>
          <p className="text-sm text-ink-soft">
            {stage.order} / {stages.length}단계 · {stage.estimatedWeeks}
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-ink">
            {stage.title}
          </h1>
        </div>
      </div>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-ink prose-td:text-ink-soft">
        <MDXRemote
          source={stage.content}
          options={{
            mdxOptions: { remarkPlugins: [remarkGfm] },
          }}
        />
      </div>

      {stage.slug === "topic" && (
        <>
          <TopicIdeaGenerator />
          <ResearchQuestionQuiz />
        </>
      )}
      {stage.slug === "prior-research" && (
        <>
          <PriorResearchSearch />
          <ReferenceList />
        </>
      )}
      {stage.slug === "methodology" && (
        <>
          <ObjectiveTemplateGenerator />
          <VariableTableBuilder />
        </>
      )}
      {stage.slug === "data-collection" && (
        <>
          <SampleSizeCalculator />
          <SurveyBiasChecker />
          <RandomSampler />
        </>
      )}
      {stage.slug === "writing" && (
        <>
          <StatsCalculator />
          <SimpleChart />
          <FigureCaptionHelper />
          <ImradChecker />
          <LengthChecker />
          <CitationFormatter />
          <EthicsChecklist slug={stage.slug} />
        </>
      )}
      {stage.slug === "submission" && (
        <>
          <SubmissionVenues />
          <DisclosureGenerator />
          <PresentationQuestionBank />
          <SpeechTimer />
          <DeadlineTracker />
        </>
      )}

      <ChecklistCard slug={stage.slug} items={stage.checklist} />
      <ReflectionBox slug={stage.slug} questions={stage.selfCheck} />

      <div className="xl:hidden">
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
  );
}
