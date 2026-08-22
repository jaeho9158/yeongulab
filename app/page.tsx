import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { ContinueCard } from "@/components/ContinueCard";

const STUCK_POINTS = [
  {
    title: "뭘 연구해야 할지 모르겠다",
    body: "관심 가는 건 있는데, 그게 '연구'가 되는 건지 확신이 안 서는 상태.",
    href: "/guide/topic",
    cta: "주제 선정 단계로",
  },
  {
    title: "순서를 모른다",
    body: "선행연구부터 봐야 하는지, 일단 데이터부터 모아야 하는지 감이 안 옴.",
    href: "/guide",
    cta: "6단계 전체 보기",
  },
  {
    title: "자료가 흩어진다",
    body: "메모, 논문 캡처, 데이터 파일이 여기저기 흩어져서 나중에 못 찾음.",
    href: "/guide/prior-research",
    cta: "선행연구 조사 단계로",
  },
  {
    title: "봐줄 사람이 없다",
    body: "막힌 부분을 물어볼 곳이 없어서 혼자 판단하고, 혼자 불안해함.",
    href: "/guide/methodology",
    cta: "자가검증 질문으로",
  },
];

export default function Home() {
  const stages = getAllStages();

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-14">
        <p className="text-sm font-medium text-accent">
          무료 · 로그인 불필요
        </p>
        <h1 className="mt-3 text-4xl leading-[1.2] font-bold tracking-tight text-ink sm:text-5xl">
          연구는 시작이 반이 아니라,
          <br />
          순서가 반입니다.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          주제를 정하는 법도, 선행연구를 찾는 법도 학교에서 가르쳐주지
          않습니다. 연구랩 가이드는 청소년 연구자가 자주 멈추는 지점마다
          체크리스트와 자가검증 질문을 놔뒀습니다. 순서대로 따라가도 되고,
          지금 막힌 단계만 펼쳐봐도 됩니다.
        </p>

        <Link
          href="/guide"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:opacity-85"
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
      </section>

      {/* 막히는 지점 */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-xl font-bold text-ink">
            이 중 하나라도 해당된다면
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {STUCK_POINTS.map((point) => (
              <Link
                key={point.title}
                href={point.href}
                className="card flex flex-col bg-bg px-5 py-5 transition hover:border-accent"
              >
                <h3 className="font-semibold text-ink">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {point.body}
                </p>
                <span className="mt-3 text-sm font-medium text-accent">
                  {point.cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6단계 리스트 */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-xl font-bold text-ink">
          주제 선정부터 저널 투고까지
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          각 단계는 체크리스트와 자가검증 질문으로 끝납니다. 단계를
          건너뛰거나 보류해도 괜찮습니다 — 이건 진도표가 아니라 참고용
          가이드입니다.
        </p>

        <ol className="mt-8 space-y-3">
          {stages.map((stage) => (
            <li key={stage.slug}>
              <Link
                href={`/guide/${stage.slug}`}
                className="card flex items-center gap-4 px-5 py-4 transition hover:border-accent"
              >
                <span className="step-badge">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-ink">
                    {stage.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    {stage.description}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs whitespace-nowrap text-ink-soft">
                  {stage.estimatedWeeks}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* 클로징 노트 */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <div className="note-box max-w-md px-6 py-5">
            <p className="text-sm text-ink-soft">
              완료율이나 총 소요기간은 일부러 보여주지 않습니다. 압박감보다
              지금 할 수 있는 한 걸음이 더 중요하니까요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
