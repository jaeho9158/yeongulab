import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { extractHeadings, getAllStages, getStageBySlug } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";
import { ChecklistCard } from "@/components/ChecklistCard";
import { ReflectionBox } from "@/components/ReflectionBox";
import { StageRail } from "@/components/StageRail";
import { ToolAccordion } from "@/components/StageTools";
import { getToolCount } from "@/lib/stageToolMeta";

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

  // 본문 H2 목록을 레일 목차로 쓴다. 아래 h2 렌더러가 '문서에서 몇 번째
  // H2인가'로 같은 배열을 집어 id를 붙이므로, 제목 글자를 다시 해석하지
  // 않는다 — 링크·강조가 섞인 제목이 생겨도 레일과 본문이 어긋나지 않는다.
  const headings = extractHeadings(stage.content);
  let renderedH2 = 0;

  return (
    <div className="mx-auto grid max-w-[60rem] items-start gap-12 px-4 py-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
      <StageRail
        stages={stages.map((s) => ({
          order: s.order,
          slug: s.slug,
          title: s.title,
          checklist: s.checklist,
        }))}
        currentSlug={stage.slug}
        headings={headings}
        toolCount={getToolCount(stage.slug)}
        selfCheckCount={stage.selfCheck.length}
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
            <p className="text-xs text-ink-soft">
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
              // singleTilde: false — remark-gfm은 기본으로 물결표 하나(~)도 취소선
              // 기호로 먹는다. 본문에 "3~4주"처럼 물결표 두 개가 한 문장에 있으면
              // 그 사이가 통째로 취소선 처리되므로, GFM 표준대로 ~~두 개~~만
              // 취소선으로 인정하게 막는다.
              mdxOptions: {
                remarkPlugins: [[remarkGfm, { singleTilde: false }]],
              },
            }}
            components={{
              // 레일 목차가 가리킬 앵커. scroll-mt-24(96px)는 StageRail의
              // ANCHOR_SCROLL_MARGIN_PX와 짝 — 바꾸면 같이 바꿀 것.
              // scroll-mt는 클릭해서 이동했을 때
              // 제목이 화면 맨 위에 딱 붙지 않도록 띄워둔다.
              h2: (props) => (
                <h2
                  id={headings[renderedH2++]?.id}
                  className="scroll-mt-24"
                  {...props}
                />
              ),
              table: (props) => (
                <div className="overflow-x-auto">
                  {/* prose의 기본 table 스타일이 width:100%라 화면보다 넓어질 일이
                      없어 overflow-x-auto가 절대 발동하지 않고 칸만 눌린다.
                      min-w-max로 표가 내용만큼 넓어지게 해야 좁은 화면에서
                      실제로 가로 스크롤된다. */}
                  <table {...props} className="min-w-max" />
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
