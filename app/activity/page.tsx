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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        내 활동 기록
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
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

      <section className="card mt-6 px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="text-lg font-bold text-ink">내 연구 이력 아카이브</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          지금까지의 체크리스트와 메모를 인쇄용 페이지에서 한 번에 볼 수
          있습니다.
        </p>
        <Link
          href="/guide/print"
          className="mt-3 inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-accent"
        >
          인쇄용으로 보기
        </Link>
      </section>
    </div>
  );
}
