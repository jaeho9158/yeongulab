"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
import { verdict, type StatsMode as Mode } from "@/lib/statsVerdict";
import { CaveatBlock } from "./stats/CaveatBlock";
import { GuideBlock } from "./stats/GuideBlock";
import {
  parseNumberListDetailed,
  pearsonCorrelation,
  simpleLinearRegression,
  welchTTest,
} from "@/lib/stats";


export function StatsCalculator() {
  const [inputs, setInputs] = usePersistentState<{
    mode: Mode;
    textA: string;
    textB: string;
  }>("stats-calculator", { mode: "ttest", textA: "", textB: "" });
  const { mode, textA, textB } = inputs;
  const [error, setError] = useState<string | null>(null);
  const [resultCopied, setResultCopied] = useState<"idle" | "done" | "failed">(
    "idle",
  );
  const [dropWarning, setDropWarning] = useState<string | null>(null);
  // 쉼표를 어떻게 읽었는지 알려주는 두 층: 안내(천 단위로 합침)와 경고(해석이 갈림).
  // 심각도가 다르므로 한 문자열로 합치지 않고 따로 둔다.
  const [thousandsNotice, setThousandsNotice] = useState<string | null>(null);
  const [ambiguityWarning, setAmbiguityWarning] = useState<string | null>(null);
  // 입력을 고친 뒤 옛 결과가 남아 있으면 학생이 그걸 새 결과로 믿고 베낀다.
  // 그래서 결과를 지우되, 그냥 사라지면 당황하므로 안내 문구로 자리를 채운다.
  const [staleNotice, setStaleNotice] = useState(false);
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
    setThousandsNotice(null);
    setAmbiguityWarning(null);
    setStaleNotice(false);
  }

  // 입력이 바뀌면 화면에 남은 결과는 더 이상 이 입력의 결과가 아니다.
  function invalidateResult() {
    // 여러 번 고쳐도 안내는 유지된다 — 다시 계산할 때까지 결과 자리를 지킨다
    const hadResult = ttestResult !== null || regressionResult !== null;
    setStaleNotice((prev) => prev || hadResult);
    setTtestResult(null);
    setRegressionResult(null);
    setError(null);
    setDropWarning(null);
    setThousandsNotice(null);
    setAmbiguityWarning(null);
    setResultCopied("idle");
  }

  function compute() {
    setStaleNotice(false);
    setError(null);
    setDropWarning(null);
    setThousandsNotice(null);
    setAmbiguityWarning(null);
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
    // 쉼표는 천 단위 구분자로도, 값 구분자로도 읽힌다. 어느 쪽으로 읽었는지
    // 보여줘야 학생이 잘못된 해석(예: 1,200이 1과 200으로 쪼개짐)을 알아챈다.
    const nameA = mode === "ttest" ? "그룹 A" : "변수 X";
    const nameB = mode === "ttest" ? "그룹 B" : "변수 Y";
    const merged: string[] = [];
    if (parsedA.thousandsMergedCount > 0) merged.push(nameA);
    if (parsedB.thousandsMergedCount > 0) merged.push(nameB);
    if (merged.length > 0) {
      setThousandsNotice(
        `${merged.join("·")}의 쉼표를 천 단위 구분으로 읽었습니다(1,200 → 1200). 값을 구분하려면 공백이나 줄바꿈을 쓰세요.`,
      );
    }
    const ambiguous: string[] = [];
    if (parsedA.ambiguousCommaCount > 0) ambiguous.push(nameA);
    if (parsedB.ambiguousCommaCount > 0) ambiguous.push(nameB);
    if (ambiguous.length > 0) {
      setAmbiguityWarning(
        `${ambiguous.join("·")}의 쉼표 사용이 일관되지 않아 값 구분자로 읽었습니다(1,200 → 1과 200). 천 단위 표기라면 쉼표를 지우고 다시 계산하세요.`,
      );
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

  // p.toFixed(4)는 아주 작은 p를 "0.0000"으로 적어 존재할 수 없는 값을 만든다.
  // APA 관례: .001 미만이면 부등호로, 그 외에는 소수 셋째 자리(앞 0 생략).
  function formatP(p: number): string {
    return p < 0.001 ? "p < .001" : `p = ${p.toFixed(3).replace(/^0/, "")}`;
  }

  const groupSummary = ttestResult?.groups
    ? `그룹 A: M = ${ttestResult.groups.meanA.toFixed(2)}, SD = ${ttestResult.groups.sdA.toFixed(2)}, n = ${ttestResult.groups.nA}; 그룹 B: M = ${ttestResult.groups.meanB.toFixed(2)}, SD = ${ttestResult.groups.sdB.toFixed(2)}, n = ${ttestResult.groups.nB}; 평균 차이 = ${ttestResult.groups.meanDiff.toFixed(2)}, d = ${ttestResult.groups.cohenD.toFixed(2)}`
    : "";

  async function copyResult() {
    let summary = "";
    if (ttestResult) {
      const testLine = `${ttestLabel} = ${ttestResult.value.toFixed(3)}, df = ${ttestResult.df.toFixed(1)}, ${formatP(ttestResult.p)}`;
      summary = groupSummary ? `${groupSummary}; ${testLine}` : testLine;
    } else if (regressionResult) {
      summary = `Y = ${regressionResult.slope.toFixed(3)}X ${regressionResult.intercept >= 0 ? "+" : "-"} ${Math.abs(regressionResult.intercept).toFixed(3)}, R² = ${regressionResult.r2.toFixed(3)}, ${formatP(regressionResult.p)}`;
    }
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setResultCopied("done");
      setTimeout(() => setResultCopied("idle"), 1500);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 엉뚱한 내용을 붙여넣는다
      setResultCopied("failed");
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
            onChange={(e) => {
              const next = e.target.value;
              setInputs((prev) => ({ ...prev, textA: next }));
              invalidateResult();
            }}
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
            onChange={(e) => {
              const next = e.target.value;
              setInputs((prev) => ({ ...prev, textB: next }));
              invalidateResult();
            }}
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
        {staleNotice && (
          <p className="mt-3 text-sm text-ink-soft">
            입력이 바뀌었습니다. 다시 계산하세요.
          </p>
        )}

        {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}

        {ambiguityWarning && (
          <p className="mt-2 text-xs font-medium text-danger">
            {ambiguityWarning}
          </p>
        )}

        {thousandsNotice && (
          <p className="mt-2 text-xs text-ink-soft">{thousandsNotice}</p>
        )}

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
                  {ttestResult.df.toFixed(1)}, {formatP(ttestResult.p)}
                </p>
              </div>
              <button
                type="button"
                onClick={copyResult}
                className="-my-2 shrink-0 px-2 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {resultCopied === "done" ? "복사됨" : "결과 복사"}
              </button>
            </div>
            <p className="mt-1.5 text-ink-soft">{verdict(mode, ttestResult.p)}</p>
            {resultCopied === "failed" && (
              <p className="mt-1 text-xs text-ink-soft">
                복사하지 못했습니다. 위 내용을 직접 선택해 복사해주세요.
              </p>
            )}
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
                {regressionResult.r2.toFixed(3)}, {formatP(regressionResult.p)}
              </p>
              <button
                type="button"
                onClick={copyResult}
                className="-my-2 shrink-0 px-2 py-2 text-xs text-ink-soft hover:text-ink"
              >
                {resultCopied === "done" ? "복사됨" : "결과 복사"}
              </button>
            </div>
            <p className="mt-1.5 text-ink-soft">
              {verdict(mode, regressionResult.p)}
            </p>
            {resultCopied === "failed" && (
              <p className="mt-1 text-xs text-ink-soft">
                복사하지 못했습니다. 위 내용을 직접 선택해 복사해주세요.
              </p>
            )}
            <CaveatBlock />
          </div>
        )}
      </div>
    </section>
  );
}
