import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";
import { PlanExport } from "@/components/PlanExport";
import { PlanBackup } from "@/components/PlanBackup";
import { DataReset } from "@/components/DataReset";
import { ProgressOverview } from "@/components/ProgressOverview";

export const metadata: Metadata = {
  title: "연구 6단계 가이드",
  description:
    "주제 선정, 선행연구 조사, 방법론 설계, 데이터 수집, 논문화, 저널 투고까지 청소년 연구의 6단계를 안내합니다.",
};

export default function GuideIndexPage() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        연구 6단계 가이드
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        각 단계를 열면 체크리스트, 자가검증 질문, 다음 단계로 가는 기준이
        나옵니다. 순서대로 봐도 되고, 지금 막힌 단계만 펼쳐서 봐도 됩니다.
        건너뛰거나 보류해도 괜찮습니다.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/example" className="text-accent hover:underline">
          완성된 예시가 궁금하다면 → 예시 연구 보기
        </Link>
      </p>

      <div className="mt-10">
        <ProgressOverview
          stages={stages.map((s) => ({
            order: s.order,
            slug: s.slug,
            title: s.title,
            checklistCount: s.checklist.length,
          }))}
        />
        <PlanExport stages={stages} />
        <PlanBackup />
      </div>

      <div className="space-y-4">
        {stages.map((stage) => (
          <Link
            key={stage.slug}
            href={`/guide/${stage.slug}`}
            className="card flex items-center gap-5 px-5 py-5 transition hover:border-accent"
          >
            <span className="step-badge">
              {String(stage.order).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {stage.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {stage.description}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {stage.keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft"
                  >
                    #{kw}
                  </span>
                ))}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <DataReset />

      <div className="xl:hidden">
        <AdSlot label="가이드 목록 하단 광고" />
      </div>
    </div>
  );
}
