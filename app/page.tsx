import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { ContinueCard } from "@/components/ContinueCard";
import { StageStrip } from "@/components/StageStrip";
import { getToolCount } from "@/lib/stageToolMeta";
import { GLOSSARY } from "@/lib/site";
import { getFeaturedArticles } from "@/lib/articles";

const STUCK_POINTS = [
  {
    title: "뭘 연구해야 할지 모르겠다",
    body: "관심 가는 건 있는데, 그게 '연구'가 되는 건지 확신이 안 서는 상태.",
    href: "/guide/topic",
    cta: "주제 선정 단계로",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" />
        <path d="M12 17h.01" />
      </>
    ),
  },
  {
    title: "순서를 모른다",
    body: "선행연구부터 봐야 하는지, 일단 데이터부터 모아야 하는지 감이 안 옴.",
    href: "/guide",
    cta: "6단계 전체 보기",
    icon: (
      <>
        <path d="M10 6h10M10 12h10M10 18h10" />
        <path d="M4 6h1M4 12h1M4 18h1" />
      </>
    ),
  },
  {
    title: "자료가 흩어진다",
    body: "메모, 논문 캡처, 데이터 파일이 여기저기 흩어져서 나중에 못 찾음.",
    href: "/guide/prior-research",
    cta: "선행연구 조사 단계로",
    icon: (
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    ),
  },
  {
    title: "봐줄 사람이 없다",
    body: "막힌 부분을 물어볼 곳이 없어서 혼자 판단하고, 혼자 불안해함.",
    href: "/guide/methodology",
    cta: "자가검증 질문으로",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

export default function Home() {
  const stages = getAllStages();
  const articles = getFeaturedArticles(6);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-18 pb-12">
        <p className="text-xs font-semibold text-accent">
          무료 · 로그인 불필요
        </p>
        {/* 모바일(<640px)에서 text-4xl로는 첫 줄(13자)이 한 줄에 안 들어가
            "아니/라,"처럼 꺾이므로 글자만 줄인다(24px이면 두 줄 모두 수납).
            줄바꿈은 모든 크기에서 쉼표 뒤 고정. */}
        <h1 className="mt-3.5 text-2xl leading-[1.4] font-bold tracking-tight text-ink sm:text-4xl sm:leading-[1.18] md:text-5xl">
          연구는 시작이 반이 아니라,
          <br />
          순서가 반입니다.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-[1.65] text-ink-soft">
          주제를 정하는 법도, 선행연구를 찾는 법도 학교에서 가르쳐주지
          않습니다. 연구랩 가이드는 청소년 연구자가 자주 멈추는 지점마다
          체크리스트와 자가검증 질문을 놔뒀습니다. 순서대로 따라가도 되고,
          지금 막힌 단계만 펼쳐봐도 됩니다.
        </p>

        <Link
          href="/guide"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:opacity-85"
        >
          6단계 가이드 보기 →
        </Link>

        <ContinueCard
          stages={stages.map((s) => ({
            order: s.order,
            slug: s.slug,
            title: s.title,
            checklist: s.checklist,
          }))}
        />

        {/* 6단계 스트립 — '순서'라는 메시지를 히어로에서 바로 보여준다.
            진행 기록이 있으면 끝낸 단계·지금 할 단계를 표시한다. */}
        <StageStrip
          stages={stages.map((s) => ({
            order: s.order,
            slug: s.slug,
            title: s.title,
            estimatedWeeks: s.estimatedWeeks,
            checklist: s.checklist,
          }))}
        />
      </section>

      {/* 막히는 지점 */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-[22px] font-bold tracking-tight text-ink">
            이 중 하나라도 해당된다면
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {STUCK_POINTS.map((point) => (
              <Link
                key={point.title}
                href={point.href}
                className="card flex flex-col bg-bg px-5 py-5 transition hover:border-accent"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-accent">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {point.icon}
                  </svg>
                </span>
                <h3 className="mt-3.5 font-semibold text-ink">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {point.body}
                </p>
                <span className="mt-3.5 text-sm font-medium text-accent">
                  {point.cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6단계 — 차례처럼: 세리프 숫자 + 괘선 */}
      <section className="border-t border-ink">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[22px] font-bold tracking-tight text-ink">
              주제 선정부터 저널 투고까지
            </h2>
            <span className="text-xs text-ink-soft">
              차례
            </span>
          </div>
          <p className="mt-2 max-w-lg text-sm leading-[1.7] text-ink-soft">
            각 단계는 체크리스트와 자가검증 질문으로 끝납니다. 단계를
            건너뛰거나 보류해도 괜찮습니다 — 이건 진도표가 아니라 참고용
            가이드입니다.
          </p>

          <ol className="mt-7 border-b border-line">
            {stages.map((stage) => (
              <li key={stage.slug} className="border-t border-line">
                <Link
                  href={`/guide/${stage.slug}`}
                  className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_8.25rem] sm:gap-5"
                >
                  <span className="font-label text-2xl leading-none font-semibold text-ink">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <span className="block">
                    <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                      {stage.title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                      {stage.description}
                    </span>
                  </span>
                  <span className="col-start-2 flex gap-3 text-xs text-ink-soft sm:col-start-auto sm:flex-col sm:items-end sm:gap-1 sm:pt-1.5 sm:text-right">
                    <span>{stage.estimatedWeeks}</span>
                    <span>도구 {getToolCount(stage.slug)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 예시 연구 — 차례와 같은 괘선 리듬 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              예시로 보기
            </h2>
            <span className="text-xs text-ink-soft">
              교육용 예시
            </span>
          </div>
          <Link
            href="/example"
            className="group flex items-center justify-between gap-4 border-b border-line py-5"
          >
            <span className="block">
              <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                예시 연구 한 편 따라가기
              </span>
              <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                가상의 고등학생 연구 한 편을 6단계로 따라갑니다 (교육용 예시)
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-accent">
              보기 →
            </span>
          </Link>
        </div>
      </section>

      {/* 자료실 — 주제별 문서. 차례와 같은 괘선 리듬 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[22px] font-bold tracking-tight text-ink">
              한 가지를 깊게 보고 싶다면
            </h2>
            <Link
              href="/articles"
              className="shrink-0 text-xs text-accent hover:underline"
            >
              자료실 전체 →
            </Link>
          </div>
          <p className="mt-2 max-w-lg text-sm leading-[1.7] text-ink-soft">
            6단계 가이드가 순서를 다룬다면, 자료실은 주제 하나를 끝까지
            파고듭니다. 설문 문항을 어떻게 고쳐 쓰는지, p값을 어디까지 말해도
            되는지처럼 가이드에서 한두 문단으로 지나간 것들입니다.
          </p>

          <ul className="mt-7 border-b border-line">
            {articles.map((article, i) => (
              <li key={article.slug} className="border-t border-line">
                <Link
                  href={`/articles/${article.slug}`}
                  className="group grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-4"
                >
                  {/* order 값에 카테고리 간 빈틈이 있어 featured 목록의 배열 인덱스+1로 표시한다 */}
                  <span className="font-label text-lg leading-none font-semibold text-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="block">
                    <span className="block text-[16px] font-semibold text-ink transition group-hover:text-accent">
                      {article.title}
                    </span>
                    <span className="mt-1 block text-sm leading-[1.6] text-ink-soft">
                      {article.summary}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 함께 쓰는 도구 — 예시 섹션과 같은 괘선 리듬 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              함께 쓰면 좋은 도구
            </h2>
            <span className="text-xs text-ink-soft">
              별도 사이트
            </span>
          </div>
          <a
            href={GLOSSARY.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 border-b border-line py-5"
          >
            <span className="block">
              <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                {GLOSSARY.name}
              </span>
              <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                {GLOSSARY.description}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-accent">
              열기
              <span aria-hidden> ↗</span>
              <span className="sr-only"> (새 창에서 열림)</span>
            </span>
          </a>
        </div>
      </section>

      {/* 클로징 노트 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="max-w-md text-[15px] leading-[1.8] text-ink-soft">
            이건 진도표가 아니라 참고용 가이드입니다. 압박감보다 지금 할 수
            있는 한 걸음이 더 중요하니, 막힌 단계부터 펼쳐봐도 괜찮습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
