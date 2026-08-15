"use client";

import { useState } from "react";

const Z_TABLE: Record<string, number> = {
  "90": 1.645,
  "95": 1.96,
  "99": 2.576,
};

export function SampleSizeCalculator() {
  const [confidence, setConfidence] = useState("95");
  const [marginError, setMarginError] = useState("5");
  const [population, setPopulation] = useState("");
  const [proportion, setProportion] = useState("50");

  const z = Z_TABLE[confidence] ?? 1.96;
  const e = Number(marginError) / 100;
  const p = Number(proportion) / 100;
  const N = population ? Number(population) : null;

  let result: number | null = null;
  if (e > 0 && p > 0 && p < 1) {
    const n0 = (z * z * p * (1 - p)) / (e * e);
    result = N && N > 0 ? Math.ceil(n0 / (1 + (n0 - 1) / N)) : Math.ceil(n0);
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">표본 크기 계산기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        설문·조사를 몇 명한테 돌려야 할지 감이 안 잡힐 때 참고용으로
        씁니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-soft">신뢰수준</label>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          >
            <option value="90">90%</option>
            <option value="95">95%</option>
            <option value="99">99%</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            허용 오차범위 (%)
          </label>
          <input
            type="number"
            value={marginError}
            onChange={(e) => setMarginError(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            예상 비율 (% · 모르면 50)
          </label>
          <input
            type="number"
            value={proportion}
            onChange={(e) => setProportion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            전체 모집단 크기 (모르면 비워두기)
          </label>
          <input
            type="number"
            value={population}
            onChange={(e) => setPopulation(e.target.value)}
            placeholder="예: 우리 학교 전체 학생 수"
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
        {result ? (
          <p className="text-ink">
            최소 <strong>{result}명</strong>에게 응답을 받으면 위 조건을
            충족합니다.
          </p>
        ) : (
          <p className="text-ink-soft">오차범위와 예상 비율을 확인해주세요.</p>
        )}
      </div>
    </section>
  );
}
