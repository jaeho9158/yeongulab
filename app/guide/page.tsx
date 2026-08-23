import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";
import { PlanExport } from "@/components/PlanExport";
import { PlanBackup } from "@/components/PlanBackup";
import { DataReset } from "@/components/DataReset";
import { ProgressOverview } from "@/components/ProgressOverview";
import { SectionHead } from "@/components/SectionHead";
import { StageToc } from "@/components/StageToc";
import { getToolCount } from "@/lib/stageToolMeta";

export const metadata: Metadata = {
  title: "연구 6단계 가이드",
  description:
    "주제 선정, 선행연구 조사, 방법론 설계, 데이터 수집, 논문화, 저널 투고까지 청소년 연구의 6단계를 안내합니다.",
};

export default function GuideIndexPage() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-label text-xs tracking-wider text-accent">가이드</p>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
        연구 6단계 가이드
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        각 단계를 열면 체크리스트, 자가검증 질문, 다음 단계로 가는 기준이
        나옵니다. 순서대로 봐도 되고, 지금 막힌 단계만 펼쳐서 봐도 됩니다.
        건너뛰거나 보류해도 괜찮습니다.
      </p>
      <p className="mt-3 text-sm">
        <Link
          href="/example"
          className="font-medium text-accent hover:underline"
        >
          완성된 예시가 궁금하다면 → 예시 연구 보기
        </Link>
      </p>

      <div className="mt-8">
        <ProgressOverview
          stages={stages.map((s) => ({
            order: s.order,
            slug: s.slug,
            title: s.title,
            checklist: s.checklist,
          }))}
        />
      </div>

      <section className="mt-10">
        <SectionHead title="차례" meta="진행도 · 도구" serif />
        <StageToc
          stages={stages.map((s) => ({
            order: s.order,
            slug: s.slug,
            title: s.title,
            description: s.description,
            checklist: s.checklist,
            toolCount: getToolCount(s.slug),
          }))}
        />
      </section>

      <section className="mt-12">
        <SectionHead title="내 기록" meta="이 브라우저에만 저장됨" />
        <div className="border-b border-line">
          <PlanExport stages={stages} />
          <PlanBackup />
          <DataReset />
        </div>
      </section>

      <div className="2xl:hidden">
        <AdSlot label="가이드 목록 하단 광고" />
      </div>
    </div>
  );
}
