import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { StageDurations } from "@/components/StageDurations";

export const metadata: Metadata = {
  title: "내 활동 기록",
  description: "내 연구 이력을 스스로 돌아보기 위한 활동 기록 페이지입니다.",
};

export default function ActivityPage() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-label text-xs tracking-wider text-accent">기록</p>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
        내 활동 기록
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        생기부 제출용이 아니라, 내 연구 이력을 스스로 돌아보기 위한
        페이지입니다. 이 기기의 브라우저에만 저장되며, 언제 어떤 활동을
        했는지 담백하게 보여줍니다.
      </p>

      <ActivityHeatmap />

      <StageDurations
        stages={stages.map((s) => ({
          order: s.order,
          slug: s.slug,
          title: s.title,
          checklistCount: s.checklist.length,
        }))}
      />

      <section className="mt-10 grid items-center gap-4 border-t border-ink border-b border-b-line py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            내 연구 이력 아카이브
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            지금까지의 체크리스트와 메모를 인쇄용 페이지에서 한 번에 볼 수
            있습니다.
          </p>
        </div>
        <Link
          href="/guide/print"
          className="w-fit rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink transition hover:border-accent"
        >
          인쇄용으로 보기
        </Link>
      </section>
    </div>
  );
}
