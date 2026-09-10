"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
import { verdict, type StatsMode as Mode } from "@/lib/statsVerdict";
import { CaveatBlock } from "./stats/CaveatBlock";
import { GuideBlock } from "./stats/GuideBlock";
import {
  parseNumberListDetailed,
  parsePairedLists,
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

  function reportCommaReading(
    nameA: string,
    nameB: string,
    mergedA: number,
    mergedB: number,
    ambigA: number,
    ambigB: number,
  ) {
    // 쉼표는 천 단위 구분자로도, 값 구분자로도 읽힌다. 어느 쪽으로 읽었는지
    // 보여줘야 학생이 잘못된 해석(예: 1,200이 1과 200으로 쪼개짐)을 알아챈다.
    const merged: string[] = [];
    if (mergedA > 0) merged.push(nameA);
    if (mergedB > 0) merged.push(nameB);
    if (merged.length > 0) {
      setThousandsNotice(
        `${merged.join("·")}의 쉼표를 천 단위 구분으로 읽었습니다(1,200 → 1200). 값을 구분하려면 공백이나 줄바꿈을 쓰세요.`,
      );
    }
    const ambiguous: string[] = [];
    if (ambigA > 0) ambiguous.push(nameA);
    if (ambigB > 0) ambiguous.push(nameB);
    if (ambiguous.length > 0) {
      setAmbiguityWarning(
        `${ambiguous.join("·")}의 쉼표 사용이 일관되지 않아 값 구분자로 읽었습니다(1,200 → 1과 200). 천 단위 표기라면 쉼표를 지우고 다시 계산하세요.`,
      );
    }
  }

  function compute() {
    setStaleNotice(false);
    setError(null);
    setDropWarning(null);
    setThousandsNotice(null);
    setAmbiguityWarning(null);
    setTtestResult(null);
    setRegressionResult(null);

    if (mode === "ttest") {
      // t-검정은 두 집단의 n이 달라도 되는 검정이라 쌍 개념이 없다.
      // 기존 파싱 경로를 그대로 쓴다.
      const parsedA = parseNumberListDetailed(textA);
      const parsedB = parseNumberListDetailed(textB);
      reportCommaReading(
        "그룹 A",
        "그룹 B",
        parsedA.thousandsMergedCount,
        parsedB.thousandsMergedCount,
        parsedA.ambiguousCommaCount,
        parsedB.ambiguousCommaCount,
      );
      const dropped = parsedA.droppedCount + parsedB.droppedCount;
      if (dropped > 0) {
        setDropWarning(`숫자로 읽지 못한 값 ${dropped}개는 제외했습니다.`);
      }
      const a = parsedA.values;
      const b = parsedB.values;
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
      return;
    }

    // 상관·회귀는 X의 i번째와 Y의 i번째가 같은 관측이어야 한다.
    // 개수만 세면 양쪽에 빈 칸이 하나씩 있을 때 검사를 통과한 채
    // 그 아래 전부가 한 칸씩 밀린 쌍으로 계산된다(K3).
    const paired = parsePairedLists(textA, textB);
    reportCommaReading(
      "변수 X",
      "변수 Y",
      paired.thousandsMergedCount,
      0,
      paired.ambiguousCommaCount,
      0,
    );

    if (paired.lengths.x !== paired.lengths.y) {
      setError(
        `변수 X는 ${paired.lengths.x}개, 변수 Y는 ${paired.lengths.y}개입니다. 상관·회귀는 X와 Y가 같은 대상에서 나온 짝이어야 하므로 개수가 같아야 합니다.`,
      );
      return;
    }
    if (paired.issues.length > 0) {
      const rowSet = new Set(paired.issues.map((i) => i.row));
      const rows = [...rowSet].sort((a, b) => a - b).slice(0, 5);
      const more = rowSet.size - rows.length;
      setError(
        `${rows.join(", ")}번째 행${more > 0 ? ` 외 ${more}개 행` : ""}에 비어 있거나 숫자가 아닌 값이 있습니다. 그 행을 지우거나 값을 채운 뒤 다시 계산하세요 — 빈 칸을 그냥 건너뛰면 그 아래 쌍이 전부 한 칸씩 밀립니다.`,
      );
      return;
    }
    if (paired.x.length < 3) {
      setError("최소 3쌍 이상 필요합니다.");
      return;
    }

    if (mode === "correlation") {
      const r = pearsonCorrelation(paired.x, paired.y);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setTtestResult({ value: r.r, df: r.df, p: r.p });
    } else {
      const r = simpleLinearRegression(paired.x, paired.y);
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
        숫자만 넣으면 바로 계산됩니다. SPSS나 R 같은 전문 도구를 대신하긴
        어렵지만, 대략적인 방향 정도는 잡을 수 있어요.
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
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
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
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
          />
        </div>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        쉼표든 공백이든 줄바꿈이든, 편한 대로 구분해서 넣으면 됩니다.
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
            값이 바뀌었으니 다시 계산해주세요.
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
                복사가 안 됐네요. 위 내용을 직접 선택해서 복사해주세요.
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
