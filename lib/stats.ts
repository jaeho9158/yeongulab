/**
 * 의존성 없는 최소 통계 함수 모음.
 * t-분포 유의확률(p-value)은 불완전 베타함수를 이용한 표준 근사식(Numerical
 * Recipes 계열 연속분수 전개)으로 계산한다 — 통계 패키지 수준의 정밀도는
 * 아니지만 교육용으로 충분히 정확하다.
 */

function logGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** 자유도 df인 t-분포에서 |T| >= |t| 일 양측 유의확률(p-value). */
export function tTestTwoTailedP(t: number, df: number): number {
  return incompleteBeta(df / 2, 0.5, df / (df + t * t));
}

function mean(xs: number[]): number {
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function variance(xs: number[]): number {
  const m = mean(xs);
  return xs.reduce((s, v) => s + (v - m) ** 2, 0) / (xs.length - 1);
}

/** 분산 0 등으로 계산이 불가능할 때 UI가 정직하게 보여줄 수 있도록 하는 오류 결과. */
export type StatError = { error: string };

/**
 * Welch의 독립표본 t-검정 (등분산을 가정하지 않으므로 자유도가 소수로 나올 수 있다).
 * 효과크기 cohenD는 합동 표준편차(pooled SD)로 나눈 평균 차이다.
 */
export function welchTTest(
  a: number[],
  b: number[],
):
  | {
      meanA: number;
      meanB: number;
      sdA: number;
      sdB: number;
      nA: number;
      nB: number;
      meanDiff: number;
      cohenD: number;
      t: number;
      df: number;
      p: number;
    }
  | StatError {
  const meanA = mean(a);
  const meanB = mean(b);
  const varA = variance(a);
  const varB = variance(b);
  const nA = a.length;
  const nB = b.length;
  const se = Math.sqrt(varA / nA + varB / nB);
  // 두 집단 모두 값이 동일하면 se=0 → t=±Infinity, p=NaN이 되므로 계산 불가 처리
  if (se === 0) {
    return {
      error:
        "두 집단의 값이 각각 모두 동일해 t-검정을 계산할 수 없습니다 (분산이 0).",
    };
  }
  const t = (meanA - meanB) / se;
  const df =
    (varA / nA + varB / nB) ** 2 /
    ((varA / nA) ** 2 / (nA - 1) + (varB / nB) ** 2 / (nB - 1));
  const p = tTestTwoTailedP(Math.abs(t), df);
  const meanDiff = meanA - meanB;
  const pooledSd = Math.sqrt(
    ((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2),
  );
  const cohenD = meanDiff / pooledSd;
  return {
    meanA,
    meanB,
    sdA: Math.sqrt(varA),
    sdB: Math.sqrt(varB),
    nA,
    nB,
    meanDiff,
    cohenD,
    t,
    df,
    p,
  };
}

export function pearsonCorrelation(
  x: number[],
  y: number[],
): { r: number; df: number; t: number; p: number } | StatError {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  // 한쪽 변수의 값이 모두 동일하면 분모가 0 → r=NaN이 되므로 계산 불가 처리
  if (dx2 === 0 || dy2 === 0) {
    return {
      error:
        "한 변수의 값이 모두 동일해 상관계수를 계산할 수 없습니다 (분산이 0).",
    };
  }
  const r = num / Math.sqrt(dx2 * dy2);
  const df = n - 2;
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  const p = tTestTwoTailedP(Math.abs(t), df);
  return { r, df, t, p };
}

/**
 * 단순선형회귀: y = slope * x + intercept.
 * 결정계수(r²)는 pearsonCorrelation의 r을 제곱해 구하고, 기울기의 유의성
 * 검정(t, df, p)도 상관계수의 t-검정과 동일한 통계량을 공유한다(단순회귀에서는
 * 기울기 검정과 상관계수 검정의 t값이 수학적으로 같다).
 */
export function simpleLinearRegression(
  x: number[],
  y: number[],
):
  | { slope: number; intercept: number; r2: number; t: number; df: number; p: number }
  | StatError {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  // X 값이 모두 동일하면 sxx=0 → 기울기가 무한대가 되므로 계산 불가 처리
  if (sxx === 0) {
    return {
      error: "X 값이 모두 동일해 회귀선을 계산할 수 없습니다 (분산이 0).",
    };
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const corr = pearsonCorrelation(x, y);
  if ("error" in corr) return corr;
  const { r, df, t, p } = corr;
  const r2 = r * r;
  return { slope, intercept, r2, t, df, p };
}

/**
 * 천 단위 쉼표가 붙은 하나의 수인지 판정하는 패턴.
 * `1,200` `12,345` `-1,234.56` `1,234,567` 은 통과, `12,15` `1,2345` `0,123` 은 불통과.
 * (선행 그룹은 1~3자리, 이후 그룹은 정확히 3자리여야 한다.)
 */
const THOUSANDS_GROUPED = /^[+-]?[1-9]\d{0,2}(?:,\d{3})+(?:\.\d+)?$/;

export type Tokenized = {
  tokens: string[];
  /** 쉼표를 천 단위 구분자로 읽어 합친 토큰 수 (>0이면 사용자에게 알릴 가치가 있다). */
  thousandsMergedCount: number;
  /** 천 단위로도 읽힐 수 있었지만 구분자로 해석한 덩어리 수 (혼합 입력의 모호함 신호). */
  ambiguousCommaCount: number;
};

/**
 * 숫자 목록 토크나이저.
 *
 * 규칙 — **공백(줄바꿈·탭·전각공백 포함)이 1차 구분자**이고, 쉼표의 역할은
 * 입력 전체를 보고 한 번에 정한다:
 *   1. 공백으로 자른 덩어리 중 쉼표를 품은 것을 모은다.
 *   2. 그 덩어리가 **전부** `THOUSANDS_GROUPED`에 맞으면 → 쉼표는 천 단위 구분자.
 *      (`"1,200 1,500"` → 1200, 1500)
 *   3. 하나라도 어긋나면 → 쉼표는 값 구분자. (`"12,15,14"` → 12, 15, 14.
 *      `"12,15"`는 천 단위 형식이 아니므로 2번에서 탈락한다.)
 *
 * 근거: 천 단위 표기는 "쉼표 뒤 정확히 3자리"라는 강한 형식 제약을 갖지만
 * 값 구분자로 쓴 쉼표는 그렇지 않다. 한 입력 안에서 두 용법을 섞을 이유는
 * 거의 없으므로, 덩어리 하나라도 천 단위 형식을 어기면 입력 전체를 구분자
 * 용법으로 본다 — 기존 `12,15,14` 사용법을 절대 깨지 않는 쪽이 안전하다.
 *
 * 남는 모호함: `"1,200"`이나 `"12,345"`는 두 해석이 모두 가능하다. 이때는
 * 천 단위로 읽되 `thousandsMergedCount`로 신호를 남겨 UI가 사용자에게
 * 되물을 수 있게 한다. 반대로 혼합 입력에서 구분자로 해석해버린 덩어리는
 * `ambiguousCommaCount`로 센다.
 */
export function tokenizeNumberList(text: string): Tokenized {
  // 한글 IME에서 나올 수 있는 전각 쉼표·모점을 반각으로 정규화한다.
  // (전각 공백 U+3000·탭·줄바꿈은 정규식 \s가 이미 포함한다.)
  const normalized = text.replace(/[，、]/g, ",");
  const chunks = normalized.split(/\s+/).filter(Boolean);
  const commaChunks = chunks.filter((c) => c.includes(","));
  const useThousands =
    commaChunks.length > 0 &&
    commaChunks.every((c) => THOUSANDS_GROUPED.test(c));

  const tokens: string[] = [];
  let thousandsMergedCount = 0;
  let ambiguousCommaCount = 0;
  for (const chunk of chunks) {
    if (!chunk.includes(",")) {
      tokens.push(chunk);
      continue;
    }
    if (useThousands) {
      tokens.push(chunk.replace(/,/g, ""));
      thousandsMergedCount++;
      continue;
    }
    if (THOUSANDS_GROUPED.test(chunk)) ambiguousCommaCount++;
    for (const t of chunk.split(",")) {
      if (t) tokens.push(t);
    }
  }
  return { tokens, thousandsMergedCount, ambiguousCommaCount };
}

/** 숫자 목록 파싱 — 숫자로 읽지 못해 제외한 토큰 수도 함께 돌려준다. */
export function parseNumberListDetailed(text: string): {
  values: number[];
  droppedCount: number;
  thousandsMergedCount: number;
  ambiguousCommaCount: number;
} {
  const { tokens, thousandsMergedCount, ambiguousCommaCount } =
    tokenizeNumberList(text);
  // Infinity 같은 값도 통계 계산에는 쓸 수 없으므로 isFinite로 거른다
  const values = tokens.map(Number).filter((n) => Number.isFinite(n));
  return {
    values,
    droppedCount: tokens.length - values.length,
    thousandsMergedCount,
    ambiguousCommaCount,
  };
}
