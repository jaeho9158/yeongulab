import type { Metadata } from "next";
import Link from "next/link";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_KEYS,
  getArticlesByCategory,
  getPinnedArticle,
} from "@/lib/articles";

export const metadata: Metadata = {
  title: "자료실 — 청소년 연구에 필요한 주제별 안내",
  description:
    "설문 문항 작성, 통계 해석, 연구 윤리, 영어 논문 읽기, 발표 준비까지. 6단계 가이드에서 짧게 지나간 주제를 하나씩 깊게 다룬 문서 모음입니다.",
  keywords: [
    "청소년 연구 자료",
    "탐구보고서 쓰는 법",
    "설문 문항 작성",
    "연구 윤리",
    "논문 읽는 법",
  ],
};

export default function ArticlesPage() {
  const pinned = getPinnedArticle();
  const byCategory = getArticlesByCategory();
  const activeCategories = ARTICLE_CATEGORY_KEYS.filter(
    (key) => byCategory[key].length > 0,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">자료실</h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        6단계 가이드가 연구의 <strong className="text-ink">순서</strong>를
        다룬다면, 자료실은 한 가지 주제를 깊게 파고듭니다. 설문 문항을 어떻게
        고쳐 쓰는지, p값을 어디까지 말해도 되는지, 어디서부터가 표절인지처럼
        가이드에서 한두 문단으로 지나간 것들을 따로 모았습니다.
      </p>
      <p className="mt-3 text-[17px] leading-[1.7] text-ink-soft">
        순서대로 읽을 필요는 없습니다. 지금 막힌 것부터 펼쳐보세요.
      </p>

      {pinned && (
        <Link href={`/articles/${pinned.slug}`} className="card mt-8 block">
          <p className="text-xs font-medium text-accent">먼저 읽어보세요</p>
          <p className="mt-1.5 text-[17px] font-semibold text-ink">
            {pinned.title}
          </p>
          <p className="mt-1.5 text-sm leading-[1.6] text-ink-soft">
            {pinned.summary}
          </p>
        </Link>
      )}

      {/* 카테고리가 늘어나면 한 화면에 다 안 들어오므로, 섹션 앵커로 가는
          미니 목차를 앞에 둔다 */}
      <nav
        aria-label="자료실 분류"
        className="nav-scroll mt-8 flex gap-1 overflow-x-auto border-b border-line pb-3"
      >
        {activeCategories.map((key) => (
          <a
            key={key}
            href={`#${key}`}
            // outline-offset을 음수로: nav가 overflow-x-auto라 overflow-y까지
            // auto로 계산돼 바깥에 그리는 기본 포커스 링(+2px)이 위아래로
            // 잘린다. SiteNav의 항목과 같은 처리다.
            // min-h-11: px-3 py-1.5는 약 24~34px이라 터치 타겟이 작다.
            className="flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 py-1.5 text-sm whitespace-nowrap text-ink-soft transition hover:text-ink focus-visible:outline-offset-[-2px]"
          >
            {ARTICLE_CATEGORIES[key].label}
          </a>
        ))}
      </nav>

      {activeCategories.map((key) => {
        const category = ARTICLE_CATEGORIES[key];
        const items = byCategory[key];
        return (
          <section key={key} id={key} className="scroll-mt-24 mt-10">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {category.label}
            </h2>
            <p className="mt-1.5 text-sm leading-[1.6] text-ink-soft">
              {category.intro}
            </p>
            <ol className="mt-5 border-b border-line">
              {items.map((article, i) => (
                <li key={article.slug} className="border-t border-line">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="group grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-5 sm:gap-5"
                  >
                    {/* order 값은 카테고리 간 번호에 빈틈이 있어(예: search는 6부터) 배열 인덱스+1로 표시한다 */}
                    <span className="font-label text-xl leading-none font-semibold text-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block">
                      <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                        {article.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                        {article.summary}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-sm leading-[1.7] text-ink-soft">
          연구를 처음부터 순서대로 밟고 싶다면{" "}
          <Link href="/guide" className="text-accent hover:underline">
            6단계 가이드
          </Link>
          부터 보세요. 완성된 연구 한 편이 어떻게 생겼는지 궁금하다면{" "}
          <Link href="/example" className="text-accent hover:underline">
            예시 연구
          </Link>
          가 있습니다.
        </p>
      </div>
    </div>
  );
}
