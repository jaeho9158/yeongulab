"use client";

import { useState } from "react";
import type { StatsMode as Mode } from "@/lib/statsVerdict";

/** "어느 검정을 써야 하나" 2단계 안내 — StatsCalculator에서 분리. */
type GuideAnswer = "diff" | "relation" | null;
type GuideRelationAnswer = "predict" | "association" | null;

export function GuideBlock({ onPick }: { onPick: (mode: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const [step1, setStep1] = useState<GuideAnswer>(null);
  const [step2, setStep2] = useState<GuideRelationAnswer>(null);

  const recommended: Mode | null =
    step1 === "diff" ? "ttest" : step1 === "relation" && step2 === "predict" ? "regression" : step1 === "relation" && step2 === "association" ? "correlation" : null;

  const recommendedLabel =
    recommended === "ttest"
      ? "두 그룹 평균 비교 (t-검정)"
      : recommended === "regression"
        ? "두 변수 관계 (회귀분석)"
        : recommended === "correlation"
          ? "두 변수 관계 (상관분석)"
          : null;

  return (
    <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-ink"
      >
        <span>어떤 분석이 맞을지 모르겠다면?</span>
        <span className="text-ink-soft">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-ink-soft">
              비교하려는 게 무엇인가요?
            </p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-ink">
                <input
                  type="radio"
                  name="guide-step1"
                  checked={step1 === "diff"}
                  onChange={() => {
                    setStep1("diff");
                    setStep2(null);
                  }}
                />
                두 그룹의 평균 차이
              </label>
              <label className="flex items-center gap-1.5 text-ink">
                <input
                  type="radio"
                  name="guide-step1"
                  checked={step1 === "relation"}
                  onChange={() => setStep1("relation")}
                />
                두 변수 사이의 관계
              </label>
            </div>
          </div>

          {step1 === "relation" && (
            <div>
              <p className="text-ink-soft">
                한 변수로 다른 변수를 예측/설명하고 싶나요?
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-ink">
                  <input
                    type="radio"
                    name="guide-step2"
                    checked={step2 === "predict"}
                    onChange={() => setStep2("predict")}
                  />
                  예, 예측/설명하고 싶어요
                </label>
                <label className="flex items-center gap-1.5 text-ink">
                  <input
                    type="radio"
                    name="guide-step2"
                    checked={step2 === "association"}
                    onChange={() => setStep2("association")}
                  />
                  아니요, 그냥 관련이 있는지만
                </label>
              </div>
            </div>
          )}

          {recommended && (
            <div className="rounded-lg bg-bg px-3 py-2.5">
              <p className="text-ink-soft">
                추천 분석: <span className="font-medium text-ink">{recommendedLabel}</span>
              </p>
              <button
                type="button"
                onClick={() => onPick(recommended)}
                className="mt-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-bg transition hover:opacity-85"
              >
                이 방식으로 계산하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
