import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { extractHeadings } from "@/lib/guide";
import { getAllStages } from "@/lib/guide";
import { articleJsonLd, breadcrumbJsonLd, serializeJsonLd } from "@/lib/jsonLd";

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articles = getAllArticles();
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const stage = article.relatedStage
    ? getAllStages().find((s) => s.slug === article.relatedStage)
    : undefined;

  // 본문 H2를 목차로 쓴다. 가이드 페이지와 같은 방식으로, 문서에서 몇 번째
  // H2인지로 id를 집어 목차와 본문이 어긋나지 않게 한다.
  const headings = extractHeadings(article.content);
  let renderedH2 = 0;

  const jsonLd = [
    articleJsonLd({
      title: article.title,
      description: article.description,
      updated: article.updated,
      path: `/articles/${article.slug}`,
    }),
    breadcrumbJsonLd([
      { name: "홈", url: "/" },
      { name: "자료실", url: "/articles" },
      { name: article.title, url: `/articles/${article.slug}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:py-12">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // serializeJsonLd가 "<"를 이스케이프해 XSS를 막는다
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <Link
        href="/articles"
        className="-my-3 -ml-1 flex w-fit items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink"
      >
        ← 자료실
      </Link>

      <h1 className="mt-5 text-3xl leading-[1.3] font-bold tracking-tight text-ink">
        {article.title}
      </h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        {article.description}
      </p>
      <p className="mt-3 text-xs text-ink-soft">
        마지막 수정 {article.updated}
      </p>

      {headings.length > 2 && (
        <nav
          aria-label="이 문서의 목차"
          className="mt-7 border-t border-b border-line py-4"
        >
          <p className="text-xs font-medium text-ink-soft">이 문서에서</p>
          <ul className="mt-2 space-y-1">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="text-sm text-ink-soft hover:text-accent"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-ink prose-td:text-ink-soft">
        <MDXRemote
          source={article.content}
          options={{
            // 가이드 본문과 같은 이유로 singleTilde를 끈다 — "3~4주"처럼
            // 물결표가 두 번 나오면 그 사이가 취소선이 되는 것을 막는다.
            mdxOptions: {
              remarkPlugins: [[remarkGfm, { singleTilde: false }]],
            },
          }}
          components={{
            h2: (props) => (
              <h2
                {...props}
                id={headings[renderedH2++]?.id}
                className="scroll-mt-24"
              />
            ),
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

      <div className="mt-10 border-t border-line pt-5">
        <p className="text-xs text-ink-soft">자료실의 다른 문서</p>
        <ul className="mt-2 space-y-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/articles/${other.slug}`}
                className="text-[15px] text-ink-soft hover:text-accent"
              >
                {other.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
