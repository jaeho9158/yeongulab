"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
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

  if (p >= 0.05) {
    return "통계적으로 유의하지 않습니다 (p ≥ .05). 차이나 관계가 없다는 뜻이 아니라, 이 데이터만으로는 우연과 구분하기 어렵다는 뜻입니다.";
  }

  // p < .05 — 유의 여부만 말하고, 크기·중요성은 효과크기로 따로 판단하게 한다
  const level = p < 0.01 ? "(p < .01)" : "(p < .05)";
  if (mode === "ttest") {
    return `두 집단의 평균 차이가 통계적으로 유의합니다 ${level}. 차이가 얼마나 큰지는 아래 평균 차이와 d로 판단하세요.`;
  }
  if (mode === "correlation") {
    return `두 변수의 상관이 통계적으로 유의합니다 ${level}. 관계가 얼마나 강한지는 r의 크기로 판단하세요.`;
  }
  return `회귀계수(기울기)가 통계적으로 유의합니다 ${level}. X가 Y의 변동을 얼마나 설명하는지는 R²로 판단하세요.`;
}

function CaveatBlock() {
  return (
    <ul className="mt-3 list-disc space-y-1 border-t border-line pl-5 pt-3 text-xs leading-relaxed text-ink-soft">
      <li>
        서로 독립된 두 집단이고 극단값이 없다는 전제입니다. 같은 사람을 두 번
        측정했다면(사전·사후) 대응표본 검정이 필요합니다.
      </li>
      <li>상관·회귀는 인과관계를 말해주지 않습니다.</li>
      <li>
        결과에는 효과크기(평균 차이·d 또는 R²)를 p값과 함께 적으세요.
      </li>
      <li>
        이 t-검정은 등분산을 가정하지 않는 Welch 방식이라 자유도(df)가
        소수로 나올 수 있습니다.
      </li>
      <li>p값은 차이의 크기나 중요성을 말해주지 않습니다.</li>
    </ul>
  );
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
  const [inputs, setInputs] = usePersistentState<{
    mode: Mode;
    textA: string;
    textB: string;
  }>("stats-calculator", { mode: "ttest", textA: "", textB: "" });
  const { mode, textA, textB } = inputs;
  const [error, setError] = useState<string | null>(null);
  const [resultCopied, setResultCopied] = useState(false);
  const [dropWarning, setDropWarning] = useState<string | null>(null);
  const [ttestResult, setTtestResult] = useState<{
    value: number;
    df: number;
    p: number;
    // t-검정일 때만 채워지는 기술통계·효과크기
    groups?: {
      meanA: number;
      meanB: number;
      sdA: number;
      sdB: number;
      nA: number;
      nB: number;
      meanDiff: number;
      cohenD: number;
    };
  } | null>(null);
  const [regressionResult, setRegressionResult] = useState<{
    slope: number;
    intercept: number;
    r2: number;
    p: number;
  } | null>(null);

  function switchMode(next: Mode) {
    setInputs((prev) => ({ ...prev, mode: next }));
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
      setTtestResult({
        value: r.t,
        df: r.df,
        p: r.p,
        groups: {
          meanA: r.meanA,
          meanB: r.meanB,
          sdA: r.sdA,
          sdB: r.sdB,
          nA: r.nA,
          nB: r.nB,
          meanDiff: r.meanDiff,
          cohenD: r.cohenD,
        },
      });
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

  const groupSummary = ttestResult?.groups
    ? `그룹 A: M = ${ttestResult.groups.meanA.toFixed(2)}, SD = ${ttestResult.groups.sdA.toFixed(2)}, n = ${ttestResult.groups.nA}; 그룹 B: M = ${ttestResult.groups.meanB.toFixed(2)}, SD = ${ttestResult.groups.sdB.toFixed(2)}, n = ${ttestResult.groups.nB}; 평균 차이 = ${ttestResult.groups.meanDiff.toFixed(2)}, d = ${ttestResult.groups.cohenD.toFixed(2)}`
    : "";

  async function copyResult() {
    let summary = "";
    if (ttestResult) {
      const testLine = `${ttestLabel} = ${ttestResult.value.toFixed(3)}, df = ${ttestResult.df.toFixed(1)}, p = ${ttestResult.p.toFixed(4)}`;
      summary = groupSummary ? `${groupSummary}; ${testLine}` : testLine;
    } else if (regressionResult) {
      summary = `Y = ${regressionResult.slope.toFixed(3)}X ${regressionResult.intercept >= 0 ? "+" : "-"} ${Math.abs(regressionResult.intercept).toFixed(3)}, R² = ${regressionResult.r2.toFixed(3)}, p = ${regressionResult.p.toFixed(4)}`;
    }
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setResultCopied(true);
      setTimeout(() => setResultCopied(false), 1500);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  }

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
          aria-pressed={mode === "ttest"}
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
          aria-pressed={mode === "correlation"}
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
          aria-pressed={mode === "regression"}
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
          <label htmlFor="stats-values-a" className="text-xs font-medium text-ink-soft">
            {mode === "ttest" ? "그룹 A 값들" : "변수 X 값들"}
          </label>
          <textarea
            id="stats-values-a"
            value={textA}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, textA: e.target.value }))
            }
            placeholder="예: 12, 15, 14, 18, 13"
            rows={4}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="stats-values-b" className="text-xs font-medium text-ink-soft">
            {mode === "ttest" ? "그룹 B 값들" : "변수 Y 값들"}
          </label>
          <textarea
            id="stats-values-b"
            value={textB}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, textB: e.target.value }))
            }
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

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}

        {dropWarning && (
          <p className="mt-2 text-xs text-ink-soft">{dropWarning}</p>
        )}

        {ttestResult && (
          <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="text-ink">
                {ttestResult.groups && (
                  <p className="mb-1 text-ink-soft">
                    그룹 A: M = {ttestResult.groups.meanA.toFixed(2)}, SD ={" "}
                    {ttestResult.groups.sdA.toFixed(2)}, n = {ttestResult.groups.nA}
                    {" · "}
                    그룹 B: M = {ttestResult.groups.meanB.toFixed(2)}, SD ={" "}
                    {ttestResult.groups.sdB.toFixed(2)}, n = {ttestResult.groups.nB}
                    <br />
                    평균 차이 = {ttestResult.groups.meanDiff.toFixed(2)}, d ={" "}
                    {ttestResult.groups.cohenD.toFixed(2)}
                  </p>
                )}
                <p>
                  {ttestLabel} = {ttestResult.value.toFixed(3)}, df ={" "}
                  {ttestResult.df.toFixed(1)}, p = {ttestResult.p.toFixed(4)}
                </p>
              </div>
              <button
                type="button"
                onClick={copyResult}
                className="-my-2 shrink-0 px-2 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {resultCopied ? "복사됨" : "결과 복사"}
              </button>
            </div>
            <p className="mt-1.5 text-ink-soft">{verdict(mode, ttestResult.p)}</p>
            <CaveatBlock />
          </div>
        )}

        {regressionResult && (
          <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-ink">
                Y = {regressionResult.slope.toFixed(3)}X{" "}
                {regressionResult.intercept >= 0 ? "+" : "-"}{" "}
                {Math.abs(regressionResult.intercept).toFixed(3)}, R² ={" "}
                {regressionResult.r2.toFixed(3)}, p = {regressionResult.p.toFixed(4)}
              </p>
              <button
                type="button"
                onClick={copyResult}
                className="-my-2 shrink-0 px-2 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {resultCopied ? "복사됨" : "결과 복사"}
              </button>
            </div>
            <p className="mt-1.5 text-ink-soft">
              {verdict(mode, regressionResult.p)}
            </p>
            <CaveatBlock />
          </div>
        )}
      </div>
    </section>
  );
}
