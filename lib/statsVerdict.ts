/**
 * 통계 결과 판정 문구 — StatsCalculator에서 분리해 컴포넌트 없이 테스트한다.
 * 유의 여부만 말하고, 크기·중요성 판단은 효과크기 쪽으로 안내한다.
 */
export type StatsMode = "ttest" | "correlation" | "regression";

export function verdict(mode: StatsMode, p: number) {
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
