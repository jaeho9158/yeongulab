"use client";

import { usePersistentState } from "@/lib/usePersistentState";

const Z_TABLE: Record<string, number> = {
  "90": 1.645,
  "95": 1.96,
  "99": 2.576,
};

// 결과가 이 수를 넘으면 입력 실수로 본다.
// 근거: 전국 단위 여론조사도 보통 1,000~2,000명이고, 학생 조사는 많아야 수백 명이다.
// 10만 명은 그보다 두 자릿수 이상 큰 규모라 "도달 가능한 표본"이 아니라
// 오차범위를 퍼센트가 아닌 소수로 잘못 넣었다는 신호로 보는 편이 안전하다.
const UNREALISTIC_N = 100_000;

export function SampleSizeCalculator() {
  const [form, setForm] = usePersistentState("sample-size", {
    confidence: "95",
    marginError: "5",
    population: "",
    proportion: "50",
  });
  const { confidence, marginError, population, proportion } = form;

  const z = Z_TABLE[confidence] ?? 1.96;
  const e = Number(marginError) / 100;
  const p = Number(proportion) / 100;

  // 모집단 칸은 "비워둠"(무한모집단으로 계산)과 "잘못 입력"을 구분해야 한다.
  // 예전에는 -100이나 "300명"이 조용히 무한모집단 공식으로 넘어가서,
  // 전교생 300명인데 385명을 조사하라는 결과가 정답처럼 보였다.
  const populationRaw = population.trim();
  const populationNumber = Number(populationRaw);
  const populationInvalid =
    populationRaw !== "" &&
    !(Number.isFinite(populationNumber) && populationNumber > 0);
  const N = populationRaw !== "" && !populationInvalid ? populationNumber : null;

  function sampleSize(marginRatio: number) {
    const n0 = (z * z * p * (1 - p)) / (marginRatio * marginRatio);
    return N ? Math.ceil(n0 / (1 + (n0 - 1) / N)) : Math.ceil(n0);
  }

  let result: number | null = null;
  if (e > 0 && p > 0 && p < 1 && !populationInvalid) {
    result = sampleSize(e);
  }
  // 오차범위를 소수로 착각한 경우에 대비해, 5%로 잡았을 때의 현실적인 대안을 함께 보여준다
  const realisticAlternative =
    result !== null && result > UNREALISTIC_N ? sampleSize(0.05) : null;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">표본 크기 계산기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        설문·조사를 몇 명한테 돌려야 할지 감이 안 잡힐 때 참고용으로
        씁니다.
      </p>
      <p className="mt-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
        이 계산기는 설문·비율 조사용입니다(Cochran 공식). 두 집단 평균
        비교(실험)에는 검정력 분석이 필요합니다(중간 효과 d=0.5, 검정력
        80%면 집단당 약 64명).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sample-size-confidence"
            className="text-xs font-medium text-ink-soft"
          >
            신뢰수준
          </label>
          <select
            id="sample-size-confidence"
            value={confidence}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confidence: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          >
            <option value="90">90%</option>
            <option value="95">95%</option>
            <option value="99">99%</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="sample-size-margin"
            className="text-xs font-medium text-ink-soft"
          >
            허용 오차범위 (%)
          </label>
          <input
            id="sample-size-margin"
            type="number"
            value={marginError}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, marginError: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="sample-size-proportion"
            className="text-xs font-medium text-ink-soft"
          >
            예상 비율 (% · 모르면 50)
          </label>
          <input
            id="sample-size-proportion"
            type="number"
            value={proportion}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, proportion: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="sample-size-population"
            className="text-xs font-medium text-ink-soft"
          >
            전체 모집단 크기 (모르면 비워두기)
          </label>
          <input
            id="sample-size-population"
            type="number"
            value={population}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, population: e.target.value }))
            }
            placeholder="예: 우리 학교 전체 학생 수"
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
          />
        </div>
      </div>

      <div aria-live="polite" className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm">
        {populationInvalid ? (
          <p className="text-ink-soft">
            모집단 크기를 숫자로 입력해주세요. 모르면 비워두시면 됩니다.
          </p>
        ) : result !== null ? (
          <>
            <p className="text-ink">
              최소 <strong>{result.toLocaleString("ko-KR")}명</strong>에게
              응답을 받으면 위 조건을 충족합니다.
            </p>
            {realisticAlternative !== null ? (
              <p className="mt-2 rounded-lg border border-line bg-bg px-3 py-2 text-xs leading-relaxed text-ink">
                현실적으로 모으기 어려운 인원입니다. 허용 오차범위를
                퍼센트(%)로 입력했는지 확인해주세요. 예를 들어 0.001은
                0.001%를 뜻하며 사실상 전수조사에 가깝습니다. 오차범위를 5%로
                잡으면 약 {realisticAlternative.toLocaleString("ko-KR")}명입니다.
              </p>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              무작위 표집일 때만 의미가 있고, 편의 표집(내 반 친구들)에는
              적용되지 않습니다. 오차범위를 10%로 넓히면 약 97명(95% 신뢰수준,
              예상 비율 50% 기준)입니다.
            </p>
          </>
        ) : (
          <p className="text-ink-soft">오차범위와 예상 비율을 확인해주세요.</p>
        )}
      </div>
    </section>
  );
}
