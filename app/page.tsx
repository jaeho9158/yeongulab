import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { ContinueCard } from "@/components/ContinueCard";
import { getToolCount } from "@/components/StageTools";

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

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-18 pb-12">
        <p className="font-label text-xs font-medium tracking-wider text-accent">
          무료 · 로그인 불필요
        </p>
        <h1 className="mt-3.5 text-4xl leading-[1.18] font-bold tracking-tight text-ink sm:text-5xl">
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
            checklistCount: s.checklist.length,
          }))}
        />

        {/* 6단계 스트립 — '순서'라는 메시지를 히어로에서 바로 보여준다 */}
        <ol className="card relative mt-11 grid grid-cols-3 gap-y-6 px-5 py-4.5 sm:grid-cols-6 sm:gap-y-0">
          <span
            aria-hidden
            className="absolute top-[31px] right-5 left-5 hidden h-px bg-line sm:block"
          />
          {stages.map((stage) => (
            <li key={stage.slug} className="relative">
              <Link href={`/guide/${stage.slug}`} className="group block">
                <span
                  className={`flex h-6.5 w-6.5 items-center justify-center rounded-full border font-label text-[11px] font-semibold transition group-hover:border-accent ${
                    stage.order === 1
                      ? "border-ink bg-ink text-bg"
                      : "border-line bg-bg text-ink"
                  }`}
                >
                  {String(stage.order).padStart(2, "0")}
                </span>
                <span className="mt-2.5 block text-[13px] font-semibold text-ink">
                  {stage.title}
                </span>
                <span className="mt-1 block font-label text-[11px] text-ink-soft">
                  {stage.estimatedWeeks.replace(/\s*\(.*\)|\s*\+.*$/, "")}
                </span>
              </Link>
            </li>
          ))}
        </ol>
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
            <h2 className="font-serif text-[22px] font-semibold text-ink">
              주제 선정부터 저널 투고까지
            </h2>
            <span className="font-label text-xs tracking-wider text-ink-soft">
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
                  <span className="font-serif text-[34px] leading-none font-medium text-ink">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <span className="block">
                    <span className="block font-serif text-[19px] font-semibold text-ink transition group-hover:text-accent">
                      {stage.title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                      {stage.description}
                    </span>
                  </span>
                  <span className="col-start-2 flex gap-3 font-label text-xs text-ink-soft sm:col-start-auto sm:flex-col sm:items-end sm:gap-1 sm:pt-1.5 sm:text-right">
                    <span>{stage.estimatedWeeks}</span>
                    <span className="text-[11px]">
                      도구 {getToolCount(stage.slug)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 클로징 노트 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="max-w-md font-serif text-base leading-[1.8] text-ink-soft">
            완료율이나 총 소요기간은 일부러 보여주지 않습니다. 압박감보다
            지금 할 수 있는 한 걸음이 더 중요하니까요.
          </p>
        </div>
      </section>
    </div>
  );
}
