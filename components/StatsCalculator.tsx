"use client";

import { useState } from "react";
import { parseNumberList, pearsonCorrelation, welchTTest } from "@/lib/stats";

type Mode = "ttest" | "correlation";

function verdict(p: number) {
  if (p < 0.01) return "매우 유의미한 차이/관계로 보입니다 (p < .01)";
  if (p < 0.05) return "통계적으로 유의미한 것으로 보입니다 (p < .05)";
  return "통계적으로 유의미하다고 보기 어렵습니다 (p ≥ .05)";
}

export function StatsCalculator() {
  const [mode, setMode] = useState<Mode>("ttest");
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    label: string;
    value: number;
    df: number;
    p: number;
  } | null>(null);

  function compute() {
    setError(null);
    setResult(null);
    const a = parseNumberList(textA);
    const b = parseNumberList(textB);

    if (mode === "ttest") {
      if (a.length < 2 || b.length < 2) {
        setError("각 그룹에 숫자가 2개 이상 필요합니다.");
        return;
      }
      const r = welchTTest(a, b);
      setResult({ label: "t", value: r.t, df: r.df, p: r.p });
    } else {
      if (a.length !== b.length || a.length < 3) {
        setError(
          "두 변수의 값 개수가 같아야 하고, 최소 3쌍 이상 필요합니다.",
        );
        return;
      }
      const r = pearsonCorrelation(a, b);
      setResult({ label: "r", value: r.r, df: r.df, p: r.p });
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">간이 통계 계산기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        숫자만 있으면 바로 계산됩니다. 정밀한 통계 소프트웨어를 대체하진
        않지만, 방향을 가늠하기엔 충분합니다.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("ttest");
            setResult(null);
          }}
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
          onClick={() => {
            setMode("correlation");
            setResult(null);
          }}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            mode === "correlation"
              ? "bg-ink text-bg"
              : "border border-line text-ink-soft"
          }`}
        >
          두 변수 관계 (상관분석)
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

      {result && (
        <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
          <p className="text-ink">
            {result.label} = {result.value.toFixed(3)}, df ={" "}
            {result.df.toFixed(1)}, p = {result.p.toFixed(4)}
          </p>
          <p className="mt-1.5 text-ink-soft">{verdict(result.p)}</p>
        </div>
      )}
    </section>
  );
}
