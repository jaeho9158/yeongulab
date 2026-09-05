import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllShowcases, getShowcaseBySlug } from "@/lib/showcase";
import { getAllStages } from "@/lib/guide";
import { articleJsonLd, breadcrumbJsonLd, serializeJsonLd } from "@/lib/jsonLd";

// 사례가 0편이면 생성할 경로도 없다. dynamicParams를 꺼서 없는 slug 요청이
// 서버 렌더로 새지 않고 정적으로 404가 되게 한다.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllShowcases().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getShowcaseBySlug(slug);
  if (!item) return {};
  return { title: item.title, description: item.summary };
}

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getShowcaseBySlug(slug);
  if (!item) notFound();

  const stage = item.relatedStage
    ? getAllStages().find((s) => s.slug === item.relatedStage)
    : undefined;

  const jsonLd = [
    articleJsonLd({
      title: item.title,
      description: item.summary,
      updated: item.published,
      path: `/showcase/${item.slug}`,
    }),
    breadcrumbJsonLd([
      { name: "홈", url: "/" },
      { name: "연구 사례", url: "/showcase" },
      { name: item.title, url: `/showcase/${item.slug}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:py-12">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // serializeJsonLd가 "<"를 이스케이프해 script 조기 종료를 막는다
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}

      <Link
        href="/showcase"
        className="-my-3 -ml-1 flex w-fit items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink"
      >
        ← 연구 사례
      </Link>

      <h1 className="mt-5 text-3xl leading-[1.3] font-bold tracking-tight text-ink">
        {item.title}
      </h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        {item.summary}
      </p>
      <p className="mt-3 text-xs text-ink-soft">
        {item.schoolLevel} · {item.byline} · {item.published}
      </p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-ink prose-td:text-ink-soft">
        <MDXRemote
          source={item.content}
          options={{
            // 자료실·가이드 본문과 같은 이유로 물결표 하나는 취소선이 아니다
            mdxOptions: { remarkPlugins: [[remarkGfm, { singleTilde: false }]] },
          }}
          components={{
            table: (props) => (
              <div className="overflow-x-auto">
                <table {...props} className="min-w-max" />
              </div>
            ),
          }}
        />
      </div>

      {stage && (
        <div className="mt-12 border-t border-ink pt-5">
          <p className="text-xs text-ink-soft">이어지는 단계</p>
          <Link
            href={`/guide/${stage.slug}`}
            className="group mt-1.5 flex items-baseline justify-between gap-4"
          >
            <span className="text-[17px] font-semibold text-ink transition group-hover:text-accent">
              {stage.order}단계: {stage.title}
            </span>
            <span className="shrink-0 text-sm font-medium text-accent">
              보기 →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
