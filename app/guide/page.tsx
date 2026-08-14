import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { AdSlot } from "@/components/AdSlot";

export const metadata: Metadata = {
  title: "연구 6단계 가이드",
  description:
    "주제 선정, 선행연구 조사, 방법론 설계, 데이터 수집, 논문화, 저널 투고까지 청소년 연구의 6단계를 안내합니다.",
};

export default function GuideIndexPage() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">연구 6단계 가이드</h1>
      <p className="mt-3 text-black/70 dark:text-white/70">
        각 단계를 클릭하면 체크리스트와 자가검증 질문을 볼 수 있습니다.
        순서대로 따라가도 좋고, 지금 막힌 단계만 골라 봐도 됩니다.
      </p>

      <div className="mt-10 space-y-4">
        {stages.map((stage) => (
          <Link
            key={stage.slug}
            href={`/guide/${stage.slug}`}
            className="block rounded-xl border border-black/10 p-5 hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-black/40 dark:text-white/40">
                {String(stage.order).padStart(2, "0")}
              </span>
              <h2 className="font-semibold">{stage.title}</h2>
              <span className="ml-auto text-xs text-black/40 dark:text-white/40">
                {stage.estimatedWeeks}
              </span>
            </div>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {stage.description}
            </p>
          </Link>
        ))}
      </div>

      <AdSlot label="가이드 목록 하단 광고" />
    </div>
  );
}
