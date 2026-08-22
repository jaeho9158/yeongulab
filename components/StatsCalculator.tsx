"use client";

import { useState } from "react";
import {
  parseNumberListDetailed,
  pearsonCorrelation,
  simpleLinearRegression,
  welchTTest,
} from "@/lib/stats";

type Mode = "ttest" | "correlation" | "regression";

function verdict(mode: Mode, p: number) {
  // p가 NaN/Infinity면 어떤 판정도 내릴 수 없다
  if (!Number.isFinite(p)) {
    return "p값을 계산할 수 없어 유의성을 판정할 수 없습니다. 입력 데이터를 확인해주세요.";
  }
  const strength =
    p < 0.01
      ? "매우 유의미한"
      : p < 0.05
        ? "통계적으로 유의미한"
        : null;

  if (!strength) {
    if (mode === "regression") {
      return "회귀계수가 통계적으로 유의미하다고 보기 어렵습니다 (p ≥ .05). X로 Y를 설명한다고 말하기엔 근거가 약합니다.";
    }
    return "통계적으로 유의미하다고 보기 어렵습니다 (p ≥ .05)";
  }

  if (mode === "regression") {
    return `X가 Y를 ${strength} 수준으로 설명하는 것으로 보입니다 (p ${
      p < 0.01 ? "< .01" : "< .05"
    }). R²는 X가 Y의 변동을 얼마나 설명하는지를 보여줍니다.`;
  }
  return `${strength} 차이/관계로 보입니다 (p ${p < 0.01 ? "< .01" : "< .05"})`;
}

type GuideAnswer = "diff" | "relation" | null;
type GuideRelationAnswer = "predict" | "association" | null;

function GuideBlock({ onPick }: { onPick: (mode: Mode) => void }) {
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

export function StatsCalculator() {
  const [mode, setMode] = useState<Mode>("ttest");
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dropWarning, setDropWarning] = useState<string | null>(null);
  const [ttestResult, setTtestResult] = useState<{
    value: number;
    df: number;
    p: number;
  } | null>(null);
  const [regressionResult, setRegressionResult] = useState<{
    slope: number;
    intercept: number;
    r2: number;
    p: number;
  } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setTtestResult(null);
    setRegressionResult(null);
    setError(null);
    setDropWarning(null);
  }

  function compute() {
    setError(null);
    setDropWarning(null);
    setTtestResult(null);
    setRegressionResult(null);
    const parsedA = parseNumberListDetailed(textA);
    const parsedB = parseNumberListDetailed(textB);
    const a = parsedA.values;
    const b = parsedB.values;
    const dropped = parsedA.droppedCount + parsedB.droppedCount;
    if (dropped > 0) {
      setDropWarning(`숫자로 읽지 못한 값 ${dropped}개는 제외했습니다.`);
    }

    if (mode === "ttest") {
      if (a.length < 2 || b.length < 2) {
        setError("각 그룹에 숫자가 2개 이상 필요합니다.");
        return;
      }
      const r = welchTTest(a, b);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setTtestResult({ value: r.t, df: r.df, p: r.p });
    } else if (mode === "correlation") {
      if (a.length !== b.length || a.length < 3) {
        setError(
          "두 변수의 값 개수가 같아야 하고, 최소 3쌍 이상 필요합니다.",
        );
        return;
      }
      const r = pearsonCorrelation(a, b);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setTtestResult({ value: r.r, df: r.df, p: r.p });
    } else {
      if (a.length !== b.length || a.length < 3) {
        setError(
          "두 변수의 값 개수가 같아야 하고, 최소 3쌍 이상 필요합니다.",
        );
        return;
      }
      const r = simpleLinearRegression(a, b);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setRegressionResult({
        slope: r.slope,
        intercept: r.intercept,
        r2: r.r2,
        p: r.p,
      });
    }
  }

  const ttestLabel = mode === "ttest" ? "t" : "r";

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">간이 통계 계산기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        숫자만 있으면 바로 계산됩니다. 정밀한 통계 소프트웨어를 대체하진
        않지만, 방향을 가늠하기엔 충분합니다.
      </p>

      <GuideBlock onPick={switchMode} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchMode("ttest")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            mode === "ttest"
              ? "bg-ink text-bg"
              : "border border-line text-ink-soft"
          }`}
        >
          두 그룹 평균 비교 (t-검정)
        </button>
        <button
          type="button"
          onClick={() => switchMode("correlation")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            mode === "correlation"
              ? "bg-ink text-bg"
              : "border border-line text-ink-soft"
          }`}
        >
          두 변수 관계 (상관분석)
        </button>
        <button
          type="button"
          onClick={() => switchMode("regression")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            mode === "regression"
              ? "bg-ink text-bg"
              : "border border-line text-ink-soft"
          }`}
        >
          두 변수 관계 (회귀분석)
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-soft">
            {mode === "ttest" ? "그룹 A 값들" : "변수 X 값들"}
          </label>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="예: 12, 15, 14, 18, 13"
            rows={4}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            {mode === "ttest" ? "그룹 B 값들" : "변수 Y 값들"}
          </label>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="예: 22, 19, 25, 21, 20"
            rows={4}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        쉼표, 공백, 줄바꿈 아무거나로 값을 구분하면 됩니다.
      </p>

      <button
        type="button"
        onClick={compute}
        className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
      >
        계산하기
      </button>

      {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}

      {dropWarning && (
        <p className="mt-2 text-xs text-ink-soft">{dropWarning}</p>
      )}

      {ttestResult && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
          <p className="text-ink">
            {ttestLabel} = {ttestResult.value.toFixed(3)}, df ={" "}
            {ttestResult.df.toFixed(1)}, p = {ttestResult.p.toFixed(4)}
          </p>
          <p className="mt-1.5 text-ink-soft">{verdict(mode, ttestResult.p)}</p>
        </div>
      )}

      {regressionResult && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
          <p className="text-ink">
            Y = {regressionResult.slope.toFixed(3)}X{" "}
            {regressionResult.intercept >= 0 ? "+" : "-"}{" "}
            {Math.abs(regressionResult.intercept).toFixed(3)}, R² ={" "}
            {regressionResult.r2.toFixed(3)}, p = {regressionResult.p.toFixed(4)}
          </p>
          <p className="mt-1.5 text-ink-soft">
            {verdict(mode, regressionResult.p)}
          </p>
        </div>
      )}
    </section>
  );
}
