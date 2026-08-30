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
  // "청소년 연구 6단계 가이드"를 그대로 타이틀 앞머리에 — 실제 검색어와
  // 일치할수록 구글이 그 구절을 굵게 강조해 보여준다.
  title: "청소년 연구 6단계 가이드",
  description:
    "청소년 연구 6단계 가이드: 주제 선정, 선행연구 조사, 방법론 설계, 데이터 수집, 논문화, 저널 투고까지 6단계를 무료로 안내합니다.",
};

export default function GuideIndexPage() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold text-accent">가이드</p>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
        연구 6단계 가이드
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        각 단계를 열면 체크리스트, 자가검증 질문, 다음 단계로 가는 기준이
        나옵니다. 순서대로 봐도 되고, 지금 막힌 단계만 펼쳐서 봐도 됩니다.
        건너뛰거나 보류해도 괜찮습니다.
      </p>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        6단계는 실제 연구가 진행되는 순서를 따릅니다. 무엇을 알아낼지 정하고
        (주제 선정), 이미 밝혀진 것을 확인하고(선행연구 조사), 확인할 방법을
        정하고(방법론 설계), 자료를 모으고(데이터 수집), 결과를 글로 옮기고
        (논문화), 다른 사람이 읽을 수 있는 곳에 내놓습니다(저널 투고).
        전체를 다 밟아야 하는 것은 아닙니다. 학교 수행평가라면 5단계에서
        끝내도 되고, 대회에 낼 계획이라면 6단계까지 이어집니다.
      </p>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        각 단계에는 그 시점에 필요한 도구가 함께 있습니다. 연구질문을 다듬는
        틀, 선행연구 검색, 표본 크기 계산, 설문 편향 점검, 통계 계산기, 인용
        형식 만들기 같은 것들입니다. 입력한 내용은 이 브라우저에만 저장되므로
        계정을 만들 필요가 없습니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link
          href="/example"
          className="font-medium text-accent hover:underline"
        >
          완성된 예시가 궁금하다면 → 예시 연구 보기
        </Link>
        <Link
          href="/articles"
          className="font-medium text-accent hover:underline"
        >
          주제별로 깊게 보려면 → 자료실
        </Link>
      </div>

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
