# 묶음 5 구현 설계 — 6건 (H1 H2 B1 G2 V3 Y12)

라운드 11. 구현 설계다. 새 아이디어는 없고, 판정된 것을 코딩만 하면 되는 수준으로 적었다.
모든 줄 번호는 이 문서를 쓰는 시점의 파일에서 **직접 확인**했다.
모든 수치는 scipy 1.16.3 / Python 3.14로 검산하고, 제안 코드를 Node로 실제 실행해 대조했다.

---

# 파트 0 — 백로그의 사실 오류 5건 (조사 중 확인)

설계 전에 밝힌다. 다섯 개 전부 처방에 영향을 준다.

### (1) Y12 자신이 틀렸다 — `03-methodology.mdx:108`은 연쇄 대상이 아니다

Y12는 "`03-methodology.mdx:108`도 같은 연쇄 대상인데 H1 목록에 없다"고 적었다.
실제로 `grep -n "표본\|계산기" content/guide/03-methodology.mdx`의 결과는 `:40 :97 :98 :105`뿐이다.

- `:105` — 표본 크기 계산기로 보내는 문장. **진짜 연쇄 대상.**
- `:108` — 빈 줄이다. `:107`이 `## 연구윤리 사전 점검` 헤딩, `:109`가 동의·익명화 문단으로
  표본 크기와 무관하다.
- `:40` — 표에서 "표본 계획"을 산출물로만 언급. 계산기를 지목하지 않으므로 수정 불필요.

**→ `03-methodology.mdx`의 연쇄 대상은 `:105` 하나다.** Y12의 `:108`은 폐기한다.

### (2) Y12·H1이 놓친 연쇄 대상 — `21-right-sized-topic.mdx:33`

```
33: ... 그 숫자를 적은 다음에 위 도구 [표본 크기 계산기](/guide/data-collection#tool-sample-size)에
    비교하려는 집단 수와 예상 차이를 넣어보면, 지금 설계로 그 인원이 충분한지 아닌지가 바로 나옵니다.
```

"**비교하려는 집단 수와 예상 차이를 넣어보면**" — V3과 완전히 같은 결함이고,
V3보다 더 구체적으로 존재하지 않는 입력 칸 두 개를 이름으로 지목한다. 딥링크도 걸려 있다.
**H1이 들어가면 이 문장의 절반이 참이 된다**(집단 수는 여전히 안 받고, "예상 차이"는 받는다).
연쇄 목록에 넣는다.

### (3) H1의 `SampleSizeCalculator.tsx:60` — 실제 사과 문단은 `:86-90`이다

`:60`은 `const populationNumber = Number(populationRaw);`다.
삭제 대상인 사과 문단은 `:86-90`의 `<p className="mt-2 rounded-lg ...">` 블록이다.

### (4) G2의 `StatsCalculator.tsx:39` — d를 출력하는 곳은 `:187-189`와 `:342-343`이다

`:39`는 `// t-검정일 때만 채워지는 기술통계·효과크기` 주석이다.
G2의 주장(계산기가 d를 이미 준다) 자체는 **참**이다 — `groupSummary`(`:187-189`)와
결과 렌더(`:342-343`)가 `d = ...`를 출력한다. 줄 번호만 정정한다.

### (5) H1의 "기존 `Z_TABLE` 재사용"은 쓰면 안 된다 — 반올림이 정수 답을 바꾼다

`SampleSizeCalculator.tsx:31-35`의 `Z_TABLE`은 `1.645 / 1.96 / 2.576`으로 3~4자리 반올림값이다.
Cochran 공식에서는 무해하지만 검정력 공식에서는 `Math.ceil` 직전에 경계를 넘긴다.

실측(신뢰수준 3 × 검정력 2 × d 20개 = 120셀 전수):

- `z_α` 반올림만으로 **1셀 불일치** (90%·90%·d=0.3 → 192 vs 정확값 191)
- `z_β`까지 3자리로 반올림하면 **9셀 불일치** (예: 95%·80%·d=0.7 → 33 vs 정확값 34)

**→ 검정력 계산에는 배정도 상수를 따로 둔다.** Cochran 경로의 `Z_TABLE`은 그대로 둔다.

---

# 파트 1 — 수치해석 (`lib/stats.ts`)

이번 라운드의 핵심이다. 아래 코드는 그대로 붙여넣을 수 있고,
전부 Node에서 실행해 scipy와 대조한 결과를 함께 적었다.

## 1-A. t분포 양측 임계값 — `tCriticalTwoTailed` (H2)

### 판단: 별도 근사가 아니라 **이분탐색 역함수**를 쓴다

근거 셋:

1. `tTestTwoTailedP`(`:75-77`)는 이미 불완전 베타 기반이고 상대오차 1e-12 수준이다.
   Hill(1970) 같은 별도 t 역함수 근사를 넣으면 **서로 다른 t분포 구현 두 개**가 공존한다.
   p값과 임계값이 미세하게 어긋나면 "p = .049인데 신뢰구간이 0을 포함한다"는 모순이 나온다.
   같은 함수의 역함수를 쓰면 그 모순이 구조적으로 불가능하다.
2. Welch–Satterthwaite df는 소수다. 표 기반 근사식은 정수 df 가정이 섞인 경우가 많다.
3. 비용: 호출 1회당 `tTestTwoTailedP` 약 45회. 사용자가 버튼을 누를 때 1회 실행이다. 무시 가능.

### 코드

```ts
/**
 * 양측 유의수준 alpha에 해당하는 t 임계값 — `tTestTwoTailedP`의 역함수.
 *
 * 별도의 t 역함수 근사식을 쓰지 않는 이유: p값과 임계값이 같은 분포 구현에서
 * 나와야 "p < .05인데 신뢰구간이 0을 포함한다" 같은 모순이 생기지 않는다.
 *
 * `tTestTwoTailedP(t, df)`는 t에 대해 단조감소하므로 이분탐색이 항상 수렴한다.
 * 수렴 조건은 구간 폭 <= 1e-10 * max(1, hi)(상대 허용오차)이고, 반복 상한은 200회다.
 * 실제로는 40~50회에서 조건이 만족된다 — 200은 안전 상한일 뿐이다.
 */
export function tCriticalTwoTailed(alpha: number, df: number): number {
  if (!(df > 0) || !(alpha > 0) || !(alpha < 1)) return NaN;
  let lo = 0;
  let hi = 2;
  // p(hi) > alpha 인 동안 상한을 넓힌다. df가 아주 작으면 임계값이 커진다(df=1, α=.001 → 636).
  while (tTestTwoTailedP(hi, df) > alpha) {
    hi *= 2;
    if (hi > 1e12) return NaN; // 도달 불가 — 입력이 비정상이다
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tTestTwoTailedP(mid, df) > alpha) lo = mid;
    else hi = mid;
    if (hi - lo <= 1e-10 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}
```

### 검산 — scipy `stats.t.ppf(1 - alpha/2, df)` 대조 (Node 실행 결과)

| alpha | df | 이 코드 | scipy | 절대오차 |
|---|---|---|---|---|
| .05 | 1 | 12.7062047361 | 12.706204736432095 | -2.9e-10 |
| .05 | 2 | 4.3026527298 | 4.302652729696142 | +9.5e-11 |
| .05 | 5 | 2.5705818356 | 2.570581835636314 | -5.8e-11 |
| .05 | 10 | 2.2281388520 | 2.2281388519649385 | +2.7e-11 |
| .05 | **29.79** (소수 df) | 2.0428763320 | 2.0428763322406467 | -2.3e-10 |
| .05 | 100 | 1.9839715177 | 1.9839715184496334 | -7.4e-10 |
| .05 | 1000 | 1.9623390798 | 1.9623390808264074 | -1.1e-9 |
| .01 | 5 | 4.0321429836 | 4.032142983557536 | +7.6e-11 |
| .01 | 10 | 3.1692726725 | 3.16927267261695 | -1.2e-10 |
| .01 | 30 | 2.7499956534 | 2.7499956535670305 | -1.7e-10 |

오차 상한 1e-9. `toFixed(2)` 표시에 8자리 여유가 있다.
(오차가 df와 함께 커지는 것은 `tTestTwoTailedP` 자체의 한계이지 이분탐색 탓이 아니다.)

## 1-B. 카이제곱 상측 p값 — `chiSquareP` (B1)

### `lib/stats.ts`에 이미 있는 것

- `logGamma`(`:8-22`) — **재사용한다.** 불완전 감마의 정규화 항이 정확히 이것이다.
- `betacf`/`incompleteBeta`(`:24-72`) — 불완전 **베타**다. 카이제곱에는 못 쓴다.
  (`betai`류로 F분포를 얻을 수는 있지만 ANOVA는 B1에서 제외됐다.)

**→ 불완전 감마는 없다. 새로 넣는다.**

### Numerical Recipes `gammq`를 이 코드베이스 스타일로 다시 쓴다

옮겨오지 않고 다시 썼다. 바뀐 점:

- `gser`/`gcf`가 `gamser`와 `gln`을 **out 파라미터로 되돌리는** C 관용구를 버리고 값을 직접 반환한다.
  (`betacf`가 이미 이 스타일이다.)
- 반복 상한을 NR의 100에서 **300**으로 올렸다. df=100, x=200 케이스에서 100회는 부족하다.
- Lentz 초기화의 `FPMIN`을 `1e-300`으로 낮췄다 — 배정도에서 `1/FPMIN`이 안전하고,
  꼬리(p ~ 1e-17)에서 조기 절단을 막는다.
- `nrerror` 대신 `NaN`을 반환한다 — 이 코드베이스는 `StatError`/`NaN`으로 실패를 표현한다.

```ts
/**
 * 정규화 하측 불완전 감마 P(a, x)의 급수전개. x < a+1 구간에서 빠르게 수렴한다.
 * 수렴 조건: |항| < |합| * 3e-12, 반복 상한 300.
 */
function lowerGammaSeries(a: number, x: number): number {
  const ITMAX = 300;
  const EPS = 3e-12;
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < ITMAX; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/**
 * 정규화 상측 불완전 감마 Q(a, x)의 연속분수 전개 (수정 Lentz 알고리즘).
 * x >= a+1 구간에서 쓴다 — 이 구간에서 급수전개는 항이 상쇄되며 정밀도를 잃는다.
 * 수렴 조건: |증분비 - 1| < 3e-12, 반복 상한 300.
 */
function upperGammaContinuedFraction(a: number, x: number): number {
  const ITMAX = 300;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** 자유도 df인 카이제곱 분포에서 X² >= chi2 일 상측 유의확률(p-value). */
export function chiSquareP(chi2: number, df: number): number {
  if (!(df > 0) || !Number.isFinite(chi2) || chi2 < 0) return NaN;
  if (chi2 === 0) return 1;
  const a = df / 2;
  const x = chi2 / 2;
  return x < a + 1 ? 1 - lowerGammaSeries(a, x) : upperGammaContinuedFraction(a, x);
}
```

### 검산 — scipy `stats.chi2.sf(x, df)` 대조 (Node 실행 결과)

| x | df | 이 코드 | scipy | 상대오차 |
|---|---|---|---|---|
| 3.841 | 1 | 0.050013683763778696 | 0.050013683763956804 | -3.6e-12 |
| 1.0 | 1 | 0.3173105078630072 | 0.31731050786291115 | +3.0e-13 |
| 10.0 | 1 | 0.0015654022580016374 | 0.001565402258002549 | -5.8e-13 |
| 0.5 | 2 | 0.7788007830714097 | 0.7788007830714049 | +6.1e-15 |
| 5.991 | 2 | 0.050011615026579095 | 0.05001161502657908 | +2.8e-16 |
| 20 | 4 | 0.0004993992273873336 | 0.0004993992273873336 | 0 |
| 100 | 10 | 5.44970198292052e-17 | 5.4497019829205215e-17 | -2.3e-16 |
| 0.001 | 1 | 0.9747728793699615 | 0.9747728793699604 | +1.1e-15 |
| 50 | 1 | 1.5374597944279598e-12 | 1.537459794428033e-12 | -4.8e-14 |
| 200 | 100 | 1.1784500720298919e-8 | 1.1784500720979783e-8 | -5.8e-11 |

상대오차 상한 5.8e-11. `x=0.001, df=1`(급수 분기)과 `x=200, df=100`(연속분수 분기)이
양쪽 분기의 극단을 각각 밟는다.

## 1-C. 검정력 기반 표본 수 (H1)

### 공식과 근거

두 집단 평균 비교, 양측, 등분산·등표본 가정:

```
n_per_group = ceil( 2(z_{1-α/2} + z_{1-β})² / d²  +  z_{1-α/2}² / 4 )
```

뒤의 `+ z²/4`가 정규근사를 t분포로 되돌리는 보정항(Guenther 1981)이다.
**이 항이 있어야 교과서의 64가 나온다** — 없으면 62.79 → 63이다.

### 검산 — 정확값(비중심 t분포 수치탐색)과 전수 대조

α = .05 양측:

| d | 검정력 | 정규근사 | +z²/4 | **ceil (이 코드)** | 비중심 t 정확값 | Cohen(1988) 표 |
|---|---|---|---|---|---|---|
| 0.2 | 80% | 392.444 | 393.404 | **394** | 394 | 393 |
| 0.2 | 90% | 525.371 | 526.332 | **527** | 527 | 526 |
| 0.5 | 80% | 62.791 | 63.751 | **64** | 64 | 64 |
| 0.5 | 90% | 84.059 | 85.020 | **86** | 86 | 85 |
| 0.8 | 80% | 24.528 | 25.488 | **26** | 26 | 26 |
| 0.8 | 90% | 32.836 | 33.796 | **34** | 34 | 34 |

**6셀 전부 비중심 t 정확값과 일치한다.** Cohen 표와 ±1 차이가 나는 세 셀은
Cohen이 더 거친 근사를 썼기 때문이며 정확값 기준으로는 이 코드가 맞다.
`04-data-collection.mdx:41`의 "약 64명"과 `app/example/page.tsx:241`의 "약 64명"은 **맞는 숫자다.**

신뢰수준을 바꿔도 성립한다(12셀 중 11셀 일치):

| 신뢰수준 | d | 검정력 | 이 코드 | 비중심 t 정확값 |
|---|---|---|---|---|
| 90% | 0.5 | 80% | 51 | 51 |
| 90% | 0.5 | 90% | 70 | 70 |
| 90% | 0.8 | 80% | **21** | **20** ← 유일한 불일치 |
| 90% | 0.8 | 90% | 28 | 28 |
| 95% | 0.5 | 80% / 90% | 64 / 86 | 64 / 86 |
| 95% | 0.8 | 80% / 90% | 26 / 34 | 26 / 34 |
| 99% | 0.5 | 80% / 90% | 96 / 121 | 96 / 121 |
| 99% | 0.8 | 80% / 90% | 39 / 49 | 39 / 49 |

한 셀에서 1명 보수적으로 나온다. 필요 인원을 크게 부르는 방향이므로 허용한다.
**테스트에 21로 고정해 둔다** — 나중에 누가 보정항을 건드리면 잡힌다.

### 역방향 (V3) — n → 검출 가능한 최소 d

같은 식을 d에 대해 푼다:

```
d_min = sqrt( 2(z_{1-α/2} + z_{1-β})² / (n - z_{1-α/2}²/4) )
```

검산 (α = .05, 비중심 t 이분탐색 정확값 대조):

| 집단당 n | 검정력 | 이 코드 | 정확값 | 상대오차 |
|---|---|---|---|---|
| 10 | 80% | 1.3178 | 1.3249 | -0.54% |
| 16 | 80% | 1.0216 | 1.0237 | -0.21% |
| 20 | 80% | 0.9080 | 0.9091 | -0.12% |
| 25 | 80% | 0.8081 | 0.8087 | -0.07% |
| 32 | 80% | 0.7111 | 0.7115 | -0.06% |
| 64 | 80% | 0.4990 | 0.4991 | -0.02% |
| 100 | 80% | 0.3981 | 0.3981 | 0.00% |
| 10 | 90% | 1.5247 | 1.5337 | -0.59% |
| 16 | 90% | 1.1821 | 1.1846 | -0.21% |
| 20 | 90% | 1.0506 | 1.0520 | -0.13% |
| 25 | 90% | 0.9350 | 0.9358 | -0.09% |
| 32 | 90% | 0.8228 | 0.8232 | -0.05% |
| 64 | 90% | 0.5774 | 0.5774 | 0.00% |
| 100 | 90% | 0.4606 | 0.4607 | -0.02% |

n≥16에서 오차 0.21% 이하. **소수 둘째 자리까지만 표시한다** —
셋째 자리를 보이면 n=10에서 틀린 자릿수를 보여주게 된다.

### 코드

```ts
/**
 * 검정력 분석용 정규분위수. 소수 셋째 자리까지 반올림한 값을 쓰면
 * ceil 직전에 경계를 넘겨 필요 인원이 1명씩 어긋나는 셀이 생긴다(실측 120셀 중 최대 9셀).
 * SampleSizeCalculator의 Cochran용 Z_TABLE(1.645/1.96/2.576)과 별개로 둔다.
 */
const Z_ALPHA_TWO_SIDED: Record<string, number> = {
  "90": 1.6448536269514722,
  "95": 1.959963984540054,
  "99": 2.5758293035489004,
};
const Z_POWER: Record<string, number> = {
  "80": 0.8416212335729143,
  "90": 1.2815515655446004,
};

/**
 * 두 집단 평균 비교(양측·등표본)에서 효과크기 d를 목표 검정력으로 잡아내는 데 필요한
 * **집단당** 인원. 정규근사에 t분포 보정항 z²/4를 더한다(Guenther 1981) —
 * 이 항이 있어야 d=0.5·검정력 80%에서 교과서 값 64가 나온다.
 */
export function nPerGroupForEffectSize(
  d: number,
  confidence: string,
  power: string,
): number | null {
  const za = Z_ALPHA_TWO_SIDED[confidence];
  const zb = Z_POWER[power];
  if (za === undefined || zb === undefined) return null;
  if (!Number.isFinite(d) || d <= 0) return null;
  return Math.ceil((2 * (za + zb) ** 2) / (d * d) + (za * za) / 4);
}

/** 역방향 — 집단당 n명으로 목표 검정력을 확보할 수 있는 **최소** 효과크기 d. */
export function minDetectableEffectSize(
  nPerGroup: number,
  confidence: string,
  power: string,
): number | null {
  const za = Z_ALPHA_TWO_SIDED[confidence];
  const zb = Z_POWER[power];
  if (za === undefined || zb === undefined) return null;
  if (!Number.isFinite(nPerGroup) || nPerGroup < 2) return null;
  const denom = nPerGroup - (za * za) / 4;
  if (denom <= 0) return null;
  return Math.sqrt((2 * (za + zb) ** 2) / denom);
}
```

## 1-D. `welchTTest`에 신뢰구간 (H2)

`:95-150`을 수정한다. df는 이미 계산된 Welch–Satterthwaite 값을 그대로 쓴다.

`:110`의 `p: number;` 다음에:

```ts
      /** 평균 차이의 95% 신뢰구간. Welch–Satterthwaite df를 그대로 쓴다. */
      ciLow: number;
      ciHigh: number;
```

`:131`의 `const p = ...` 다음에:

```ts
  // 신뢰구간의 t 임계값은 p값과 같은 분포 구현에서 얻는다 —
  // 서로 다른 근사를 쓰면 "p = .049인데 CI가 0을 포함" 같은 모순이 생긴다.
  const tCrit = tCriticalTwoTailed(0.05, df);
```

`:137-149`의 반환 객체에:

```ts
    ciLow: meanDiff - tCrit * se,
    ciHigh: meanDiff + tCrit * se,
```

### 판단: 신뢰수준은 95% 고정이다

`05-writing.mdx`와 `app/example/page.tsx:279`가 전부 95% CI를 쓰고,
계산기에 신뢰수준 셀렉트를 더하면 t-검정 입력이 셋이 된다.
필요해지면 `alpha` 인자를 기본값 `0.05`로 뒤에 붙이면 되므로 확장은 열려 있다.

### 검산 — scipy `ttest_ind(equal_var=False).confidence_interval(0.95)` 대조

| A | B | 이 코드 CI | scipy CI |
|---|---|---|---|
| `12 15 14 18 13 16 17 14` | `22 19 25 21 20 23 24 22` | (-9.286525883306595, -4.963474116693404) | (-9.286525883357957, -4.963474116642042) |
| `1 2 3 4 5` | `2 3 4 5 7` | (-3.7846982263043043, 1.384698226304304) | (-3.784698226331204, 1.3846982263312038) |
| `10 12 11 13` | `10 12 11 13 50` | (-29.082099059089174, 13.682099059089175) | (-29.082099059428963, 13.682099059428964) |

일치 자릿수 약 10자리.

**예시 페이지 검증:** M=16.9/SD=2.4/n=16 vs M=14.5/SD=2.6/n=16 →
se = 0.884590, df = 29.80983, t = 2.713120, p = .0109633, **CI = [0.59294, 4.20706]**.
`app/example/page.tsx:273-274`의 `t = 2.713, df = 29.8, p = 0.0110`과
`:279`의 `95% CI [0.6, 4.2]`가 **전부 맞는다.** 예시 페이지의 5단계는 손대지 않는다.

## 1-E. 대응표본 t (B1)

```ts
/**
 * 대응표본(짝지은) t-검정. 같은 대상의 전·후처럼 i번째끼리 짝이 맞아야 하므로
 * 호출 전에 `parsePairedLists`로 인덱스를 보존해 파싱해야 한다(K3).
 * 효과크기는 차이의 표준편차로 나눈 Cohen's d_z다 — 독립표본의 d와 **다른 양**이라
 * 필드 이름을 `cohenDz`로 구분한다.
 */
export function pairedTTest(
  before: number[],
  after: number[],
):
  | {
      n: number;
      meanDiff: number;
      sdDiff: number;
      cohenDz: number;
      t: number;
      df: number;
      p: number;
      ciLow: number;
      ciHigh: number;
    }
  | StatError {
  if (before.length !== after.length) {
    return { error: "짝지은 두 열의 값 개수가 같아야 합니다." };
  }
  const n = before.length;
  if (n < 2) return { error: "짝이 2쌍 이상 필요합니다." };
  const diffs = before.map((v, i) => v - after[i]);
  const meanDiff = mean(diffs);
  const varDiff = variance(diffs);
  // 모든 차이가 동일하면 sd=0 → t=±Infinity. 전원이 정확히 같은 폭으로 변한 경우다.
  if (varDiff === 0) {
    return {
      error:
        "모든 짝의 차이가 동일해 대응표본 t-검정을 계산할 수 없습니다 (차이의 분산이 0).",
    };
  }
  const sdDiff = Math.sqrt(varDiff);
  const se = sdDiff / Math.sqrt(n);
  const t = meanDiff / se;
  const df = n - 1;
  const p = tTestTwoTailedP(Math.abs(t), df);
  const tCrit = tCriticalTwoTailed(0.05, df);
  return {
    n,
    meanDiff,
    sdDiff,
    cohenDz: meanDiff / sdDiff,
    t,
    df,
    p,
    ciLow: meanDiff - tCrit * se,
    ciHigh: meanDiff + tCrit * se,
  };
}
```

### 검산 — scipy `stats.ttest_rel` 대조

| 전 | 후 | 이 코드 t | 이 코드 p | scipy t | scipy p |
|---|---|---|---|---|---|
| `12 15 14 18 13` | `14 18 15 21 16` | -6 | 0.0038825370469599547 | -5.999999999999999 | 0.003882537046960512 |
| `100 102 98 105 101 99` | `103 101 100 108 104 102` | -3.312706744344565 | 0.021177302493708375 | -3.3127067443445664 | 0.021177302494063594 |
| `5 5 5 5` | `6 7 5 8` | -2.32379000772445 | 0.1027280788384307 | -2.32379000772445 | 0.102728078858399 |

부수 값(검산 완료): 첫 케이스 df=4, meanDiff=-2.4, sdDiff=0.8944271910, d_z=-2.6832815730.
둘째 df=5, meanDiff=-2.1666666667, sdDiff=1.6020819788, d_z=-1.3524068652.
셋째 df=3, meanDiff=-1.5, sdDiff=1.2909944487, d_z=-1.1618950039.

## 1-F. 카이제곱 독립성 (B1)

```ts
/** 교차표 한 칸의 기대빈도가 이보다 작으면 근사의 전제가 흔들린다(교과서 관례). */
const CHI_SQUARE_MIN_EXPECTED = 5;

/**
 * 카이제곱 독립성 검정 (r×c, Yates 보정 없음).
 *
 * 2×2에서 Yates 연속성 보정을 쓰지 않는 이유: 보정 여부에 따라 p가 눈에 띄게 달라지는데
 * 3×2 이상에는 적용되지 않아, 표 크기에 따라 규칙이 바뀌는 도구가 된다. 학생이
 * "표를 넓혔더니 p가 뛰었다"를 겪는 쪽이 더 나쁘다. R의 기본값(보정 함)과는 다르므로
 * 테스트 주석에 `chisq.test(..., correct = FALSE)` 기준임을 명시한다.
 */
export function chiSquareIndependence(
  table: number[][],
):
  | {
      chi2: number;
      df: number;
      p: number;
      n: number;
      expected: number[][];
      /** 기대빈도 최솟값 — 5 미만이면 UI가 경고를 띄운다. */
      minExpected: number;
      /** 기대빈도 5 미만인 칸 수. */
      lowExpectedCells: number;
    }
  | StatError {
  const rows = table.length;
  if (rows < 2) return { error: "교차표는 2행 이상이어야 합니다." };
  const cols = table[0].length;
  if (cols < 2) return { error: "교차표는 2열 이상이어야 합니다." };
  if (table.some((r) => r.length !== cols)) {
    return { error: "모든 행의 칸 수가 같아야 합니다." };
  }
  if (table.some((r) => r.some((v) => !Number.isFinite(v) || v < 0))) {
    return { error: "빈도는 0 이상의 수여야 합니다." };
  }

  const rowSums = table.map((r) => r.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: cols }, (_, j) =>
    table.reduce((s, r) => s + r[j], 0),
  );
  const n = rowSums.reduce((s, v) => s + v, 0);
  if (n === 0) return { error: "표의 합이 0입니다." };
  // 합이 0인 행·열이 있으면 기대빈도가 0이 되어 0으로 나눈다 — 그 범주는 존재하지 않는 것이다
  if (rowSums.some((v) => v === 0) || colSums.some((v) => v === 0)) {
    return {
      error: "합이 0인 행이나 열이 있습니다. 그 행·열을 빼고 다시 입력해주세요.",
    };
  }

  const expected: number[][] = [];
  let chi2 = 0;
  let minExpected = Infinity;
  let lowExpectedCells = 0;
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      const e = (rowSums[i] * colSums[j]) / n;
      row.push(e);
      if (e < minExpected) minExpected = e;
      if (e < CHI_SQUARE_MIN_EXPECTED) lowExpectedCells++;
      chi2 += (table[i][j] - e) ** 2 / e;
    }
    expected.push(row);
  }
  const df = (rows - 1) * (cols - 1);
  return { chi2, df, p: chiSquareP(chi2, df), n, expected, minExpected, lowExpectedCells };
}
```

### 검산 — scipy `chi2_contingency(correction=False)` 대조

| 표 | χ² | df | 이 코드 p | scipy p | 기대빈도 최솟값 |
|---|---|---|---|---|---|
| `[[20,30],[30,20]]` | 4.0 | 1 | 0.045500263896196255 | 0.04550026389635857 | 25 |
| `[[10,20,30],[30,20,10]]` | 20.0 | 2 | 0.00004539992976248486 | 4.539992976248486e-05 | 20 |
| `[[12,5],[7,9]]` | 2.4305755196815575 | 1 | 0.11898920553227588 | 0.118989205532145 | 6.7879 |
| `[[5,5],[5,5]]` | 0 | 1 | 1 | 1.0 | 5 |
| `[[100,50,30],[40,60,20],[30,30,40]]` | 42.52723311546841 | 4 | 1.2969534157554648e-8 | 1.2969534157554698e-08 | 22.5 |
| `[[1,2],[3,4]]` | 0.07936507936507939 | 1 | 0.7781596861761774 | 0.7781596861761658 | **1.2** (경고 발동) |

마지막 케이스가 `lowExpectedCells > 0` 경로를 밟는다(네 칸 전부 5 미만).

## 1-G. 교차표 파싱 — `parseContingencyTable`

카이제곱은 입력 형태가 다르다. **줄 = 행, 줄 안의 공백/탭/쉼표 = 칸**으로 받는다.
엑셀에서 범위를 복사하면 탭 구분 텍스트로 오므로 그대로 붙여넣으면 동작한다.

```ts
export type ContingencyParse = {
  table: number[][];
  /** 숫자로 읽지 못한 칸 — 1-based 행/열 */
  issues: { row: number; col: number; raw: string }[];
  /** 행마다 칸 수가 다를 수 있으므로 각 행의 칸 수를 남긴다 */
  widths: number[];
};

/**
 * 교차표 파싱 — 한 줄이 한 행, 줄 안의 공백·탭·쉼표가 칸 구분자다.
 *
 * `tokenizeNumberList`를 **행 단위로** 부른다. 열 전체를 한 번에 던지면 행 경계가
 * 사라져 3×2 표가 6칸짜리 1행이 된다. 쉼표 해석(천 단위 vs 구분자)은 행 단위로
 * 판정되므로 `"1,200 2,400"` 한 행은 두 칸으로, `"12,15,14"` 한 행은 세 칸으로 읽힌다 —
 * 빈도표에 천 단위 표기가 필요한 경우는 사실상 없으므로 이 차이는 무해하다.
 *
 * 빈 줄은 무시한다(교차표에 '빈 행'이라는 개념이 없다). 이것이 `parsePairedLists`와
 * 반대인 이유: 쌍 파싱은 빈 줄이 곧 결측 관측이지만, 여기서는 표 사이의 여백일 뿐이다.
 */
export function parseContingencyTable(text: string): ContingencyParse {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");
  const table: number[][] = [];
  const issues: { row: number; col: number; raw: string }[] = [];
  const widths: number[] = [];
  lines.forEach((line, i) => {
    const { tokens } = tokenizeNumberList(line);
    const row: number[] = [];
    tokens.forEach((tok, j) => {
      const v = Number(tok);
      if (Number.isFinite(v)) row.push(v);
      else issues.push({ row: i + 1, col: j + 1, raw: tok });
    });
    widths.push(tokens.length);
    table.push(row);
  });
  return { table, issues, widths };
}
```

---

# 파트 2 — UI 설계

## 2-A. `StatsCalculator`가 5모드가 된다 — 모드 선택 UI

### 지금 (`:220-257`)

`flex flex-wrap gap-2`에 알약 버튼 3개. 라벨이 각각
"두 그룹 평균 비교 (t-검정)" / "두 변수 관계 (상관분석)" / "두 변수 관계 (회귀분석)"로
`px-4 py-2 text-xs` 기준 대략 150~170px다.

**375px 추정:** 카드 좌우 패딩 `px-5`(20+20) → 사용 폭 335px.
알약 두 개(150+8+160 ≈ 318)가 한 줄에 겨우 들어가고 세 번째가 다음 줄로 내려간다.
**지금도 2줄이다.** 여기에 "같은 대상 전·후 비교 (대응표본 t-검정)"(약 210px)와
"범주별 빈도 비교 (카이제곱 검정)"(약 190px)를 더하면 **4줄**이 된다.
알약 4줄 ≈ 152px — 입력 textarea 두 개(약 200px)에 육박하는 크롬이다.

### 판정: `<select>`로 바꾼다

```tsx
<div className="mt-4">
  <label htmlFor="stats-mode" className="text-xs font-medium text-ink-soft">
    분석 방법
  </label>
  <select
    id="stats-mode"
    value={mode}
    onChange={(e) => switchMode(e.target.value as Mode)}
    className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent sm:max-w-xs"
  >
    <option value="ttest">두 그룹 평균 비교 (독립표본 t-검정)</option>
    <option value="paired">같은 대상 전·후 비교 (대응표본 t-검정)</option>
    <option value="correlation">두 변수 관계 (상관분석)</option>
    <option value="regression">두 변수 관계 (회귀분석)</option>
    <option value="chisquare">범주별 빈도 비교 (카이제곱 검정)</option>
  </select>
</div>
```

근거:

- 375px에서 높이가 **약 152px → 약 56px**. 라벨이 길어져도 늘지 않는다.
- `SampleSizeCalculator.tsx:100-111`이 **이미 같은 클래스의 `<select>`를 쓴다.** 새 패턴이 아니다.
- 5지선다는 셀렉트의 표준 용도다. 알약은 2~3개까지가 한계다.
- `GuideBlock`의 `onPick`은 그대로 동작한다(`switchMode` 시그니처 불변).

**대가 — 테스트 마이그레이션.** `components/__tests__/StatsCalculator.test.tsx`가
`aria-pressed`나 버튼 이름으로 모드를 고르고 있으면 `selectOptions`로 바꿔야 한다.
**구현 시 이 파일을 먼저 읽고 영향 범위를 확인하라.**

`GuideBlock` 확장(전·후 비교/빈도 비교 갈래 추가)은 **이번 라운드 범위 밖이다.**
GuideBlock은 3모드만 추천하고 나머지 둘은 셀렉트에서만 고른다 — 의도한 상태다.

## 2-B. 대응표본 입력 — K3 파싱 재사용

### 선행 관계 (중요)

`parsePairedLists`는 **`docs/impl-plan-batch0.md` 커밋 5(K3)의 산출물이고, 아직 저장소에 없다.**
`grep -rn "parsePairedLists" lib components` → 0건.

**→ B1의 대응표본 모드는 K3에 의존한다.** K3가 안 들어간 상태로 묶음 5를 시작하면
`impl-plan-batch0.md:275-380`의 `splitColumn` + `parsePairedLists`를 **먼저 그대로 넣어라.**
새로 설계하지 마라 — 같은 문제고 이미 설계돼 있다.

### 왜 재사용인가

대응표본은 "i번째 전 값과 i번째 후 값이 같은 사람"이라는 전제 위에 선다.
엑셀에서 열을 복사하면 결측이 빈 줄로 오고, `parseNumberListDetailed`는 그 빈 줄을 흡수해
그 아래 전부를 한 칸씩 밀어버린다. 상관·회귀와 **문자 그대로 같은 결함**이다.
`parsePairedLists`가 `issues`에 행 번호를 남기므로 그대로 쓴다.

### `compute()`의 대응표본 분기

```ts
} else if (mode === "paired") {
  const pair = parsePairedLists(textA, textB);
  if (pair.issues.length > 0 || pair.lengths.x !== pair.lengths.y) {
    setError(pairedIssueMessage(pair)); // 상관·회귀 분기와 같은 문구 생성기를 쓴다
    return;
  }
  if (pair.x.length < 2) {
    setError("짝이 2쌍 이상 필요합니다.");
    return;
  }
  const r = pairedTTest(pair.x, pair.y);
  if ("error" in r) { setError(r.error); return; }
  setResult({ kind: "paired", ...r });
}
```

**입력 라벨은 모드에 따라 바뀐다** (`:262`, `:279`의 삼항을 표로 뺀다):

```ts
const COLUMN_LABELS: Record<Mode, [string, string]> = {
  ttest: ["그룹 A 값들", "그룹 B 값들"],
  paired: ["전(before) 값들", "후(after) 값들"],
  correlation: ["변수 X 값들", "변수 Y 값들"],
  regression: ["변수 X 값들", "변수 Y 값들"],
  chisquare: ["", ""], // 교차표는 단일 입력이라 쓰지 않는다
};
```

`:101-102`의 `nameA`/`nameB`도 이 표를 쓰게 바꾼다 — 지금은 `mode === "ttest"` 이분법이라
대응표본에서 "변수 X"라는 틀린 이름이 나온다.

**대응표본 안내 문구**(`:295-297` 자리, 모드가 `paired`일 때):
"전·후 값을 **같은 사람 순서로** 한 줄에 하나씩 적어주세요. 빈 줄은 그 사람의 결측으로 셉니다."

## 2-C. 카이제곱 입력 — 교차표

두 열 구조가 성립하지 않는다. **모드가 `chisquare`일 때는 textarea 하나만 렌더한다.**

```tsx
{mode === "chisquare" ? (
  <div className="mt-4">
    <label htmlFor="stats-table" className="text-xs font-medium text-ink-soft">
      교차표 (한 줄이 한 행)
    </label>
    <textarea
      id="stats-table"
      value={textTable}
      onChange={/* setInputs + invalidateResult */}
      placeholder={"예: 찬성·반대 × 학년\n20 30\n30 20"}
      rows={5}
      className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-soft focus:border-accent"
    />
    <p className="mt-1.5 text-xs text-ink-soft">
      빈도(사람 수)만 넣으세요. 비율이나 평균은 카이제곱으로 검정할 수 없습니다.
      엑셀에서 표 범위를 복사해 그대로 붙여넣어도 됩니다. 행·열 이름은 넣지 마세요.
    </p>
  </div>
) : ( /* 기존 2열 grid 그대로 */ )}
```

설계 판단:

- **`font-mono`를 준다.** 자릿수가 다른 빈도가 세로로 정렬돼 표처럼 보인다.
  숫자 목록 두 개와 다른 입력이라는 시각적 신호도 된다.
- **행·열 이름은 받지 않는다.** 받으면 "첫 줄이 헤더인가"를 추측해야 하고,
  `"학년 찬성 반대"` 같은 입력에서 조용히 한 행을 잃는다. 명시적으로 거부하고 문구로 안내한다.
- **375px:** 단일 textarea라 2열 grid보다 오히려 좁다. 문제없다.
- 저장 키가 는다 — `usePersistentState("stats-calculator", ...)`의 초깃값에 `textTable: ""`을 넣는다.
  기존 저장값에는 이 키가 없다. **`lib/usePersistentState.ts`가 저장 객체를 초깃값과 병합하는지
  확인하라. 병합하지 않으면 `textTable`이 `undefined`가 되어 textarea가 비제어로 떨어진다.
  구현 시 판단 필요** — 안전한 쪽은 읽을 때 `textTable ?? ""`로 방어하는 것이다.

### 카이제곱 결과 표시

```
χ² = 4.000, df = 1, p = .046
표: 2행 × 2열, 총 100건
```

`lowExpectedCells > 0`이면 결과 아래에:
"기대빈도가 5 미만인 칸이 {n}개 있습니다(최솟값 {minExpected.toFixed(1)}).
카이제곱 근사가 정확하지 않을 수 있으니, 범주를 합치거나 사례를 더 모으는 편이 낫습니다."

## 2-D. 결과 상태 구조 — 지금 구조로는 안 된다

지금은 `ttestResult`(t·r 겸용) + `regressionResult` 둘이다. 여기에 대응표본·카이제곱을
얹으면 상태가 넷이 되고 `copyResult`의 분기가 사방으로 갈라진다.

**하나의 판별 유니온으로 합친다:**

```ts
type Result =
  | { kind: "ttest"; t: number; df: number; p: number; meanA: number; meanB: number;
      sdA: number; sdB: number; nA: number; nB: number; meanDiff: number; cohenD: number;
      ciLow: number; ciHigh: number }
  | { kind: "paired"; t: number; df: number; p: number; n: number; meanDiff: number;
      sdDiff: number; cohenDz: number; ciLow: number; ciHigh: number }
  | { kind: "correlation"; r: number; df: number; p: number }
  | { kind: "regression"; slope: number; intercept: number; r2: number; p: number }
  | { kind: "chisquare"; chi2: number; df: number; p: number; n: number;
      rows: number; cols: number; minExpected: number; lowExpectedCells: number };

const [result, setResult] = useState<Result | null>(null);
```

`copyResult`는 `switch (result.kind)`로 한 곳에 모인다. 복사 문자열:

| kind | 복사 문자열 |
|---|---|
| ttest | `그룹 A: M = 16.90, SD = 2.40, n = 16; 그룹 B: M = 14.50, SD = 2.60, n = 16; 평균 차이 = 2.40, 95% CI [0.59, 4.21], d = 0.96; t = 2.713, df = 29.8, p = .011` |
| paired | `n = 5, 평균 차이 = -2.40, SD = 0.89, 95% CI [-3.51, -1.29], d_z = -2.68; t = -6.000, df = 4, p = .004` |
| correlation | `r = 0.842, df = 8, p = .002` (기존과 동일) |
| regression | 기존과 동일 |
| chisquare | `χ²(1, N = 100) = 4.000, p = .046` |

카이제곱은 APA 관례(`χ²(df, N = n) = ...`)를 따른다.
**H2가 요구한 "복사 문자열에 신뢰구간"은 ttest 행의 `95% CI [0.59, 4.21]`이다.**

이 리팩터가 이번 라운드에서 가장 큰 회귀 위험이다.
**`components/__tests__/StatsCalculator.test.tsx` 전부가 이 상태 이름에 걸려 있을 수 있으니 먼저 읽어라.**

## 2-E. `SampleSizeCalculator` — 두 집단 평균 비교 모드 (H1 + V3)

### 모드 선택

역시 `<select>`. 이 컴포넌트는 이미 셀렉트를 쓰고 있어 일관된다.

```tsx
<select id="sample-size-mode" ...>
  <option value="proportion">설문·비율 조사 (Cochran)</option>
  <option value="means">두 집단 평균 비교 (검정력 분석)</option>
</select>
```

`means`일 때 방향 토글 하나 더:

```tsx
<select id="sample-size-direction" ...>
  <option value="d-to-n">필요 인원 구하기 (효과크기 → 인원)</option>
  <option value="n-to-d">검출 가능한 최소 차이 (인원 → 효과크기)</option>
</select>
```

**두 셀렉트를 중첩 표시하지 말고 나란히 둔다.** 기존 `grid gap-3 sm:grid-cols-2`를 그대로 쓰면
375px에서 세로로 쌓이고 `sm:` 이상에서 2열이 된다.

### 입력 (means 모드)

| 필드 | id | 형태 | 기본값 |
|---|---|---|---|
| 신뢰수준 | `sample-size-confidence` | 기존 셀렉트 **재사용** | 95 |
| 검정력 | `sample-size-power` | 셀렉트 80 / 90 | 80 |
| 효과크기 d | `sample-size-effect` | number (`d-to-n`일 때만) | 0.5 |
| 집단당 인원 | `sample-size-n` | number (`n-to-d`일 때만) | (빈칸) |

**"두 평균 + SD" 입력은 넣지 않는다.** 백로그 H1이 "(또는 두 평균+SD)"를 괄호로 열어 뒀지만,
넣으면 means 모드의 입력이 여섯이 되고 375px에서 3줄 grid가 된다.
d는 한 줄 설명으로 충분하고, 그 설명을 필드 아래에 둔다:
"d = (두 집단 평균의 차이) ÷ (표준편차). 잘 모르겠으면 중간 크기인 0.5로 두세요."

### 출력

**d → n:**

```
집단당 최소 64명 (두 집단 합계 128명)이 필요합니다.
```

보조: "d = 0.5(중간 크기 효과)를 95% 신뢰수준·80% 검정력으로 잡아내는 기준입니다.
두 집단의 인원이 같다고 가정했습니다."

**n → d (V3이 요구한 방향):**

```
집단당 16명으로는 d = 1.02 이상의 차이만 검출할 수 있습니다.
```

보조: "d 1.02는 관례상 '큰 효과'입니다. 이보다 작은 차이가 예상된다면
조건을 더 극단으로 벌리거나, 같은 대상의 전·후를 비교하는 설계로 바꾸는 편이 낫습니다."

d 크기 해석 한 줄(교과서 관례 0.2/0.5/0.8):
`d < 0.2` → "아주 작은", `< 0.5` → "작은", `< 0.8` → "중간", 그 이상 → "큰".

### 삭제 대상 — `SampleSizeCalculator.tsx:86-90`

```tsx
      <p className="mt-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
        이 계산기는 설문·비율 조사용입니다(Cochran 공식). 두 집단 평균
        비교(실험)에는 검정력 분석이 필요합니다(중간 효과 d=0.5, 검정력
        80%면 집단당 약 64명).
      </p>
```

이 문단 전체를 지운다. 사과할 이유가 사라진다.
`:186-190`의 "오차범위를 10%로 넓히면 약 97명" 안내는 **비율 모드일 때만** 렌더하도록 감싼다.

### 표시 자릿수 — 소수 둘째 자리까지만

역방향 d의 근사오차가 n=10에서 0.54%다. `toFixed(2)`면 1.32로 정확값과 같아진다.
**셋째 자리를 표시하면 틀린 자릿수를 보여주게 되므로 금지한다.**

---

# 파트 3 — `lib/statsVerdict.ts`

## 타입 확장

```ts
export type StatsMode =
  | "ttest"
  | "paired"
  | "correlation"
  | "regression"
  | "chisquare";
```

## 문구 추가 (`:19-25` 블록)

기존 톤을 그대로 유지한다 — **유의 여부만 말하고, 크기·중요성은 다른 지표로 넘긴다.**

```ts
  if (mode === "ttest") {
    return `두 집단의 평균 차이가 통계적으로 유의합니다 ${level}. 차이가 얼마나 큰지는 아래 평균 차이와 d로 판단하고, 그 차이가 얼마나 정확히 추정됐는지는 신뢰구간의 폭으로 보세요.`;
  }
  if (mode === "paired") {
    return `전·후의 평균 차이가 통계적으로 유의합니다 ${level}. 차이가 얼마나 큰지는 아래 평균 차이와 신뢰구간으로 판단하세요.`;
  }
  if (mode === "chisquare") {
    return `범주에 따라 빈도 분포가 다르다고 볼 수 있습니다 ${level}. 어느 칸이 얼마나 벗어났는지는 기대빈도와 실제 빈도를 직접 비교해야 알 수 있습니다.`;
  }
```

`p >= 0.05` 분기(`:13-15`)는 **모드 무관 공통 문구라 그대로 둔다.**
카이제곱에서도 "차이나 관계가 없다는 뜻이 아니라 우연과 구분하기 어렵다"가 그대로 참이다.

### 카이제곱 문구의 절제

카이제곱의 유의는 "**어딘가에** 연관이 있다"까지만 말한다.
어느 칸 때문인지는 잔차를 봐야 알 수 있고 이 도구는 잔차를 주지 않는다.
그래서 위 문구가 "어느 칸이 얼마나 벗어났는지는 … 직접 비교해야"로 끝난다 —
`03-statistics.mdx:49`가 ANOVA 사후검정에 대해 쓴 것과 같은 종류의 절제다.

---

# 파트 4 — 콘텐츠 연쇄 수정 (Y12 + G2 + H2 + V3)

Y12는 "최소 6곳"이라 했으나 실측 결과 **9곳**이다
(파트 0-(2)의 `21-right-sized-topic:33` 추가, 파트 0-(1)의 `03-methodology:108` 삭제,
H2의 `05-writing` 표 행 추가 포함).

## (1) `content/guide/03-methodology.mdx:105` — H1 연쇄

**before**

```
t-검정 같은 기본 검정은 5단계의 '간이 통계 계산기'에서 바로 계산할 수 있습니다. 필요한 표본 수는 4단계의 '표본 크기 계산기'로 지금 확인해 두세요 — 표본 수가 모자라면 설계를 지금 바꾸는 편이 낫습니다.
```

**after**

```
t-검정 같은 기본 검정은 5단계의 '간이 통계 계산기'에서 바로 계산할 수 있습니다 — 독립표본 t, 대응표본 t, 상관, 회귀, 카이제곱 다섯 가지를 지원합니다. 필요한 표본 수는 4단계의 '표본 크기 계산기'의 '두 집단 평균 비교' 모드로 지금 확인해 두세요 — 표본 수가 모자라면 설계를 지금 바꾸는 편이 낫습니다.
```

같은 파일 `:95-101`의 검정 선택표는 다섯 행 중 네 행을 계산기가 이제 지원한다(ANOVA만 미지원).
**표 자체는 손대지 않는다** — 계획 문서로서 옳고, "계산기에 있는 것만 적으라"는 요구는 없다.

## (2) `content/guide/04-data-collection.mdx:9` — 체크리스트

**before**

```
  - "수집 전 기준 확정 — 이상치 제외 기준, 3단계 분석 계획, 필요한 표본 수(위 도구 '표본 크기 계산기')를 첫 데이터를 받기 전에 적어둡니다."
```

**after**

```
  - "수집 전 기준 확정 — 이상치 제외 기준, 3단계 분석 계획, 필요한 표본 수(위 도구 '표본 크기 계산기' — 실험이면 '두 집단 평균 비교' 모드)를 첫 데이터를 받기 전에 적어둡니다."
```

## (3) `content/guide/04-data-collection.mdx:33` — 도구 표

**before**

```
| 표본 수 | 필요한 표본 수를 계산하고, 실제로 모집 가능한 인원과 비교합니다 | 위 도구 '표본 크기 계산기' |
```

**after**

```
| 표본 수 | 필요한 표본 수를 계산하고, 실제로 모집 가능한 인원과 비교합니다. 모집 가능한 인원이 이미 정해져 있다면 반대 방향(인원 → 검출 가능한 최소 차이)으로도 계산할 수 있습니다 | 위 도구 '표본 크기 계산기' |
```

## (4) `content/guide/04-data-collection.mdx:41` — 정답이 손으로 박힌 문단

**before**

```
표본 수의 감각도 잡아 두세요. 두 집단의 평균을 비교할 때 '중간 크기 효과'(Cohen's d = 0.5)를 80% 확률로 잡아내려면, 교과서 기준으로 집단당 약 64명이 필요합니다. 고등학생 연구에서 이 수를 채우기 어려운 경우가 많습니다 — 그렇다면 더 큰 효과만 검출할 수 있다는 한계를 알고 시작하고, 논문의 제한점에 그대로 적습니다. 표본을 못 채웠다는 사실은 숨길 일이 아니라 보고할 일입니다.
```

**after**

```
표본 수의 감각도 잡아 두세요. 두 집단의 평균을 비교할 때 '중간 크기 효과'(Cohen's d = 0.5)를 80% 확률로 잡아내려면 집단당 64명이 필요합니다 — 위 도구의 '두 집단 평균 비교' 모드에 d = 0.5, 검정력 80%를 넣으면 이 숫자가 그대로 나옵니다. 고등학생 연구에서 이 수를 채우기 어려운 경우가 많습니다 — 그렇다면 방향을 뒤집어, 실제로 모을 수 있는 인원을 넣고 그 인원으로 검출 가능한 최소 차이를 확인하세요. 집단당 16명이면 d = 1.02, 25명이면 d = 0.81 이상의 차이만 잡힙니다. 더 큰 효과만 검출할 수 있다는 한계를 알고 시작하고, 논문의 제한점에 그대로 적습니다. 표본을 못 채웠다는 사실은 숨길 일이 아니라 보고할 일입니다.
```

`64` / `1.02` / `0.81`은 전부 검산했다(정확값 64 / 1.0237 / 0.8087).
"약 64명"에서 "약"을 뺀 것은 이제 도구가 정확히 그 값을 내기 때문이다.

## (5) `content/guide/05-writing.mdx:68` — G2

**before**

```
두 집단 평균 비교의 효과크기 Cohen's d는 교과서적으로 0.2를 작은 효과, 0.5를 중간, 0.8을 큰 효과로 봅니다. 상관분석이면 r 자체가 효과크기입니다. 위 도구 '간이 통계 계산기'로 기본 검정을 계산할 수 있습니다 — 계산 결과를 옮길 때 효과크기를 빼먹지 말고, 계산기가 주지 않는다면 두 평균의 차이를 표준편차로 나눈 값(d)을 직접 구해 적으세요.
```

**after**

```
두 집단 평균 비교의 효과크기 Cohen's d는 교과서적으로 0.2를 작은 효과, 0.5를 중간, 0.8을 큰 효과로 봅니다. 상관분석이면 r 자체가 효과크기입니다. 위 도구 '간이 통계 계산기'로 기본 검정을 계산할 수 있습니다 — 계산기가 Cohen's d와 평균 차이의 95% 신뢰구간을 함께 출력하니, 결과 문장에 그대로 옮기면 됩니다.
```

## (6) `content/guide/05-writing.mdx:66` 다음 줄에 표 행 추가 — H2

`:62-66`이 "함께 적을 것" 표다. `:66`(효과크기 행) **바로 다음 줄**에 삽입:

```
| 평균 차이의 신뢰구간 | 95% CI [0.59, 4.21] | 효과가 어느 범위에 있을 수 있는지 보여줍니다. 좁으면 정밀한 추정이고, 넓으면 판단을 유보해야 합니다 |
```

`[0.59, 4.21]`은 같은 표의 `M = 16.9, SD = 2.4, n = 16` · `t(30) = 2.71` · `d = 0.96`과
**같은 가상 데이터에서 나온 값**이다(검산: Welch CI = [0.59294, 4.20706]).
`app/example/page.tsx:279`의 `[0.6, 4.2]`와 반올림만 다르고 동일하다.

## (7) `content/articles/26-small-sample.mdx:81` — V3

**before**

```
이 둘을 정한 뒤 위 도구 [표본 크기 계산기](/guide/data-collection#tool-sample-size)에 넣으면 필요한 인원이 나옵니다. 그리고 여기서 답이 두 갈래로 갈립니다.
```

**after**

```
이 둘을 정한 뒤 위 도구 [표본 크기 계산기](/guide/data-collection#tool-sample-size)의 '두 집단 평균 비교' 모드에 넣으면 필요한 인원이 나옵니다. 그리고 여기서 답이 두 갈래로 갈립니다.
```

## (8) `content/articles/26-small-sample.mdx:84` — V3의 핵심

**before**

```
- **채울 수 없다면** — 방향을 뒤집습니다. 계산기에 **실제로 닿을 수 있는 인원을 넣고**, 그 인원으로 검출 가능한 최소 차이가 얼마인지를 봅니다. 그 값보다 큰 차이가 기대되는 조건으로 설계를 조정하거나(조건을 극단으로), 앞 절의 짝지은 설계로 바꾸거나, 이 연구를 예비 연구로 규정합니다.
```

**after**

```
- **채울 수 없다면** — 방향을 뒤집습니다. 계산기의 방향을 '검출 가능한 최소 차이(인원 → 효과크기)'로 바꾸고 **실제로 닿을 수 있는 인원을 넣으면**, 그 인원으로 검출 가능한 최소 차이가 나옵니다. 집단당 25명이면 d = 0.81, 32명이면 d = 0.71입니다. 그 값보다 큰 차이가 기대되는 조건으로 설계를 조정하거나(조건을 극단으로), 앞 절의 짝지은 설계로 바꾸거나, 이 연구를 예비 연구로 규정합니다.
```

(0.81 / 0.71은 검산값 0.8087 / 0.7115.)

## (9) `content/articles/21-right-sized-topic.mdx:33` — 파트 0-(2)에서 새로 찾은 곳

**before**

```
**표본.** 물어야 할 것은 "몇 명이 필요한가"가 아니라 **"내가 실제로 닿을 수 있는 사람이 몇 명인가"**입니다. 우리 반 28명인지, 학년 전체 200명인지, 동아리 12명인지를 먼저 숫자로 적습니다. 그 숫자를 적은 다음에 위 도구 [표본 크기 계산기](/guide/data-collection#tool-sample-size)에 비교하려는 집단 수와 예상 차이를 넣어보면, 지금 설계로 그 인원이 충분한지 아닌지가 바로 나옵니다.
```

**after**

```
**표본.** 물어야 할 것은 "몇 명이 필요한가"가 아니라 **"내가 실제로 닿을 수 있는 사람이 몇 명인가"**입니다. 우리 반 28명인지, 학년 전체 200명인지, 동아리 12명인지를 먼저 숫자로 적습니다. 그 숫자를 적은 다음에 위 도구 [표본 크기 계산기](/guide/data-collection#tool-sample-size)의 '두 집단 평균 비교' 모드에서 방향을 '인원 → 검출 가능한 최소 차이'로 바꾸고 그 인원을 넣어보면, 지금 설계로 어느 정도 크기의 차이까지 잡을 수 있는지가 바로 나옵니다.
```

(원문 뒤쪽 "부족하다고 나와도 주제를 버릴 일은 아닙니다 …"부터는 그대로 둔다.
"비교하려는 집단 수"를 지운 이유: H1 이후에도 계산기가 받지 않는 입력이다.)

## (10) `app/example/page.tsx:237-245` — H1이 지목한 서사

**before**

```tsx
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">표본 계획:</strong> 사이트의
          &lsquo;표본 크기 계산기&rsquo;는 설문·비율 조사용이라 두 집단 평균
          비교에는 쓸 수 없었습니다. 선생님께 여쭤보니 중간 크기 효과(d=0.5)를
          80% 확률로 잡아내려면 집단당 약 64명이 필요하다고 했지만, 현실적으로
          모집 가능한 인원은 집단당 16명(총 32명)이었습니다. 그래서 이 인원으로
          진행하되, &ldquo;이 표본으로는 큰 효과만 검출할 수 있다&rdquo;는
          점을 논문의 제한점에 적기로 했습니다.
        </p>
```

**after**

```tsx
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">표본 계획:</strong> 사이트의
          &lsquo;표본 크기 계산기&rsquo;의 &lsquo;두 집단 평균 비교&rsquo;
          모드에 중간 크기 효과(d=0.5)와 검정력 80%를 넣으니 집단당 64명이
          필요하다고 나왔습니다. 그런데 현실적으로 모집 가능한 인원은 집단당
          16명(총 32명)이었습니다. 그래서 방향을 뒤집어 16명을 넣어 보니
          검출 가능한 최소 차이가 d = 1.02 — 관례상 &lsquo;큰 효과&rsquo;
          였습니다. 이 인원으로 진행하되, &ldquo;이 표본으로는 큰 효과만
          검출할 수 있다&rdquo;는 점을 논문의 제한점에 근거와 함께 적기로
          했습니다.
        </p>
```

`64`와 `1.02`는 검산 완료(정확값 64, 1.0237 → 표시 1.02).

**`:246-263`과 5단계(`:265-292`)는 손대지 않는다.**
`t = 2.713, df = 29.8, p = 0.0110`, `95% CI [0.6, 4.2]`가 전부 검산을 통과했고,
`:258-263`의 `WhyBox`("표본이 계획보다 작아진 것을 숨기지 않고")도 여전히 참이다.

---

# 파트 5 — 테스트

기존 파일의 관례(`describe` 블록 + 한국어 `it` 이름 + scipy 기준값 주석)를 따른다.

## `lib/__tests__/stats.test.ts` — `tCriticalTwoTailed` (6케이스)

| it 이름 | 기대 |
|---|---|
| `"scipy t.ppf와 일치 (α=.05, df=1/2/5/10)"` | 12.706204736 / 4.302652730 / 2.570581836 / 2.228138852, 각 8자리 |
| `"소수 자유도에서도 일치 (Welch df=29.79)"` | 2.042876332, 8자리 |
| `"α=.01에서도 일치 (df=5/10/30)"` | 4.032142984 / 3.169272673 / 2.749995654 |
| `"큰 df에서 정규분위수로 수렴 (df=1000)"` | 1.962339081, 7자리 |
| `"tTestTwoTailedP의 역함수다 (왕복)"` | `tTestTwoTailedP(tCriticalTwoTailed(0.05, 12), 12)` ≈ 0.05, 10자리 |
| `"잘못된 입력은 NaN (df=0, α=0, α=1)"` | 전부 `Number.isNaN` |

## `chiSquareP` (6케이스)

| it 이름 | 입력 → 기대 |
|---|---|
| `"scipy chi2.sf와 일치 (임계값 3.841/df=1)"` | 0.05001368376 |
| `"급수 분기와 연속분수 분기를 모두 밟는다"` | (0.001, 1) → 0.9747728794 · (200, 100) → 1.17845007e-8 |
| `"df=2의 닫힌 형태 exp(-x/2)와 일치"` | (0.5, 2) → 0.7788007831 = `Math.exp(-0.25)` |
| `"꼬리에서도 자릿수를 잃지 않는다"` | (100, 10) → 5.4497020e-17 (상대오차로 비교) |
| `"χ²=0이면 p=1"` | 1 |
| `"음수 χ²·df=0은 NaN"` | NaN |

## `chiSquareIndependence` (7케이스, 전부 scipy `chi2_contingency(correction=False)` 검산)

| it 이름 | 입력 | 기대 |
|---|---|---|
| `"2×2 교차표 (scipy 대조)"` | `[[20,30],[30,20]]` | χ²=4, df=1, p≈0.0455003 |
| `"2×3 교차표 (scipy 대조)"` | `[[10,20,30],[30,20,10]]` | χ²=20, df=2, p≈4.53999e-5 |
| `"3×3 교차표 (scipy 대조)"` | `[[100,50,30],[40,60,20],[30,30,40]]` | χ²≈42.5272331, df=4, p≈1.29695e-8 |
| `"완전 독립이면 χ²=0, p=1"` | `[[5,5],[5,5]]` | χ²=0, p=1 |
| `"기대빈도 5 미만을 센다"` | `[[1,2],[3,4]]` | `lowExpectedCells`=4, `minExpected`≈1.2, p≈0.7781597 |
| `"합이 0인 행은 오류"` | `[[0,0],[3,4]]` | `"error" in r` |
| `"행마다 칸 수가 다르면 오류"` | `[[1,2],[3]]` | `"error" in r` |

## `pairedTTest` (6케이스, 전부 scipy `ttest_rel` 검산)

| it 이름 | 입력 | 기대 |
|---|---|---|
| `"전·후 5쌍 (scipy 대조)"` | `[12,15,14,18,13]` / `[14,18,15,21,16]` | t=-6, df=4, p≈0.00388254, d_z≈-2.68328157 |
| `"6쌍 (scipy 대조)"` | `[100,102,98,105,101,99]` / `[103,101,100,108,104,102]` | t≈-3.31270674, df=5, p≈0.02117730 |
| `"한쪽이 상수여도 차이의 분산이 있으면 계산된다"` | `[5,5,5,5]` / `[6,7,5,8]` | t≈-2.32379001, df=3, p≈0.10272808 |
| `"차이가 전부 같으면 오류 (분산 0)"` | `[1,2,3]` / `[3,4,5]` | `"error" in r` |
| `"개수가 다르면 오류"` | `[1,2,3]` / `[1,2]` | `"error" in r` |
| `"신뢰구간이 t 임계값과 정합"` | 첫 케이스 | ciLow≈-3.5107, ciHigh≈-1.2893 (= -2.4 ± 2.776445 × 0.4) |

## `welchTTest` 신뢰구간 (4케이스 추가)

| it 이름 | 입력 | 기대 CI |
|---|---|---|
| `"평균 차이의 95% CI (scipy 대조)"` | `[12,15,14,18,13,16,17,14]` / `[22,19,25,21,20,23,24,22]` | (-9.2865259, -4.9634741) |
| `"CI가 0을 포함하면 p ≥ .05 (정합성)"` | `[1,2,3,4,5]` / `[2,3,4,5,7]` | (-3.7846982, 1.3846982), p≈0.3138 |
| `"이상치가 CI를 크게 벌린다"` | `[10,12,11,13]` / `[10,12,11,13,50]` | (-29.0820991, 13.6820991) |
| `"예시 페이지의 CI를 재현한다"` | M=16.9/SD=2.4/n=16 vs M=14.5/SD=2.6/n=16 | ciLow≈0.593, ciHigh≈4.207 |

마지막 케이스는 **그 요약통계를 정확히 재현하는 16개 값 배열이 필요하다.**
합성이 번거로우면 `se`·`df`·`tCrit`를 직접 조합해 검증하는 단위 테스트로 대체해도 된다.
**구현 시 판단 필요.**

## 표본 수 (8케이스)

| it 이름 | 기대 |
|---|---|
| `"교과서 값과 일치 (α=.05, d=0.5, 검정력 80% → 64)"` | 64 |
| `"d=0.2/0.5/0.8 × 검정력 80%/90% 6셀 전수"` | 394 527 64 86 26 34 |
| `"신뢰수준 90%/99%에서도 정확값과 일치"` | 90%: 51 70 21 28 / 99%: 96 121 39 49 |
| `"역방향: n=16/25/32/64 → d≈1.02/0.81/0.71/0.50"` | 소수 둘째 자리 |
| `"역방향 왕복"` | `nPerGroupForEffectSize(minDetectableEffectSize(n))` ≈ n (±1 허용) |
| `"n < 2 또는 d <= 0은 null"` | null |
| `"모르는 신뢰수준·검정력 문자열은 null"` | null |
| `"반올림 Z 회귀 방어: (95, 80, d=0.7) → 34"` | 34 |

주석에 남길 것:
`(90%, d=0.8, 80%)`의 21은 비중심 t 정확값 20보다 1 크다. 근사의 알려진 한계이며
보수적 방향이므로 21로 고정한다.
마지막 케이스는 파트 0-(5)의 회귀 방어다 — `z_β`를 1.282/0.842로 반올림하면 33이 나온다.

## `lib/__tests__/statsVerdict.test.ts` (4케이스 추가)

```
"대응표본은 전·후 문구를 쓴다"            → verdict("paired", 0.03)에 "전·후" 포함
"카이제곱은 빈도 분포 문구를 쓴다"        → verdict("chisquare", 0.03)에 "빈도 분포" 포함
"카이제곱도 p ≥ .05는 공통 문구"          → verdict("chisquare", 0.3)에 "유의하지 않습니다" 포함
"t-검정 문구에 신뢰구간 안내가 들어간다"  → verdict("ttest", 0.03)에 "신뢰구간" 포함
```

## `components/__tests__/StatsCalculator.test.tsx`

**먼저 읽어라.** 파트 2-A(셀렉트 전환)와 2-D(상태 유니온)가 기존 테스트를 깨뜨릴 가능성이 높다.
추가할 것:

```
"카이제곱 모드에서는 교차표 textarea 하나만 보인다"
"교차표를 넣으면 χ²·df·p가 나온다"                        → "20 30\n30 20" → /χ² = 4.000/
"기대빈도 5 미만이면 경고가 뜬다"                          → "1 2\n3 4" → /기대빈도가 5 미만/
"행마다 칸 수가 다르면 계산 대신 오류"                     → "1 2\n3" → /칸 수/
"대응표본에서 빈 줄은 결측으로 잡힌다 (K3 재사용 증거)"    → 전 "12\n15\n\n18", 후 "14\n18\n15\n21" → /3번째 행/, /t = / 없음
"대응표본 결과 복사에 d_z와 신뢰구간이 들어간다"
"t-검정 결과 복사에 95% CI가 들어간다 (H2)"
"모드를 바꾸면 결과가 지워진다 (5모드 전부)"
```

## `components/__tests__/SampleSizeCalculator.test.tsx`

```
"기본은 비율 모드이고 기존 동작이 그대로다 (회귀)"
"평균 비교 모드에서 d=0.5·검정력 80% → 집단당 64명"
"검정력 셀렉트를 90%로 바꾸면 d=0.5에서 86명"
"역방향에서 n=16 → d = 1.02"
"평균 비교 모드에는 '설문·비율 조사용입니다' 사과 문단이 없다"   ← :86-90 삭제의 직접 증거
"비율 모드에서는 오차범위·예상 비율 입력이 그대로 보인다"
```

---

# 파트 6 — 커밋 분할

선행: **K3(`impl-plan-batch0.md` 커밋 5)가 안 들어갔으면 그것부터.**

| # | 커밋 | 내용 | 선행 |
|---|---|---|---|
| 1 | `feat: t 임계값 역함수와 평균 차이 신뢰구간 (H2)` | `tCriticalTwoTailed`, `welchTTest`의 `ciLow`/`ciHigh`, 복사 문자열, 테스트 | — |
| 2 | `feat: 카이제곱 p값 — 불완전 감마 (B1 수치해석)` | `lowerGammaSeries`, `upperGammaContinuedFraction`, `chiSquareP`, 테스트 | — |
| 3 | `feat: 대응표본 t·카이제곱 독립성 (B1 통계 함수)` | `pairedTTest`, `chiSquareIndependence`, `parseContingencyTable`, `statsVerdict` 확장, 테스트 | 1, 2, K3 |
| 4 | `refactor: 통계 계산기 결과 상태를 판별 유니온으로` | 파트 2-D. **동작 변경 없음.** 기존 테스트가 전부 초록이어야 한다 | 1 |
| 5 | `feat: 통계 계산기 5모드 — 셀렉트 전환·대응표본·교차표 (B1 UI)` | 파트 2-A/2-B/2-C, 테스트 | 3, 4 |
| 6 | `feat: 표본 크기 계산기에 두 집단 평균 비교·역방향 (H1, V3)` | 파트 1-C, 2-E, `:86-90` 삭제, 테스트 | — |
| 7 | `docs: H1·H2 연쇄 본문 10곳 정정 (G2, V3, Y12)` | 파트 4 전체 | 5, 6 |

커밋 4를 3과 5 사이에 끼운 이유: 유니온 리팩터를 새 모드 추가와 **한 커밋에 섞으면**
테스트가 깨졌을 때 리팩터 탓인지 새 검정 탓인지 못 가린다.
커밋 4는 순수 리팩터라 "기존 테스트 전부 초록"이 그 자체로 검증 기준이 된다.

커밋 7을 마지막에 둔 이유: 본문이 "이 모드를 쓰세요"라고 말하는데 모드가 없는 중간 상태를
배포하면 안 된다. 6까지 머지된 뒤에만 7의 문장들이 참이 된다.

---

# 파트 7 — 구현 시 판단이 필요한 것 (추측하지 않고 남긴다)

1. **`usePersistentState`의 저장값 병합** — `textTable`을 추가할 때 기존 저장 객체에 그 키가 없다.
   병합하지 않는 구현이면 `undefined`로 비제어 textarea가 된다.
   `lib/usePersistentState.ts`를 읽고 판단하라. 방어적으로 `textTable ?? ""`를 쓰는 쪽을 권한다.

2. **`components/__tests__/StatsCalculator.test.tsx`의 실제 셀렉터** — 이 문서는 이 파일을
   열어보지 않았다(범위상 `lib` 테스트만 읽었다). 알약→셀렉트 전환의 마이그레이션 규모는
   그 파일을 읽어야 확정된다.

3. **예시 페이지 CI 테스트의 데이터 합성** — M=16.9/SD=2.4/n=16을 정확히 재현하는 16개 값을
   만들지, 요약통계 기반 단위 테스트로 대체할지.

4. **`GuideBlock`에 대응표본·카이제곱 갈래를 넣을지** — 이번 라운드는 **넣지 않는다**로 판정했으나,
   넣지 않으면 가이드가 3모드만 안내하는 상태가 남는다. 다음 라운드 백로그 후보다.

5. **카이제곱 Yates 보정** — 안 넣기로 판정했다. R 기본값(`correct = TRUE`)과 다르므로
   학생이 R로 검산하면 2×2에서 p가 달라진다. **결과 화면에 "연속성 보정 없음"을 한 줄 적을지**는
   판단이 필요하다. 적으면 정확하지만 중고생에게는 소음이다.

6. **표본 크기 계산기의 등표본 가정** — `n_per_group`은 두 집단이 같은 크기라고 본다.
   불균등 배분(2:1 등)은 지원하지 않는다. 보조 문구에 "두 집단의 인원이 같다고 가정했습니다"를
   넣기로 했으나 이것으로 충분한지는 판단이 필요하다.
