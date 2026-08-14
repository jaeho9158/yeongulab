import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import { StageStamp } from "@/components/StageStamp";
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
      <p className="font-label text-xs uppercase tracking-widest text-ink-soft">
        연구 로그북
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        연구 6단계 가이드
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft leading-relaxed">
        각 단계를 열면 체크리스트, 자가검증 질문, 다음 단계로 가는 기준이
        나옵니다. 순서대로 봐도 되고, 지금 막힌 단계만 펼쳐서 봐도 됩니다.
        건너뛰거나 보류해도 괜찮습니다.
      </p>

      <div className="mt-10 space-y-5">
        {stages.map((stage) => (
          <Link
            key={stage.slug}
            href={`/guide/${stage.slug}`}
            className="index-card flex items-center gap-5 px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-[2px_3px_0_0_var(--rule-strong)]"
          >
            <StageStamp order={stage.order} weeks={stage.estimatedWeeks} />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {stage.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {stage.description}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {stage.keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="font-label rounded-full border border-rule-strong px-2 py-0.5 text-[10px] text-ink-soft"
                  >
                    #{kw}
                  </span>
                ))}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <AdSlot label="가이드 목록 하단 광고" />
    </div>
  );
}
