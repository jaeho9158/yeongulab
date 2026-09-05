# 구현 설계 — 묶음 0 추가분 12건 (라운드 17·18 치명·보안)

대상: ER1 ER2 ER3 ER4 ER5 ER6 ER7 ER8 · SC1 SC3 SC4 · BR4
형식은 `impl-plan-batch0.md` 파트 4·5를 따른다. 모든 줄 번호는 이 문서를 쓰는 시점(`f2d725b`)의 실측이다.

---

# 파트 0 — 백로그·기존 설계와 어긋나는 점 (먼저 읽을 것)

설계하면서 파일과 대조해 잡은 것 **7건**. 아래 각 항목의 설계는 이 정정을 전제한다.

### (1) "ER1·ER2·ER6·K3·B2·O3가 전부 `SimpleChart.tsx`/`chartGeometry.ts`"는 **K3에 한해 사실이 아니다**

`impl-plan-batch0.md` K3 절(`:275-577`)의 변경 파일은 `lib/stats.ts`와 `components/StatsCalculator.tsx` 둘뿐이다. 함정 5가 명시적으로 **"`SimpleChart`의 `parsePairs`와 통합하지 마라"**고 못 박았다. K3는 `tokenizeNumberList`를 읽기만 하고, `chartGeometry.ts`도 그것을 읽기만 한다. **두 커밋은 파일 교집합이 없다.** 백로그의 "ER2 + K3 한 커밋"은 뿌리가 같다는 관찰이지 파일이 같다는 뜻이 아니며, K3 설계가 통합을 금지했으므로 **ER2는 별도 커밋**이다(파트 4 참고).

### (2) "ER1 + ER6 + B2 한 커밋"은 거부한다

B2(오차막대)는 묶음 6의 **신설 기능**이고 ER1·ER6은 묶음 0의 **수정**이다. B2가 필요로 하는 것(축 범위에 오차 상·하단 포함)은 ER6이 만드는 `yRange()`에 인자 하나를 더하는 일이라, ER6이 먼저 들어가면 B2가 쉬워진다. 반대로 한 커밋에 묶으면 묶음 0 커밋이 신설 기능을 실어 리뷰가 불가능해진다.

### (3) SC1의 공격 메커니즘 서술이 틀렸다 — **결론(수정 방향)은 맞다**

백로그: "`<img src=x onerror=…>`를 넣으면 React 19가 소문자 `onerror`를 미지의 속성으로 DOM에 출력한다."

실측 세 가지:
- `next-mdx-remote` 6.0.0은 기본값 `blockJS=true`로 `removeJavaScriptExpressions` 플러그인을 항상 끼운다(`node_modules/next-mdx-remote/dist/serialize.js:12-33`). `{expr}`과 `prop={expr}`은 **이미 제거된다**. "sanitize 플러그인도 없다"는 절반만 맞다.
- 그 플러그인은 **JSX 요소 자체와 문자열 리터럴 속성은 남긴다**(`remove-javascript-expressions.js:30-45`). `<img onerror="…">`는 통과한다.
- 그러나 React 19.2.8은 클라이언트(`react-dom-client.production.js:13269`)·서버(`react-dom-server.node.production.js:1017`) 모두 **`on`으로 시작하는 prop을 속성으로 쓰지 않는다.** `onerror="…"`는 DOM에 나가지 않는다. `href="javascript:…"`도 `sanitizeURL`(`:1412`)이 막는다.

**실제로 열려 있는 경로**는 `<script>…</script>`(SSR 출력에 그대로 실려 파싱 시 실행), `<iframe src>`·`<object>`·`<embed>`, `<img src="https://추적서버/…">`(방문자 IP 유출), `<meta http-equiv="refresh">`, `<form action>`이다. 육안 검토를 통과하기 쉬운 것은 `onerror`가 아니라 **`<img src="https://…">` 한 줄**이다. 어느 쪽이든 `format: "md"`가 `rehypeRemoveRaw`(`@mdx-js/mdx/lib/core.js:215-217`)로 raw HTML을 통째로 떼어내므로 **수정 방향은 그대로 유효하다.**

### (4) SC1 "현재 6편이 순수 마크다운인지 확인" — **확인했다. 6편 전부 `<`·`{`·`&`가 0회다**

`content/showcase/*.mdx` 여섯 파일에서 `<`, `{`, `&` 문자가 한 번도 안 나온다(frontmatter 포함). `content/articles/*.mdx`·`content/guide/*.mdx`도 `<[A-Za-z]` 패턴이 0회다. `format: "md"` 전환에 **깨질 콘텐츠가 없다.**

### (5) ER4의 "1,200자를 쓰면 URL 본문은 약 11,000자"는 과장이다 — 방향은 맞다

한글 한 음절은 UTF-8 3바이트 → `%XX` 3개 = **9자**. 1,200자가 전부 한글이면 10,800자, 공백·줄바꿈(`%20`·`%0A`, 3자)이 섞이면 조금 줄지만 자릿수는 맞다. 다만 이 계산은 **"어느 길이부터 잘리는가"를 말해주지 않는다** — 그 상한은 아래 ER4 절에서 "구현 시 판단 필요"로 남긴다.

### (6) SC3의 "최소 방어는 세 줄"은 맞지만 그 세 줄로는 백로그가 든 예시 하나를 못 막는다

`typeof parsed === typeof initial` + `parsed !== null` + `Array.isArray` 일치 — 이 셋은 `"[]"`·`"null"`을 막는다. 그런데 `showcase-draft`에 `"{}"`를 넣으면 셋을 다 통과하고 `draft.topic.trim()`이 던진다. 같은 페이지가 같은 방식으로 죽는다. 그래서 SC3 설계는 **한 단계 더** 간다(객체는 initial의 키를 기준으로 형태 대조, 누락 키는 initial로 채움). 근거는 SC3 절.

### (7) ER7 "삭제 확인창도 그 사실을 말하지 않는다" — 맞다. 그리고 `PlanExport` 설명문도 같은 거짓말을 한다

`DataReset.tsx:31-32` 설명은 "체크리스트, 메모, 레퍼런스, 활동 기록 등"이라 도구 입력값을 언급하지 않고, `PlanExport.tsx:82-83`은 "체크한 항목과 적어둔 생각을 파일 하나로 모아"라고만 한다. **"지금까지 기록 내보내기"라는 제목(`:79`)이 문제의 절반이다** — 제목이 전체 기록을 약속한다.

---

# 파트 1 — ER1·ER2·ER6: 간이 차트 (한 파일군, 두 커밋)

## 실측 — 현재 좌표계

`components/SimpleChart.tsx`
```
:21  const W = 640;
:22  const H = 340;
:23  const PAD = { top: 24, right: 24, bottom: 48, left: 56 };
:66  const maxV = hasData ? Math.max(...values, 0) : 0;
:67  const minV = hasData ? Math.min(...values, 0) : 0;
:68  const range = maxV - minV || 1;
:69  const plotW = W - PAD.left - PAD.right;   // 560
:70  const plotH = H - PAD.top - PAD.bottom;   // 268
:72  function yFor(v: number) {
:73    return PAD.top + plotH - ((v - minV) / range) * plotH;
:74  }
:75  function xForIndex(i: number) {
:76    return PAD.left + (plotW / Math.max(labels.length - 1, 1)) * i;
:77  }
```
선·영역·산점도 블록은 `:285-323`. `:315`가 백로그가 지목한 `cx={xForIndex(i)}`이고 `:301`(영역 폴리곤)·`:308`(폴리라인)·`:318`(x 라벨)도 전부 `xForIndex(i)`다. 막대(`:224-253`)는 `barSlot * i`로 자기 x를 계산하고 y는 `yFor`/`minV`/`range`를 공유한다. 가로막대(`:255-283`)는 `hMax`를 따로 계산해 y 범위와 무관하다.

`lib/chartGeometry.ts:12-39` `parsePairs`, 값 토큰은 `:18-19`에서 `tokenizeNumberList`로. `lib/stats.ts:280`이 `if (t) tokens.push(t);` — 빈 토큰을 버리는 지점(백로그 줄 번호 정확).

**좌표 검산 기준값** (아래 테스트가 쓴다): `plotW=560`, `plotH=268`, x 범위 `56..616`, y 범위 `24..292`.

---

## ER2. 값 칸의 빈 셀 보존

### 위치
`lib/chartGeometry.ts:12-19`
```ts
export function parsePairs(labelsText: string, valuesText: string) {
  const labelTokens = labelsText.split(/[\n,]+/).map((s) => s.trim());
  // 값 쪽은 숫자이므로 stats의 토크나이저를 그대로 쓴다 — …
  const { tokens: valueTokens, thousandsMergedCount } =
    tokenizeNumberList(valuesText);
```

두 가지가 겹쳐 있다. (a) 값 쪽 `tokenizeNumberList`가 `,` 사이의 빈 조각을 버린다(`stats.ts:280`). (b) **라벨 쪽도 `/[\n,]+/`로 연속 구분자를 병합한다** — `"A, , C"`가 `[A, C]`가 되어 라벨 쪽 빈 셀도 사라진다. 백로그는 (a)만 짚었다. 둘 다 고쳐야 "같은 인덱스 = 같은 항목"이 성립한다.

### 설계 원칙
- `tokenizeNumberList`·`stats.ts`는 **한 글자도 안 바꾼다**(K3와 같은 원칙). 천 단위 판정만 그 함수에서 빌려온다.
- 라벨과 값에 **같은 셀 문법**을 적용한다: `\n` 또는 `,` **한 개**가 셀 경계다. 연속 두 개면 그 사이는 빈 셀이다. 값 쪽은 셀 안의 공백도 경계다(`"12 19 7 15"` 기존 사용법 유지). 라벨 쪽은 공백을 경계로 보지 않는다(`"New York"`).
- 천 단위 모드(모든 쉼표 덩어리가 `1,234` 꼴)일 때는 쉼표가 경계가 아니다 — 이 판정은 `tokenizeNumberList(valuesText).thousandsMergedCount > 0`으로 빌린다(그 값이 0보다 크다 ⇔ 내부 `useThousands`가 참이고 쉼표 덩어리가 있었다).

### 변경 후 — `lib/chartGeometry.ts:12-39` 교체

```ts
/** 값 칸을 셀 단위로 자른다. 빈 셀을 보존하는 것이 이 함수의 존재 이유다. */
function splitValueCells(valuesText: string): {
  cells: string[];
  thousandsMergedCount: number;
} {
  const normalized = valuesText.replace(/[，、]/g, ",").replace(/\r\n?/g, "\n");
  // 천 단위 여부는 stats의 토크나이저 판정을 빌린다(같은 입력에 같은 답을 내야 한다).
  // thousandsMergedCount > 0 은 "모든 쉼표 덩어리가 1,234 꼴이었다"와 동치다.
  const probe = tokenizeNumberList(normalized);
  const useThousands = probe.thousandsMergedCount > 0;
  const cells: string[] = [];
  for (const row of normalized.split("\n")) {
    // 천 단위 모드면 쉼표는 경계가 아니다. 아니면 쉼표 하나가 경계 하나다.
    const pieces = useThousands ? [row] : row.split(",");
    for (const piece of pieces) {
      const trimmed = piece.trim();
      if (trimmed === "") {
        cells.push("");
        continue;
      }
      // 셀 안의 공백은 여전히 값 경계다("12 19 7 15"). 천 단위 모드면 쉼표를 뗀다.
      for (const t of trimmed.split(/\s+/)) {
        cells.push(useThousands ? t.replace(/,/g, "") : t);
      }
    }
  }
  return { cells, thousandsMergedCount: probe.thousandsMergedCount };
}

/**
 * 항목명과 값을 인덱스를 맞춰 쌍으로 파싱한다.
 *
 * 왜 셀 단위인가(ER2) — 값 칸에 `12, , 7, 15`처럼 빈 칸이 있으면 종전
 * 토크나이저는 빈 토큰을 버려 `[12, 7, 15]`가 되고, 그 뒤 항목명이 전부
 * 한 칸씩 당겨진 채 그려졌다. 라벨 쪽도 `/[\n,]+/`로 연속 구분자를
 * 병합해 같은 사고를 냈다. 이제 양쪽 다 구분자 하나 = 셀 하나다.
 * 못 읽은 쌍은 버리되 개수를 함께 돌려준다 — 뒤 항목은 밀리지 않는다.
 */
export function parsePairs(labelsText: string, valuesText: string) {
  const labelTokens = labelsText
    .replace(/[，、]/g, ",")
    .replace(/\r\n?/g, "\n")
    .split(/[\n,]/)
    .map((s) => s.trim());
  const { cells: valueTokens, thousandsMergedCount } = splitValueCells(valuesText);
  const n = Math.max(labelTokens.length, valueTokens.length);
  const labels: string[] = [];
  const values: number[] = [];
  let droppedCount = 0;
  for (let i = 0; i < n; i++) {
    const label = labelTokens[i] ?? "";
    const valueToken = valueTokens[i] ?? "";
    // 둘 다 비어 있으면 꼬리 구분자·빈 줄이므로 조용히 건너뛴다
    if (!label && !valueToken) continue;
    // Number("")===0 이라서 빈 토큰이 유령 0이 되는 것을 막기 위해 빈 값은 NaN 처리
    const v = valueToken === "" ? NaN : Number(valueToken);
    if (label && Number.isFinite(v)) {
      labels.push(label);
      values.push(v);
    } else {
      droppedCount++;
    }
  }
  return { labels, values, droppedCount, thousandsMergedCount };
}
```
`:24-38`의 루프 본문은 그대로다(위에 다시 적은 것은 붙여넣기 편의). 반환 형태 불변 → `SimpleChart.tsx:52`·`:192-202` 호출부 변경 없음.

### 손으로 돌린 검산 (기존 테스트 5건 + 새 케이스)

| 입력 | 셀 | 결과 |
| --- | --- | --- |
| `"A, B, C"` / `"1, 2, 3"` | `[1,2,3]` | 기존 정상 케이스 ✓ |
| `"A\nB\nC"` / `"1,200\n1,500\n1,350"` | probe: 천 단위 3 → 행별 `[1200,1500,1350]` | 기존 회귀 케이스 ✓ |
| `"A, B, C"` / `"1, x, 3"` | `["1","x","3"]` | `[A,C]`, dropped 1 ✓ |
| `"A, B"` / `"1, "` | `["1",""]` | `[1]`, dropped 1 ✓ |
| `"A, B,"` / `"1, 2,"` | 라벨 `[A,B,""]`, 값 `["1","2",""]` → i=2 둘 다 빈 칸 → skip | dropped 0 ✓ |
| `"A, B, C"` / `"1"` | dropped 2 ✓ |
| **`"A, B, C, D"` / `"12, , 7, 15"`** | `["12","","7","15"]` | `[A,C,D]`=`[12,7,15]`, dropped 1 — **B가 빈 칸, C=7, D=15** |
| `"A, B, C, D"` / `"12\n\n7\n15"` | 같음 | 엑셀 열 붙여넣기 형태 |
| `"A, , C"` / `"1, 2, 3"` | 라벨 빈 셀 | `[A,C]`=`[1,3]`, dropped 1 |
| `"1,200 1,500 1,350 1,100"` (SimpleChart.test:47) | 천 단위 → 한 행, 공백 분리 4셀 | 막대 4개 ✓ |
| `"1,200, 12"` | probe: `"1,200,"`이 `THOUSANDS_GROUPED` 불일치 → 구분자 모드 → `["1","200","12"]` | 종전과 같은 해석(현재도 `[1,200,12]`) |

### 함정
1. **동작 변경이 하나 있다**: `"A,,B"`가 종전엔 라벨 2개, 이제는 라벨 3개(가운데 빈 셀 → 값과 짝지어 드롭)다. 값이 `"1,2"`면 `n=3`, i=1에서 라벨 빈 칸·값 `"2"` → dropped, i=2에서 라벨 `B`·값 없음 → dropped. **B가 사라진다.** 이것이 옳다 — 사용자가 빈 항목을 만들었고 값이 하나 모자란다. 안내문 "값을 읽지 못한 항목 2개는 제외했습니다"가 뜬다. 종전엔 B=2로 **조용히 틀리게** 그렸다.
2. `probe`가 `tokenizeNumberList`를 한 번 더 돌린다 — 입력이 textarea 한 칸이라 비용은 무시할 수준. `thousandsMergedCount`는 probe 값을 그대로 쓰므로 안내문 개수가 종전과 같다.
3. 전각 쉼표 정규화(`[，、]`)를 라벨 쪽에도 넣었다. 종전엔 값 쪽만 정규화돼 `"가，나"`가 라벨 하나로 남았다. 정렬 문제이므로 같이 고치는 게 맞다.

### 테스트 — `lib/__tests__/chartGeometry.test.ts` `parsePairs` describe에 추가

| `it()` | 검증 |
| --- | --- |
| `"값 칸의 빈 셀이 뒤 항목을 당기지 않는다 (ER2 회귀)"` | `parsePairs("A, B, C, D", "12, , 7, 15")` → `labels=["A","C","D"]`, `values=[12,7,15]`, `droppedCount=1` |
| `"빈 줄로 온 빈 셀도 같은 규칙 (엑셀 열 붙여넣기)"` | `"A\nB\nC\nD"` / `"12\n\n7\n15"` → 같은 결과 |
| `"라벨 칸의 빈 셀도 값과 짝지어 버린다"` | `"A, , C"` / `"1, 2, 3"` → `["A","C"]`, `[1,3]`, dropped 1 |
| `"천 단위 모드에서도 빈 줄은 빈 셀이다"` | `"A\nB\nC"` / `"1,200\n\n1,350"` → `["A","C"]`, `[1200,1350]`, `thousandsMergedCount=2` |
| `"셀 안 공백은 여전히 값 경계다 (기존 사용법 유지)"` | `"A, B, C, D"` / `"12 19 7 15"` → 4쌍 |

기존 5건은 그대로 통과해야 한다(위 검산표).

---

## ER6. 0 강제는 막대·영역에만

### 위치
`components/SimpleChart.tsx:66-68` (위 실측 인용). 유형 구분 없이 `Math.max(...values, 0)`/`Math.min(...values, 0)`.

### 판단 — 어느 유형이 0을 갖나
V1(`content/guide/05-writing.mdx:76`)의 원칙과 같은 근거: **길이·면적으로 값을 부호화하는 마크**만 0 기준선이 필요하다.
- `bar`·`hbar`: 0 유지. (`hbar`는 `:257`의 `hMax`가 따로 있어 이 변경과 무관하지만 함수 시그니처상 포함)
- `area`: 폴리곤이 `yFor(0)`(`:301`)을 밑변으로 쓴다. 면적 부호화 → **0 유지.**
- `line`·`scatter`: 위치 부호화 → 값 범위만.

### 변경 후 — `lib/chartGeometry.ts` 끝에 추가

```ts
export type XyChartType = "bar" | "hbar" | "line" | "area" | "scatter";

/** 0 기준선이 필요한 유형 — 길이(막대)·면적(영역)으로 값을 부호화한다. */
const ZERO_BASED: readonly XyChartType[] = ["bar", "hbar", "area"];

/**
 * y축 범위. 선·산점도는 위치로 값을 부호화하므로 0을 강제하면 1000·1001·1002가
 * 한 줄로 눌린다(ER6). 막대·영역은 0이 없으면 길이가 거짓말을 한다(V1).
 * 모든 값이 같으면 범위가 0이라 그릴 수 없으므로 한 칸을 벌린다.
 */
export function yRange(values: number[], type: XyChartType): { lo: number; hi: number } {
  if (values.length === 0) return { lo: 0, hi: 1 };
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (ZERO_BASED.includes(type)) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (hi === lo) {
    // 0 기준 유형은 값이 전부 0일 때만 여기 온다 — 위로만 벌려 0선을 바닥에 둔다
    if (ZERO_BASED.includes(type)) hi = lo + 1;
    else {
      lo -= 1;
      hi += 1;
    }
  }
  return { lo, hi };
}
```

`components/SimpleChart.tsx:66-68` 교체:
```ts
  const { lo: minV, hi: maxV } = yRange(values, isXy ? type : "bar");
  const range = maxV - minV; // yRange가 0을 만들지 않는다
```
`isXy`는 ER1에서 정의한다(아래). `pie`/`donut`에서는 `minV`·`range`가 쓰이지 않으므로 `"bar"`로 흘려보내도 무해하다 — `hasData`가 거짓일 때도 `yRange([], …)`가 `{0,1}`을 내므로 `:66-67`의 `hasData ?` 분기는 삭제한다.

import(`:3`): `import { arcPath, layoutXY, parsePairs, yRange, type XyChartType } from "@/lib/chartGeometry";`

### 함정
1. **막대 전부 0**일 때 종전은 `range || 1`로 `0..0→range 1`이라 막대 높이 1px가 바닥에 붙었다. 이제 `hi=1`이라 같은 결과. 동작 불변.
2. **선 그래프의 눈금**(`:287-298`)이 `minV + range * t`를 쓰므로 자동으로 값 범위를 따라간다. 축 시작·끝이 눈금에 찍힌다 — V1 본문이 요구하는 "축의 시작·끝 값을 반드시 눈금에 적습니다"를 도구가 이미 만족하게 된다. **눈금 표기 코드는 손대지 않는다.**
3. 선 그래프에 음수·양수가 섞여도 0선을 따로 긋지 않는다. 종전에도 안 그었다. 범위 밖.

### V1 — 같은 커밋의 본문 몫: `content/guide/05-writing.mdx:76`

현재:
```
1. **y축은 0에서 시작합니다.** 막대그래프의 y축을 14에서 시작하면 16.9와 14.5의 차이가 몇 배로 부풀려 보입니다. 축을 자를 수밖에 없다면(값이 모두 1000 근처 등) 절단 표시를 넣고 캡션에 적습니다.
```
변경:
```
1. **막대그래프의 y축은 0에서 시작합니다.** 막대는 길이로 값을 나타내므로 y축을 14에서 시작하면 16.9와 14.5의 차이가 몇 배로 부풀려 보입니다. 축을 자를 수밖에 없다면 절단 표시를 넣고 캡션에 적습니다. 선그래프·산점도는 점의 위치로 값을 나타내므로 0에서 시작하지 않아도 되지만, 축의 시작·끝 값을 반드시 눈금에 적습니다.
```
`03-statistics.mdx:117`은 이미 "막대그래프에서"로 한정돼 있어 손대지 않는다. `14-figure-first.mdx:32, :86`은 "축이 0에서 시작하는지 확인"이라는 **읽기** 지침이라 그대로 둔다(그림을 읽을 때 확인하라는 말은 여전히 옳다).

---

## ER1. 산점도·선 그래프의 x값

### 위치
`components/SimpleChart.tsx:75-77` `xForIndex`, 소비처 `:301`, `:308`, `:315`, `:318`.

### 판단 — "라벨이 전부 수치일 때만 값 기반"인가, "산점도는 항상 수치 요구"인가

**유형별로 다르게 답한다.**

| 유형 | 규칙 | 근거 |
| --- | --- | --- |
| `scatter` | **x는 반드시 수치.** 아니면 그리지 않고 안내 | 산점도는 정의상 두 수치 변수의 쌍이다. 범주형 x로 점을 찍은 것은 산점도가 아니라 점 도표(strip plot)이고, 이 사이트가 5단계에서 가르치는 것은 상관·회귀다(`14-figure-first.mdx:52` "두 변수가 함께 움직이는지"). 범주형을 허용하면 "산점도를 그렸다"는 학생이 상관 그림이 아닌 것을 논문에 넣는다 |
| `line`·`area` | 라벨이 **전부** 수치면 값 기반, 아니면 종전대로 등간격 | 선 그래프는 x가 범주여도 정당하다(조건 A/B/C, 1월/2월). 그러나 `1, 2, 7`처럼 수치가 들어오면 그 간격이 곧 정보다(백로그의 "측정일이 1·2·7일차인 시계열"). 혼합(`1, 2, 삼`)은 범주로 본다 — 한 칸만 수치가 아니어도 "수치 축"이라는 주장이 성립하지 않는다 |
| `bar`·`hbar` | 항상 범주 | 막대는 범주별 크기 비교다. `:224-283`은 손대지 않는다 |

선 그래프에서 x가 수치일 때는 **x 오름차순으로 정렬해 잇는다.** 입력 순서대로 이으면 `7, 1, 2`가 지그재그가 된다. 산점도는 순서가 무의미하므로 정렬해도 무해하다(같은 코드 경로).

### 변경 후 — `lib/chartGeometry.ts` 끝에 추가 (yRange 뒤)

```ts
export type XAxis =
  | { mode: "category" }
  | { mode: "numeric"; xs: number[]; lo: number; hi: number }
  /** 산점도인데 x가 숫자가 아니다 — 그리지 않는다 */
  | { mode: "invalid" };

/**
 * x축 해석. 산점도는 x가 수치여야 한다(상관 그림이므로). 선·영역은 라벨이
 * 전부 수치로 읽힐 때만 값 기반 간격을 쓰고, 하나라도 아니면 범주 축이다.
 * 막대는 항상 범주다.
 */
export function resolveXAxis(labels: string[], type: XyChartType): XAxis {
  if (type === "bar" || type === "hbar") return { mode: "category" };
  const xs = labels.map((l) => (l.trim() === "" ? NaN : Number(l)));
  const numeric = xs.length > 0 && xs.every(Number.isFinite);
  if (!numeric) return type === "scatter" ? { mode: "invalid" } : { mode: "category" };
  let lo = Math.min(...xs);
  let hi = Math.max(...xs);
  if (hi === lo) {
    lo -= 1;
    hi += 1;
  }
  return { mode: "numeric", xs, lo, hi };
}

export type Frame = { left: number; top: number; plotW: number; plotH: number };

export type XyPoint = { cx: number; cy: number; label: string; value: number };

/**
 * 선·영역·산점도의 점 좌표. SimpleChart의 SVG 렌더에서 분리해 좌표값 자체를
 * 테스트한다(ER1·ER6의 회귀 방지선은 "점이 몇 개"가 아니라 "어디에"다).
 * 수치 x축이면 x 오름차순으로 정렬해 돌려준다 — 선을 입력 순서로 이으면
 * `7, 1, 2`가 지그재그가 된다.
 */
export function layoutXY(
  labels: string[],
  values: number[],
  type: XyChartType,
  frame: Frame,
): { xAxis: XAxis; points: XyPoint[]; y: { lo: number; hi: number } } {
  const xAxis = resolveXAxis(labels, type);
  const y = yRange(values, type);
  const yFor = (v: number) =>
    frame.top + frame.plotH - ((v - y.lo) / (y.hi - y.lo)) * frame.plotH;
  if (xAxis.mode === "invalid") return { xAxis, points: [], y };
  if (xAxis.mode === "category") {
    const step = frame.plotW / Math.max(labels.length - 1, 1);
    return {
      xAxis,
      y,
      points: labels.map((label, i) => ({
        cx: frame.left + step * i,
        cy: yFor(values[i]),
        label,
        value: values[i],
      })),
    };
  }
  const order = xAxis.xs.map((_, i) => i).sort((a, b) => xAxis.xs[a] - xAxis.xs[b]);
  return {
    xAxis,
    y,
    points: order.map((i) => ({
      cx: frame.left + ((xAxis.xs[i] - xAxis.lo) / (xAxis.hi - xAxis.lo)) * frame.plotW,
      cy: yFor(values[i]),
      label: labels[i],
      value: values[i],
    })),
  };
}
```

### 변경 후 — `components/SimpleChart.tsx`

`:18` 뒤에 추가:
```ts
const isXyType = (t: ChartType): t is XyChartType => XY_TYPES.includes(t);
```
`:50` 뒤(`parsed` 계산 전후 어디든, `labels`·`values` 확정 뒤인 `:63` 다음)에:
```ts
  const isXy = isXyType(type);
  const frame = { left: PAD.left, top: PAD.top, plotW, plotH };
  // plotW·plotH(:69-70)는 이 줄보다 위로 올린다
  const xy =
    isXy && type !== "bar" && type !== "hbar"
      ? layoutXY(labels, values, type, frame)
      : null;
  const scatterNeedsNumericX = xy?.xAxis.mode === "invalid";
  const hasData = labels.length >= 2 && !scatterNeedsNumericX;
```
`:64`의 기존 `hasData` 선언은 위 것으로 대체. `:66-68`은 ER6대로. `:72-77`의 `yFor`는 유지(막대가 쓴다), **`xForIndex`는 삭제**(소비처 4곳이 전부 아래에서 사라진다).

`:285-323` 블록을 교체:
```tsx
              {xy && (type === "line" || type === "area" || type === "scatter") && (() => {
                const pts = xy.points;
                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                      /* :287-298 그대로 */
                    })}
                    {type === "area" && (
                      <polygon
                        points={`${pts[0].cx},${yFor(0)} ${pts.map((p) => `${p.cx},${p.cy}`).join(" ")} ${pts[pts.length - 1].cx},${yFor(0)}`}
                        fill={COLORS[0]}
                        opacity={0.25}
                      />
                    )}
                    {(type === "line" || type === "area") && (
                      <polyline
                        points={pts.map((p) => `${p.cx},${p.cy}`).join(" ")}
                        fill="none"
                        stroke={COLORS[0]}
                        strokeWidth={2}
                      />
                    )}
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.cx} cy={p.cy} r={type === "scatter" ? 5 : 3.5} fill={COLORS[0]} />
                    ))}
                    {pts.map((p, i) => (
                      <text key={p.label + i} x={p.cx} y={H - PAD.bottom + 20} textAnchor="middle" fontSize="11" fill="#17181a">
                        {p.label}
                      </text>
                    ))}
                  </>
                );
              })()}
```
색 속성(`stroke="#e6e7e9"` 등 4곳)은 **그대로 둔다** — O3가 치환한다(파트 4의 순서 참고).

`:391-395` 빈 상태 문구 교체:
```tsx
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          {scatterNeedsNumericX
            ? "산점도는 항목 이름 칸에도 숫자(x값)를 넣어야 합니다. 예: 항목 1, 2, 3 / 값 4, 5, 6"
            : "항목 2개 이상, 값도 같은 개수로 입력해주세요."}
        </p>
      )}
```
`:133`의 라벨 문구도 산점도일 때 바꾼다:
```tsx
{SHARE_TYPES.includes(type) ? "항목 이름" : type === "scatter" ? "x값 (쉼표로 구분)" : "항목 이름 (쉼표로 구분)"}
```

### 함정
1. **기본값이 산점도와 충돌한다.** 초기 상태 `labelsText: "A, B, C, D"`(`:45`)에서 "산점도"를 누르면 차트가 사라지고 안내문이 뜬다. 종전엔 (틀린) 그림이 나왔다. 이건 의도한 결과다 — 안내문이 예시를 준다. 산점도 전용 기본값을 넣는 것은 새 기능이므로 하지 않는다.
2. **x 라벨 겹침.** 수치 x에서 라벨을 각 점 위치에 그대로 찍으므로 `1, 1.1, 1.2, …`처럼 촘촘하면 겹친다. 종전 등간격에서는 개수가 많아야 겹쳤다. 축 눈금을 y처럼 5분할로 바꾸는 것이 옳지만 **새 기능**이라 범위 밖. 주석으로 남긴다.
3. **영역 그래프의 폴리곤 밑변**이 정렬된 첫·끝 점의 cx를 쓴다. 정렬 전 `values.length - 1` 인덱스를 쓰던 `:301`과 달리 pts가 정렬돼 있으므로 `pts[0]`·`pts[last]`가 맞다. 종전 코드를 반쯤 남기면 밑변이 어긋난다.
4. `Number("0x10")===16`, `Number("1e3")===1000`이 수치로 통과한다. 라벨로 그런 걸 쓸 학생은 없다. 무시.
5. **`XY_TYPES.includes(type)`(`:159`, `:325`, `:330`)는 그대로 둔다.** 축 제목 입력·렌더 조건이라 변경 무관.
6. 파트 0-(2)대로 B2는 나중이지만, B2가 들어올 자리는 `yRange(values, type)`의 인자에 오차 상·하단 배열을 더하는 것 하나다. `layoutXY`는 손댈 필요가 없다.

### 테스트 — 좌표값 단언

**`lib/__tests__/chartGeometry.test.ts`** 신규 describe (`FRAME = { left: 56, top: 24, plotW: 560, plotH: 268 }` — `SimpleChart` 상수와 같아야 한다. 상수 불일치를 잡는 것은 아래 컴포넌트 테스트의 몫):

| `it()` | 검증 |
| --- | --- |
| `"yRange: 선·산점도는 0을 넣지 않는다 (ER6)"` | `yRange([1000,1001,1002],"line")` → `{lo:1000,hi:1002}`; `"scatter"` 같음 |
| `"yRange: 막대·영역은 0을 포함한다 (V1)"` | `yRange([12,19,7,15],"bar")` → `{0,19}`; `yRange([-3,5],"area")` → `{-3,5}`; `yRange([3,5],"area")` → `{0,5}` |
| `"yRange: 모든 값이 같으면 한 칸을 벌린다 (경계)"` | `[5,5,5]`,`"line"` → `{4,6}`; `[0,0]`,`"bar"` → `{0,1}` |
| `"resolveXAxis: 산점도에 수치 아닌 라벨이면 invalid"` | `(["A","B"],"scatter").mode === "invalid"`; `(["1","B"],"scatter")`도 invalid |
| `"resolveXAxis: 선 그래프는 수치 아닌 라벨을 범주로 본다"` | `(["1","B"],"line").mode === "category"` |
| `"resolveXAxis: 막대는 라벨이 숫자여도 범주"` | `(["1","2"],"bar").mode === "category"` |
| **`"layoutXY: 산점도 x는 값 간격을 따른다 — 1,2,10,11이 등간격이 아니다 (ER1 회귀)"`** | `layoutXY(["1","2","10","11"],[3,4,20,21],"scatter",FRAME).points.map(p=>p.cx)` → `[56, 112, 560, 616]` (toBeCloseTo 각 2자리). **종전 `xForIndex`는 `[56, 242.67, 429.33, 616]`을 냈다** — 두 번째 값이 다르다는 단언이 곧 회귀 방지선 |
| **`"layoutXY: 산점도 y는 0을 넣지 않는다 (ER6 좌표)"`** | 같은 입력의 `cy` → `[292, 277.11, 38.89, 24]` (toBeCloseTo 2자리). 종전(0 강제, 0..21)은 `[253.71, 240.95, 36.76, 24]` |
| **`"layoutXY: 선 그래프 1000·1001·1002가 세 높이로 갈라진다 (ER6 회귀)"`** | `layoutXY(["1","2","3"],[1000,1001,1002],"line",FRAME).points.map(p=>p.cy)` → `[292, 158, 24]`. 종전은 `[24.53, 24.27, 24]` |
| `"layoutXY: 선 그래프 수치 x는 정렬해 잇는다"` | `(["7","1","2"],[30,10,20],"line")` → `points.map(p=>p.label)` = `["1","2","7"]`, `cx` = `[56, 149.33, 616]` |
| `"layoutXY: 범주 x는 등간격 (기존 동작 유지)"` | `(["가","나","다"],[1,2,3],"line")` → `cx` = `[56, 336, 616]` |
| `"layoutXY: 모든 y가 같으면 가운데 한 줄"` | `[5,5,5]`,`"line"` → `cy` 전부 `158` |
| `"layoutXY: invalid면 points가 비어 있다"` | `(["A","B"],[1,2],"scatter").points` → `[]` |

**`components/__tests__/SimpleChart.test.tsx`** 추가 (실제 SVG에서 좌표를 읽어 `layoutXY`와 컴포넌트 상수가 일치함을 잠근다):

| `it()` | 검증 |
| --- | --- |
| **`"산점도 x가 값 간격을 따른다 — 렌더된 circle의 cx (ER1)"`** | 항목 `1, 2, 10, 11` / 값 `3, 4, 20, 21` 입력 후 "산점도" 클릭 → `svg circle`의 `cx` 속성 → `[56, 112, 560, 616]`(parseFloat, toBeCloseTo 1자리) |
| **`"선 그래프 1000·1001·1002의 cy가 292·158·24 (ER6)"`** | 값 `1000, 1001, 1002` + "선" 클릭 → `circle` `cy` |
| `"막대는 여전히 0에서 시작한다 (ER6가 막대를 안 바꿈)"` | 기본값에서 값 7인 막대 `height` → `(7/19)*268 = 98.74` (toBeCloseTo 1자리). `rect` 선별은 기존 방식(`width !== "640"`) — TQ5가 나중에 `data-role`로 바꾼다 |
| `"산점도에 숫자 아닌 항목이면 그리지 않고 안내한다"` | 기본값(A~D)에서 "산점도" 클릭 → `svg` 없음, `/숫자\(x값\)를 넣어야/` 있음 |
| `"선 그래프는 숫자 아닌 항목도 등간격으로 그린다 (범주 유지)"` | 기본값에서 "선" 클릭 → circle 4개, `cx` = `[56, 242.67, 429.33, 616]` |

`user.type`으로 `"1, 2, 10, 11"`을 치면 느리다(15초 타임아웃 안이지만 병렬 부하 시 위험). 기존 테스트 `:41-47`처럼 `user.click(values); await user.paste("…")`를 쓴다.

---

# 파트 2 — 나머지 ER (독립 5건)

## ER3. 검색 실패 시 이전 결과 잔존

### 위치
`components/PriorResearchSearch.tsx`
```
:62      setStatus("loading");
:70-74   if (!res.ok) { setErrorKind(...); setStatus("error"); return; }
:83-89   catch → setStatus("error")
:187     {results.length > 0 && (
```
`results`(`:41`)·`source`(`:42`)는 성공 경로(`:76-81`)에서만 갱신되고 어디서도 비워지지 않는다. `:178`의 출처 배지는 `status === "done"`에 게이팅돼 있지만 `:187`의 목록은 아니다 — **배지는 사라지고 목록만 남는 어중간한 화면**이 지금의 실패 상태다.

### 변경 후
`:62` 교체 — 검색을 시작하는 순간 이전 결과를 지운다:
```ts
    setStatus("loading");
    // 이전 검색의 결과를 새 검색어의 결과로 읽는 사고를 막는다 — 실패하면
    // 오류 문구만 남아야 하고, 성공하면 아래에서 다시 채워진다(ER3).
    setResults([]);
    setSource(null);
```
`:187` 교체:
```tsx
      {status === "done" && results.length > 0 && (
```

### 함정
1. **로딩 중에 목록이 비어 화면이 줄어든다.** 종전엔 검색 중에도 옛 목록이 보였다. 이건 옳다 — "검색 중…" 버튼과 aria-live "검색 중입니다."(`:165`)가 상태를 말한다. 옛 목록을 로딩 중에 남기는 대안은 "실패 시 지운다"를 catch·`!res.ok` 두 곳에 넣어야 하고, 한 곳을 빠뜨리면 원래 결함이 돌아온다. 시작점 한 곳에서 지우는 게 구조적으로 안전하다.
2. `savedIds`(`:43`)는 지우지 않는다. 같은 논문이 다시 나오면 "저장됨"이 유지되는 게 맞다.
3. **K2(batch0 커밋 4)가 같은 파일 `:45-55`(`save`)를 바꾼다.** 이 커밋은 `:62`와 `:187`만 만지므로 hunks가 겹치지 않는다. 순서는 무관하나 K2 뒤에 리베이스하면 충돌 0.

### 테스트 — `components/__tests__/PriorResearchSearch.test.tsx` 추가
백로그(`TQ` 절 "잘 쓰인 테스트")가 지목한 `StatsCalculator.test.tsx:60-71`의 형태를 복제한다.

| `it()` | 검증 |
| --- | --- |
| **`"검색이 실패하면 직전 검색의 결과가 화면에 남지 않는다 (ER3 회귀)"`** | 1차 `fetch` → `{ok:true, data:[PAPER]}` → `screen.getByText("White noise and memory")` 존재. 2차 `fetch` 모킹을 `{ok:false, status:429}`로 바꾸고 재검색 → `waitFor(() => role="alert" 존재)` 후 `queryByText("White noise and memory")`가 **null**, `queryByText(/Crossref 결과/)`도 null |
| `"네트워크 예외로 실패해도 같다"` | 2차 `fetch`가 `mockRejectedValue(new TypeError("fail"))` → 목록 null |
| `"실패 뒤 다시 성공하면 새 결과만 보인다"` | 3차 성공(다른 제목) → 새 제목만 존재 |

`vi.fn().mockResolvedValueOnce(...).mockResolvedValueOnce(...)`로 한 스텁에 순서를 준다 — `afterEach(unstubAllGlobals)`가 이미 있다(`:28-30`).

---

## ER4. mailto 길이를 인코딩 뒤에 잰다

### 위치
`components/ResearchShowcaseForm.tsx`
```
:45-47   // 메일 클라이언트마다 mailto 본문 길이 상한이 다르고, 넘치면 조용히 잘린다.
         // 잘린 줄 모르고 보내는 게 최악이라 이 길이를 넘으면 복사 사용을 권한다.
         const MAILTO_SAFE_LENGTH = 1500;
:77      const tooLongForMail = text.length > MAILTO_SAFE_LENGTH;
:90-92   const mailHref = `mailto:${SITE_CONTACT_EMAIL}?subject=${encodeURIComponent("연구랩 사례 공유")}&body=${encodeURIComponent(text)}`;
```
`tooLongForMail`이 `mailHref`보다 **먼저** 계산돼 인코딩 결과를 볼 수 없는 구조다.

### 변경 후
`:45-47` 교체:
```ts
// 메일 클라이언트마다 mailto URL 길이 상한이 다르고, 넘치면 조용히 잘린다.
// 잘린 줄 모르고 보내는 게 최악이라 이 길이를 넘으면 복사 사용을 권한다.
// 잰다 — 사용자가 친 글자 수가 아니라 **인코딩된 URL 전체**. 한글 한 글자는
// encodeURIComponent 뒤 9자(%EA%B0%80)라 글자 수로 재면 9배를 놓친다(ER4).
const MAILTO_SAFE_URL_LENGTH = 2000;

export function buildMailHref(text: string): string {
  return `mailto:${SITE_CONTACT_EMAIL}?subject=${encodeURIComponent(
    "연구랩 사례 공유",
  )}&body=${encodeURIComponent(text)}`;
}
```
`:76-77`·`:90-92` 교체(순서를 뒤집는다):
```ts
  const text = ready ? buildText(draft) : "";
  const mailHref = buildMailHref(text);
  const tooLongForMail = mailHref.length > MAILTO_SAFE_URL_LENGTH;
```
`:273-278` 안내문은 그대로 — 이미 "메일 링크로는 잘릴 수 있습니다"라고 말한다.

### 상한값 — **구현 시 판단 필요**
`2000`은 "가장 보수적인 URL 길이 관례"이지 mailto 핸들러 실측이 아니다. 인코딩 한글 기준 약 200자다. 판단 재료:
- 이 도구의 필수 두 칸(주제·연구질문) + 선택 세 칸을 채우면 한글 300~600자가 보통이다 → 2000이면 **거의 항상** 메일 버튼이 숨고 복사 안내만 남는다. 정직하지만 버튼이 사실상 죽는다.
- 상한을 8000으로 올리면 한글 약 850자까지 버튼이 살지만, 데스크톱 Outlook이 그 길이를 받는지 이 저장소 안에서는 확인할 수 없다.
- **권고**: 2000으로 시작한다. "잘린 줄 모르고 보낸다"가 "버튼이 자주 숨는다"보다 나쁘다는 것이 `:45-46` 주석의 원래 판단이다. 상한을 올리려면 Outlook·Apple Mail·Gmail 핸들러에서 실측한 뒤 이 상수만 바꾼다.

### 함정
1. `buildMailHref`를 export하면 `text === ""`일 때도 href를 만든다. `:256`의 `href={ready ? mailHref : undefined}`가 이미 막는다. 동작 불변.
2. 이름을 `MAILTO_SAFE_LENGTH`에서 바꾸는 이유 — 단위가 바뀌었다(글자 → URL 길이). 같은 이름을 두면 다음 사람이 "1500이 2000으로 늘었네"로 읽는다.

### 테스트 — `components/__tests__/ResearchShowcaseForm.test.tsx` (신설, jsdom)
현재 이 컴포넌트는 테스트 0줄이다.

| `it()` | 검증 |
| --- | --- |
| `"buildMailHref: 한글은 인코딩 후 9배로 늘어난다 (계산 근거 고정)"` | `buildMailHref("가").length - buildMailHref("").length === 9` |
| **`"한글 300자면 글자 수는 1500 미만이지만 메일 버튼이 숨는다 (ER4 회귀)"`** | 주제 `"가".repeat(20)`, 연구질문 `"나".repeat(280)` 붙여넣기(`user.paste`) → 본문 `text.length < 1500`인데 `queryByRole("link", {name:"메일로 보내기"})`가 null, `/메일 링크로는 잘릴 수 있습니다/` 존재. **종전 코드는 이 입력에서 버튼을 보였다** |
| `"짧은 입력이면 메일 버튼이 보이고 href가 인코딩된 본문을 담는다"` | 주제 `"소음"`, 질문 `"기억"` → 링크 존재, `href`에 `encodeURIComponent("연구 주제: 소음")` 포함 |
| `"ASCII 1900자는 글자 수 기준으로는 넘지만 URL 기준으로는 넘지 않는다 (반대 방향 오탐 방지)"` | 질문에 `"a".repeat(1900)` → 버튼 **보임**. 이 케이스가 없으면 "글자 수로 자르는 옛 코드"와 구분이 안 된다. `mailto:…&body=` 접두 약 80자 + 1900 < 2000이 되도록 숫자를 맞춘다 — 구현 시 접두 길이를 실측해 1900을 조정 |

---

## ER5. 설계 유형 퀴즈의 완전 동점

### 위치
`components/ResearchDesignQuiz.tsx`
```
:176-182
  const ranked = TYPES.map((t) => ({ type: t, score: totals[t] })).sort(
    (a, b) => b.score - a.score,
  );
  const top = ranked[0];
  // 1점 차 이내면 사실상 접전 — 하나로 단정하지 않는다
  const rival =
    ranked[1] && top.score - ranked[1].score <= 1 ? ranked[1] : null;
```
`Array.prototype.sort`는 안정 정렬이므로 동점은 `TYPES` 원순서(설문조사·실험·문헌·모델)다. 3자 이상 접전이면 `ranked[2]` 이후는 화면에서 사라진다.

**도달 가능성 확인**: 네 문항이 각각 한 유형에 3점을 주는 선택지를 갖는다(`:31,53,83,105` 등). Q1=설문, Q2=실험, Q3=문헌, Q4=모델을 고르면 `3,3,3,3`. Q4를 설문으로 바꾸면 `6,3,3,0`(3점 차 → 단독). Q4를 실험으로 바꾸면 `3,6,3,0` → 단독 실험. 3자 동점 `3,3,3,0`은 Q1=설문·Q2=실험·Q3=문헌·Q4=**실험 아닌 세 유형 중 하나**로는 안 되고… Q4=문헌 → `3,3,6,0`. 3자 정확 동점은 Q2 두 번째 선택지(`설문2·문헌1`, `:57`) 같은 분할 점수를 써야 나온다: Q1=실험(3), Q2=설문2·문헌1, Q3=문헌(3), Q4=설문(3) → 설문5·실험3·문헌4·모델0 → 1점 차 접전 3자(5·4·3). 이런 3자 접전이 지금은 "설문조사와 문헌분석·자료분석 사이"로 답하며 실험을 지운다.

### 변경 후 — `:176-182` 교체
```ts
  const ranked = TYPES.map((t) => ({ type: t, score: totals[t] })).sort(
    (a, b) => b.score - a.score,
  );
  const top = ranked[0];
  // 1점 차 이내는 사실상 접전 — 하나로 단정하지 않는다. 접전이 셋 이상이면
  // 도구는 아무것도 판별하지 못한 것이므로 두 유형으로 좁혀준 척하지 않는다(ER5).
  const contenders = ranked.filter((r) => top.score - r.score <= 1);
  const undecided = contenders.length >= 3;
  const rival = !undecided && contenders.length === 2 ? contenders[1] : null;
```
`:226-282` 결과 블록에서 `done` 안쪽 첫 자식을 세 갈래로 나눈다. `:228` `<div className="rounded-lg bg-surface …">` 바로 안에:
```tsx
            {undecided ? (
              <>
                <p className="text-sm font-semibold text-ink">
                  아직 한 유형으로 기울지 않았습니다
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {contenders.map((c) => c.type).join(" · ")}이(가) 비슷한 점수입니다.
                  이 도구로는 판별이 안 됩니다 — 1번(무엇을 묻는가)과 2번(결론에서
                  무엇을 말해야 하나)의 답이 서로 다른 유형을 가리키고 있을
                  가능성이 큽니다. 연구질문을 한 문장으로 다시 적어 본 뒤 고르세요.
                </p>
              </>
            ) : (
              <>
                {/* :229-266 기존 headline·설명·GUIDE 블록 그대로 */}
              </>
            )}
            {/* :268-274 '다시 고르기' 버튼은 세 갈래 공통 — 그대로 */}
```
`"이(가)"`는 `josa()`로 못 만든다(마지막 유형이 무엇인지에 따라 다름) — `josa(contenders[contenders.length-1].type, ["이","가"])`로 끝 단어 기준. 나머지 두 갈래(`rival`/단독)는 **기존 코드 그대로**다.

### 함정
1. `contenders.length === 1`이면 `rival=null` → 단독 갈래. `=== 2`면 rival. `>= 3`이면 undecided. 갈래 누락 없음.
2. 접전 기준 "1점 차"는 유지한다. 바꾸면 ER5 범위를 넘는다.
3. `aria-live="polite"`(`:226`) 안에서 갈래가 바뀌는 것이라 낭독기 알림도 따라온다. 추가 배선 없음.
4. `TQ8`이 지적한 "퀴즈 판정 분기 미검증"은 `ResearchQuestionQuiz`(다른 컴포넌트)다. 이 컴포넌트도 테스트 0줄이므로 아래가 첫 테스트다.

### 테스트 — `components/__tests__/ResearchDesignQuiz.test.tsx` (신설, jsdom)
라디오는 `screen.getByLabelText(옵션 문구)`로 고른다(`:203-219` label이 감싸고 있다).

| `it()` | 검증 |
| --- | --- |
| **`"네 유형이 전부 동점이면 두 유형으로 좁히지 않는다 (ER5 회귀)"`** | Q1 설문(`사람들의 인식·습관·실태가 어떤가`), Q2 실험(`"A 때문에 B가 달라진다"…`), Q3 문헌(`사람·장비 없이…`), Q4 모델(`기존 방법과 다른…`) → `/아직 한 유형으로 기울지 않았습니다/` 존재, `/사이입니다/` **없음**, 네 유형 이름이 모두 화면에 있음 |
| `"3자 접전도 판별 불가로 답한다"` | Q1 실험, Q2 `"A와 B가 같이 움직인다"…`(설문2·문헌1), Q3 문헌, Q4 설문 → 설문5·문헌4·실험3 → 판별 불가, `모델 구현`은 화면에 없음 |
| `"2자 접전은 종전대로 '사이입니다'"` | Q1 설문, Q2 실험, Q3 설문, Q4 실험 → `6,6,0,0` → `/설문조사와 실험 사이입니다/` |
| `"단독 1위는 종전대로 '가장 잘 맞습니다'"` | 넷 다 설문 → `/설문조사가 가장 잘 맞습니다/` |
| `"'다시 고르기'는 판별 불가 화면에서도 보인다"` | 4자 동점 후 버튼 존재·클릭 → `/0 \/ 4개 선택/` |

---

## ER7 + ER8. 전체 삭제의 범위 고지와 실패 처리

### 위치
`components/DataReset.tsx:8-24`
```ts
  function resetAll() {
    const ok = window.confirm(
      "이 사이트가 이 브라우저에 저장한 모든 기록을 삭제합니다. 되돌릴 수 없습니다. 계속할까요?",
    );
    if (!ok) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) { … }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // 접근 불가 시 무시
    }
    window.location.reload();
  }
```
`components/PlanExport.tsx:78-84` 제목·설명, `components/DataReset.tsx:29-33` 제목·설명.

### ER7 판단 — `PlanExport`에 `tool:*`를 넣는가, 확인창에 경고를 넣는가

**확인창 경고 + 두 컴포넌트 문구 정정. `PlanExport`에는 넣지 않는다.** 역할 경계:

| 컴포넌트 | 역할 | 형식 | 완전성 |
| --- | --- | --- | --- |
| `PlanExport` | **사람이 읽는 노트** — 체크리스트·자가검증·메모를 마크다운으로. 인쇄·공유용 | `.md` | 의도적으로 부분 |
| `PlanBackup` | **기계가 복원하는 스냅샷** — `research-guide:` 전체를 JSON으로. 다른 기기로 옮기기·삭제 전 보관용 | `.json` | 전체 |
| `DataReset` | 전체 삭제 | — | 전체 |

`tool:*` 값은 JSON 덩어리다(`simple-chart`의 `{type, labelsText, …}`, `design-quiz`의 `{asks: 0, …}`). 마크다운 노트에 이걸 넣으면 사람이 읽는 파일이 아니게 되고, 그렇다고 도구마다 사람용 포맷터를 쓰는 건 15개 도구 × 포맷터 = 새 기능이다. **완전한 백업은 이미 `PlanBackup`이 한다.** 문제는 백업이 없는 게 아니라 **어느 버튼이 완전한 백업인지 화면이 말하지 않는 것**이다.

### 변경 후 — 문구 3곳

`PlanExport.tsx:78-84`:
```tsx
        <h3 className="text-[15px] font-semibold text-ink">
          체크리스트·메모를 노트로 내보내기
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          각 단계에서 체크한 항목과 적어둔 생각을 읽기 좋은 마크다운 파일로
          모읍니다. 도구에 입력한 값·레퍼런스·마감일은 들어가지 않습니다 —
          전부 보관하려면 아래 &lsquo;백업 파일 내려받기&rsquo;를 쓰세요.
        </p>
```
`DataReset.tsx:29-33`:
```tsx
        <h3 className="text-[15px] font-semibold text-ink">내 기록 전부 삭제</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          체크리스트, 메모, 레퍼런스, 마감일, 활동 기록, 그리고 도구에 입력한
          값(변수 정의표·차트 데이터·사례 초안 등)까지 이 브라우저에 저장된
          모든 기록을 삭제합니다. 위 &lsquo;노트로 내보내기&rsquo;는 전체
          백업이 아닙니다.
        </p>
```
`DataReset.tsx:10` 확인창:
```ts
      "이 사이트가 이 브라우저에 저장한 모든 기록을 삭제합니다 — 체크리스트·메모·레퍼런스·마감일·도구 입력값 전부. 되돌릴 수 없습니다.\n\n남겨야 할 것이 있으면 '취소'를 누르고 먼저 '백업 파일 내려받기'를 하세요. 계속할까요?",
```

### ER8 변경 후 — `DataReset.tsx` 전체 교체

```tsx
"use client";

import { useState } from "react";

const PREFIX = "research-guide:";
// 테마는 화면 설정이지 '기록'이 아니므로 남겨둔다
const THEME_KEY = "research-guide:theme";

const CONFIRM_TEXT = "…(위 문구)…";

function listRecordKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX) && key !== THEME_KEY) keys.push(key);
  }
  return keys;
}

export function DataReset() {
  const [failure, setFailure] = useState<string | null>(null);

  function resetAll() {
    if (!window.confirm(CONFIRM_TEXT)) return;
    setFailure(null);

    // 키마다 따로 시도한다 — 하나가 던져도 나머지는 지워야 한다.
    // 그리고 지웠다고 믿지 않고 **다시 세어** 남은 것을 확인한다. 종전 코드는
    // 실패를 삼키고 새로고침해 "지워진 것처럼" 보였다(ER8). 공용 PC에서
    // 기록을 지우려던 학생에게 그 화면은 개인정보 잔존이다.
    let remaining: string[];
    try {
      for (const key of listRecordKeys()) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // 아래 재확인에서 잡힌다
        }
      }
      remaining = listRecordKeys();
    } catch {
      // localStorage 접근 자체가 막힘(프라이빗 모드 등) — 지운 것도 없다
      setFailure(
        "브라우저 저장소에 접근하지 못해 삭제하지 못했습니다. 브라우저 설정의 '사이트 데이터 삭제'로 지워주세요.",
      );
      return;
    }
    if (remaining.length > 0) {
      setFailure(
        `${remaining.length}개 항목을 지우지 못했습니다. 브라우저 설정의 '사이트 데이터 삭제'로 이 사이트의 데이터를 지워주세요.`,
      );
      return;
    }
    window.location.reload();
  }

  return (
    <section className="…(:27 그대로)">
      <div>
        <h3 …>내 기록 전부 삭제</h3>
        <p …>{/* ER7 문구 */}</p>
        {failure && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {failure}
          </p>
        )}
      </div>
      <button …>전부 삭제하기</button>
    </section>
  );
}
```
`role="alert"` + `text-danger` 조합은 `PlanBackup.tsx:130-134`와 같다.

### 함정
1. **실패 시 새로고침하지 않는다.** 새로고침하면 `usePersistentState` 등이 남은 값을 다시 읽어 화면이 "안 지워졌음"을 보여주긴 하지만, 그 전에 오류 문구가 사라진다. 문구가 남아야 사용자가 다음 행동(브라우저 설정)을 안다.
2. `listRecordKeys`가 **순회 중 삭제**를 하지 않는다 — 먼저 목록을 만들고 지운다(종전과 같음). `localStorage.key(i)`는 삭제 중 인덱스가 밀리므로 이 순서가 필수다.
3. **`PlanBackup.tsx:14-25`에 같은 이름의 `listRecordKeys`가 있다.** 공용 모듈로 빼는 것이 옳지만 T8(batch05 C6)이 `lib/storageKeys.ts`를 신설할 예정이고 그 설계는 "PlanBackup·DataReset은 접두사 스캔이라 이 표에 의존하지 않는다"고 적었다. **지금은 중복을 두고**, T8 구현 시 두 스캔 함수를 `storageKeys.ts`로 올리는 것을 T8의 함정에 추가하라. 이 커밋에서 파일을 하나 더 만들면 T8과 충돌한다.
4. 부분 실패 후 `remaining.length > 0`인데 사용자가 다시 누르면 남은 것만 다시 시도한다. 멱등이다.
5. **`window.location.reload` 스파이** — `impl-plan-batch0.md` 파트 5-6이 jsdom 30에서 미확인이라 적었다. 아래 테스트 중 reload 단언 두 건은 `Object.defineProperty(window, "location", { value: { ...window.location, reload: vi.fn() }, configurable: true })`를 먼저 시도하고, 안 되면 그 두 건만 `it.skip` + 사유. **프로덕션 코드에 reload 주입을 넣지 마라**(batch0의 판단과 동일).

### 테스트 — `components/__tests__/DataReset.test.tsx` (신설, jsdom)
batch0 S3 표의 5건을 이 커밋이 흡수하고 ER8 3건을 더한다. 저장 실패는 `usePersistentState.test.tsx:52`처럼 `vi.spyOn(Storage.prototype, "removeItem")`으로 건다(S2 헬퍼가 아직 없어도 된다 — 헬퍼가 들어오면 갈아끼운다).

| `it()` | 검증 |
| --- | --- |
| `"확인을 취소하면 아무것도 지우지 않는다"` | `confirm→false`, 시드 키 불변, reload 미호출 |
| `"research-guide: 접두사 키만 지운다"` | `other:key` 잔존 |
| `"테마 키는 남긴다"` | `research-guide:theme` 잔존 |
| `"삭제 후 새로고침한다"` | reload 1회 |
| **`"removeItem이 일부 키에서 던지면 삭제 실패를 알리고 새로고침하지 않는다 (ER8 회귀)"`** | 시드 3키, `removeItem` 스파이가 두 번째 호출에서 throw → 화면에 `/1개 항목을 지우지 못했습니다/`(role=alert), reload **미호출**, 나머지 2키는 지워짐 |
| `"localStorage 접근 자체가 막히면 그 사실을 알린다"` | `Storage.prototype.key` 또는 `length` getter가 throw → `/접근하지 못해/`, reload 미호출 |
| `"실패 뒤 다시 누르면 남은 것만 다시 시도한다"` | 첫 시도 부분 실패 → 스파이 복원 → 재클릭 → 전부 삭제, reload 호출 |
| `"확인창 문구가 도구 입력값과 백업을 언급한다 (ER7)"` | `confirm` 스파이의 첫 인자에 `도구 입력값`·`백업 파일 내려받기` 포함 |

### 테스트 — `components/__tests__/PlanExport.test.tsx` (신설)
batch0 S3의 (a)안대로 `PlanExport.tsx:21`을 `export function buildMarkdown`으로 바꾸고 S3 표의 5건을 그대로 쓴다. ER7 몫으로 1건 추가:

| `it()` | 검증 |
| --- | --- |
| `"설명문이 전체 백업이 아님을 말한다 (ER7)"` | 렌더 후 `/전부 보관하려면/`·`/백업 파일 내려받기/` 존재, 제목이 `/지금까지 기록 내보내기/`가 **아님** |

---

# 파트 3 — SC1·SC3·SC4·BR4

## SC1. 사례 MDX를 `format: "md"`로

### 위치
`app/showcase/[slug]/page.tsx:85-90`
```tsx
        <MDXRemote
          source={item.content}
          options={{
            // 자료실·가이드 본문과 같은 이유로 물결표 하나는 취소선이 아니다
            mdxOptions: { remarkPlugins: [[remarkGfm, { singleTilde: false }]] },
          }}
```
파트 0-(3)·(4)의 실측이 전제다.

### 변경 후 — 옵션을 `lib`로 빼서 테스트가 같은 객체를 쓰게 한다

신설 `lib/showcaseMdx.ts`:
```ts
import remarkGfm from "remark-gfm";

/**
 * 사례(showcase) 본문의 MDX 컴파일 옵션.
 *
 * `format: "md"`가 핵심이다. 사례 본문은 학생이 `ResearchShowcaseForm`으로
 * 보낸 자유 텍스트를 운영자가 붙여넣는 것이라 **신뢰 경계 바깥**이다.
 * 기본 `format: "mdx"`는 본문의 `<script>`·`<iframe>`·`<img src="https://…">`를
 * JSX로 컴파일해 모든 방문자에게 실행·전송한다. `md`는 JSX·표현식 파싱을 끄고
 * raw HTML을 통째로 떼어낸다(@mdx-js/mdx의 rehypeRemoveRaw). 표·링크·강조 등
 * 마크다운은 그대로다. next-mdx-remote가 기본으로 끼우는 blockJS는 `{}`
 * 표현식만 막고 JSX 요소는 남기므로 그것만으로는 부족하다.
 *
 * 자료실·가이드는 운영자가 직접 쓰므로 여기 포함하지 않는다(별도 판단).
 */
export const SHOWCASE_MDX_OPTIONS = {
  mdxOptions: {
    format: "md" as const,
    // 자료실·가이드 본문과 같은 이유로 물결표 하나는 취소선이 아니다
    remarkPlugins: [[remarkGfm, { singleTilde: false }]],
  },
};
```
`app/showcase/[slug]/page.tsx:87-90` → `options={SHOWCASE_MDX_OPTIONS}`, `remarkGfm` import는 이 파일에서 더 안 쓰이면 제거(`components={{ table: … }}` `:91-`는 그대로 — `md` 포맷에서도 마크다운 요소 매핑은 동작한다).

타입: `MDXRemoteProps["options"]`가 `SerializeOptions`이고 `mdxOptions`는 `@mdx-js/mdx`의 `CompileOptions` 부분집합이다. `format: "md" as const`면 맞는다. `remarkPlugins` 튜플 타입이 까다로우면 `satisfies SerializeOptions`를 붙인다 — **구현 시 타입 에러가 나면 `as const` 위치 조정.**

### 자료실·가이드도 바꾸는가 — **이 커밋에서는 아니다**
세 호출부 모두 `<`가 0회라 바꿔도 깨지지 않는다. 그러나 (a) 위협 모델이 다르다(운영자 직접 작성), (b) 자료실 31편에 나중에 JSX 콜아웃을 쓸 여지를 SC1이 결정할 이유가 없다. `md`로 통일하고 싶으면 별도 항목으로. SC2(CSP)가 그쪽의 2차 방어선이다.

### 함정
1. **`md` 포맷은 raw HTML을 조용히 지운다.** 운영자가 `<br>`이나 `<sup>`를 쓰면 아무 경고 없이 사라진다. 빌드는 초록이다. 아래 테스트 2번이 "지워진다"를 정본으로 못 박으므로 나중에 누군가 `<sup>`를 쓰려다 "왜 안 나오지"를 테스트에서 발견한다. 이 문서화가 그 함정의 방어다.
2. `p<0.05`처럼 `<` 뒤에 공백 없는 텍스트 — CommonMark에서 `<0`은 태그가 아니라 문자 그대로다. `mdx` 포맷이면 오히려 파싱 오류를 냈을 자리다. **`md`가 더 관대하다.** 확인만.
3. `format: "md"`는 `import`/`export`도 끈다 — 사례가 쓸 일 없다.
4. T7(`sources` 프론트매터)·M6(절 골격)과 같은 커밋 후보라고 백로그가 적었지만, 그 둘은 콘텐츠 6편을 만지고 이건 코드 한 줄 + 테스트다. **분리한다.** 사례 파일을 함께 바꾸면 "이 커밋이 XSS 경로를 닫았다"가 diff에서 안 보인다.

### 테스트 — `lib/__tests__/showcaseMdx.test.ts` (신설, node 환경)
`@mdx-js/mdx`의 `compile`을 직접 부른다(next-mdx-remote는 `rsc.js`에서 `Function` 생성자로 실행까지 하므로 테스트에서 피한다). `SHOWCASE_MDX_OPTIONS.mdxOptions`에 next-mdx-remote가 붙이는 `outputFormat: "function-body"`를 더해 부른다.

| `it()` | 검증 |
| --- | --- |
| **`"raw HTML 요소가 컴파일 결과에서 사라진다 (SC1 — 저장형 XSS 경로 차단)"`** | 입력 `"본문\n\n<script>alert(1)</script>\n\n<img src=\"https://evil.example/t.gif\">\n\n<iframe src=\"https://evil.example\"></iframe>"` → `String(compiled)`에 `"script"`·`"evil.example"`·`"iframe"`·`"img"`가 **0회**, `"본문"`은 존재 |
| `"JSX 문법이 실행되지 않고 본문으로도 남지 않는다"` | `"<Foo bar=\"x\" />"` → 결과에 `Foo` 0회 |
| `"표·링크·강조 마크다운은 그대로 컴파일된다 (기능 회귀 방지)"` | GFM 표 + `[링크](/guide)` + `**굵게**` → `"table"`·`"href"`·`"strong"` 존재 |
| `"물결표 하나는 취소선이 아니다 (기존 옵션 유지)"` | `"3~4주"` → `"del"` 0회 |
| **`"현재 사례 6편이 전부 md 포맷으로 컴파일된다 (콘텐츠 회귀)"`** | `getAllShowcases()`(또는 `fs`로 직접 읽어 gray-matter) 각 `content`를 컴파일 → 예외 없음. 6편 이상이면 전부 |
| `"기본(mdx) 포맷에서는 같은 입력이 script를 남긴다 (테스트 자체 점검)"` | 옵션에서 `format` 제거 → `"script"` 존재. **이 한 건이 없으면 위 1번이 "원래 안 남는 것"인지 구분이 안 된다** |

---

## SC3. `usePersistentState`의 형태 검증

### 위치
`lib/usePersistentState.ts:50-52`
```ts
        const parsed = JSON.parse(raw) as T;
        // 저장된 값과 초기값의 대분류(typeof)가 다르면 손상으로 보고 무시
        if (typeof parsed === typeof initialValue) return parsed;
```
호출부 15곳의 `initial` 형태(실측): 문자열 5(`imrad-draft`·`length-checker`·`speech-timer`·`survey-bias` 등), 객체 9(`simple-chart`·`stats-calculator`·`showcase-draft`·`citation-form`·`design-quiz`·… ), 배열 1(`variable-table`, 원소 `{name, role, note}`).

### 판단 — 왜 "세 줄"로는 부족한가 (파트 0-(6))
`"{}"`, `"{\"topic\": 3}"`, `"[{}]"`(변수표)가 전부 세 줄을 통과하고 각각 `.trim()`·`.map`에서 던진다. 페이지가 죽는 조건은 "타입 대분류 불일치"가 아니라 **"컴포넌트가 기대하는 키가 기대하는 타입으로 없음"**이다. 그러니 initial을 **형태의 정본**으로 삼아 대조한다.

동시에 **누락 키는 거부하지 않고 initial로 채운다.** 안 그러면 도구가 나중에 필드를 하나 추가하는 순간 모든 사용자의 저장값이 "형태 불일치"로 버려진다 — 그건 SC3를 고치다 새로 만드는 데이터 손실이다.

### 변경 후 — `lib/usePersistentState.ts`

`:33` 앞(훅 위)에 추가:
```ts
/**
 * 저장값을 initial의 형태에 맞춰 되살린다. 맞출 수 없으면 null.
 *
 * 왜 typeof 한 줄로는 안 되나(SC3) — `"[]"`·`"null"`·`"{}"`가 전부 객체
 * initial의 typeof 검사를 통과하고, 컴포넌트는 `draft.topic.trim()`에서
 * 던진다. 새로고침해도 같은 값을 읽으니 그 페이지는 영구히 죽고, 복구는
 * 전체 삭제뿐이다. 백업 파일이 신뢰 경계라 이 훅이 유일한 방어선이다.
 *
 * 규칙:
 * - null·typeof 불일치·배열/비배열 불일치 → 버린다
 * - 객체: initial의 각 키를 본다. 없으면 initial 값으로 채운다(도구가 필드를
 *   추가해도 기존 저장값을 잃지 않게). 있는데 형태가 다르면 통째로 버린다.
 *   initial에 없는 키는 그대로 둔다.
 * - 배열: initial[0]이 있으면 모든 원소를 그 형태로 검사한다. initial이
 *   빈 배열이면 원소 형태를 알 수 없으므로 배열이라는 것만 본다.
 */
export function reconcile<T>(parsed: unknown, initial: T): T | null {
  if (parsed === null || typeof parsed !== typeof initial) return null;
  if (Array.isArray(initial)) {
    if (!Array.isArray(parsed)) return null;
    const proto = initial[0];
    if (proto === undefined) return parsed as T;
    const items = parsed.map((el) => reconcile(el, proto));
    return items.every((el) => el !== null) ? (items as T) : null;
  }
  if (typeof initial === "object") {
    if (Array.isArray(parsed)) return null;
    const src = parsed as Record<string, unknown>;
    const out: Record<string, unknown> = { ...src };
    for (const [key, proto] of Object.entries(initial as Record<string, unknown>)) {
      if (src[key] === undefined) {
        out[key] = proto;
        continue;
      }
      const v = reconcile(src[key], proto);
      if (v === null) return null;
      out[key] = v;
    }
    return out as T;
  }
  return parsed as T;
}
```
`:50-52` 교체:
```ts
        const restored = reconcile(JSON.parse(raw) as unknown, initialValue);
        if (restored !== null) return restored;
```

### 함정
1. **`reconcile`은 `null`을 "거부"로 쓴다.** `T` 자체가 null을 담는 용도는 `:44-45` 주석대로 지원하지 않으므로 충돌 없다. 그러나 **객체 안의 필드가 null일 수 있는 도구가 있으면** 그 필드는 initial에서 `null`이고 `typeof null === "object"`… `reconcile(x, null)`은 첫 줄에서 `parsed===null → null(거부)`이고 `typeof initial === "object"` 분기에서 `Object.entries(null)`이 던진다. **구현 전에 15개 initial에 null 필드가 없는지 grep** (`usePersistentState` 호출부의 initial 리터럴에서 `null` 검색). 지금 읽은 9개 객체 initial에는 없다. 있으면 `if (initial === null) return parsed === null ? initial : null;`을 첫 줄에 추가.
2. **유니온 문자열 필드(`type: "bar" | …`, `role: "독립변수" | …`)는 값을 검사하지 않는다.** `typeof`만 본다. `type: "bogus"`는 통과해 `CHART_OPTIONS.find(…)?.label`(`:219`)로 조용히 빈 라벨이 된다. 죽지는 않는다. 값 목록 검증은 도구별 스키마 = 새 기능. 범위 밖.
3. `design-quiz`의 initial `{}`는 키가 없어 어떤 객체든 통과한다. `answers[q.id]`가 문자열이면 `q.options["x"]` → undefined → `:158`에서 skip. 죽지 않는다.
4. **저장값이 initial로 "치유"되면 다음 `set`에서 치유된 값이 저장된다** — 사용자의 나머지 입력은 보존된다. 종전엔 통째로 initial로 떨어졌다. 개선이지 회귀가 아니다.
5. `PlanBackup`은 손대지 않는다. `:106-109`의 `typeof value === "string"` 필터 + 이 훅의 형태 검증이면 백로그가 든 시나리오(`showcase-draft`에 `"[]"`)는 **가져오기는 되지만 읽는 순간 initial로 폴백**한다. 페이지는 살고, 기록은 안 잃는다. `references`·`deadlines`·`activity-log`·`checklist`는 SC8 관찰대로 이미 항목 단위로 거른다. `reflection:`은 문자열이면 무엇이든 유효하다. **따라서 SC3의 변경 파일은 이 훅 하나**이고 K1(PlanBackup)과 파일이 겹치지 않는다 — 백로그의 "SC3 + K1"은 커밋 결합이 아니라 "같이 봐라"로 읽는다.

### 테스트 — `lib/__tests__/usePersistentState.test.tsx` 확장
`Probe`(`:13-24`)는 문자열 initial이다. 객체·배열 initial용 `ObjProbe`(`{topic:"", n:0}`)·`ArrProbe`(`[{name:""}]`)를 같은 파일에 추가한다. `reconcile`은 export하므로 순수 단위 테스트도 같이 둔다.

| `it()` | 검증 |
| --- | --- |
| **`"reconcile: 객체 initial에 저장값이 배열이면 버린다 (SC3 — '[]' 시나리오)"`** | `reconcile([], {topic:""})` → `null` |
| `"reconcile: null은 버린다"` | `reconcile(null, {topic:""})` → `null`; `reconcile(null, "")` → `null` |
| **`"reconcile: 빈 객체는 initial 키로 채워진다 ('{}' 시나리오)"`** | `reconcile({}, {topic:"", n:0})` → `{topic:"", n:0}` |
| `"reconcile: 키가 있는데 타입이 다르면 통째로 버린다"` | `reconcile({topic: 3}, {topic:""})` → `null` |
| `"reconcile: 누락 키는 채우고 나머지는 보존한다 (필드 추가 시 기록 유지)"` | `reconcile({topic:"소음"}, {topic:"", question:""})` → `{topic:"소음", question:""}` |
| `"reconcile: initial에 없는 키는 그대로 둔다"` | `reconcile({topic:"a", legacy:1}, {topic:""})` → `legacy` 유지 |
| `"reconcile: 배열 원소를 initial[0] 형태로 검사한다 ('[{}]' 시나리오)"` | `reconcile([{}], [{name:"", role:""}])` → `[{name:"", role:""}]`(채움); `reconcile([{name: 1}], [{name:""}])` → `null`; `reconcile(["x"], [{name:""}])` → `null` |
| `"reconcile: initial이 빈 배열이면 배열이기만 하면 된다"` | `reconcile([1,"a"], [])` → `[1,"a"]` |
| **`"객체 도구에 '[]'가 저장돼 있어도 렌더가 죽지 않고 초기값을 쓴다 (SC3 회귀)"`** | `localStorage.setItem(KEY_OBJ, "[]")` → `render(<ObjProbe/>)` 예외 없음, 화면 initial |
| `"손상값으로 렌더된 뒤 set하면 치유된 값이 저장된다"` | `"{}"` 저장 → 렌더 → 버튼으로 `topic` 변경 → `localStorage`에 `{topic:"…", n:0}` |
| 기존 5건 | 그대로 통과(`:77-81` "형태 불일치" 케이스는 객체를 문자열 initial에 → `typeof` 불일치 → null → 초기값 ✓) |

---

## SC4. 개인정보처리방침에 Crossref 추가

### 위치 — `app/privacy/page.tsx`
```
:72-75   "선행연구 검색해보기" 도구를 사용하면 입력한 검색어가 이
         사이트의 서버를 거쳐 외부 학술 검색 API인 Semantic Scholar로
         전달되고, 요청이 몰려 응답을 받지 못하면 OpenAlex로 대신
         전달됩니다.
:105-106 위에서 설명한 외부 서비스는 모두 미국에 있는 회사가 운영하므로,
         해당 정보는 국외로 전달됩니다.
:113     <li>Semantic Scholar / OpenAlex(미국) — 선행연구 검색어</li>
```
실제 체인(`lib/searchChain.ts:58-105`, `app/api/search-papers/route.ts:51-66`): S2 → **Crossref** → OpenAlex. Crossref에는 검색어 외에 `mailto=`(운영자 이메일, `:57`)와 `User-Agent`에 사이트 URL이 간다 — 운영자 정보이지 이용자 정보가 아니므로 방침에 안 적어도 된다. Crossref는 영국 기반 비영리(등록지 영국). `:105`의 "모두 미국에 있는 회사"가 **틀린 문장이 된다.**

`PriorResearchSearch.tsx:104-105`의 도구 설명("요청이 몰리면 Crossref로 대신 검색")은 이미 맞다. `about/page.tsx`는 `mailto:` 링크만 있고 검색 체인을 설명하지 않는다(grep 확인).

### 변경 후
`:72-75`:
```
          &quot;선행연구 검색해보기&quot; 도구를 사용하면 입력한 검색어가 이
          사이트의 서버를 거쳐 외부 학술 검색 API인 Semantic Scholar로
          전달되고, 응답을 받지 못하면 Crossref로, 그래도 결과가 없으면
          OpenAlex로 차례로 대신 전달됩니다.
```
`:105-106`:
```
          위에서 설명한 외부 서비스는 국외(미국·영국)에 있는 기관이
          운영하므로, 해당 정보는 국외로 전달됩니다.
```
`:113`:
```
          <li>Semantic Scholar / OpenAlex(미국), Crossref(영국) — 선행연구 검색어</li>
```
방침 상단에 시행일·개정일 표기가 있으면 개정일을 갱신한다 — **구현 시 `:1-40`을 열어 확인**(이번에 `:60` 앞은 읽지 않았다).

### 함정
1. **법적 문서다.** 세 곳 외에는 한 글자도 바꾸지 않는다. 문구 개선은 T8·KO 계열의 몫.
2. T8(batch05 C6)이 `:41-53`을 `STORAGE_GROUPS.map`으로 바꾼다. 이 커밋은 `:72-75`·`:105-106`·`:113`이라 hunks가 떨어져 있다. 순서 무관.
3. "그래도 결과가 없으면"이 정확하다 — `searchChain.ts:83-84`는 Crossref **0건**일 때 OpenAlex로 간다. "응답을 받지 못하면"으로 쓰면 틀린다.

### 테스트
방침 페이지는 서버 컴포넌트라 렌더 테스트가 무겁다. batch05 T6의 `app/__tests__/routes.test.ts`가 생기면 거기에, 아니면 `lib/__tests__/searchChain.test.ts`에 **소스 문자열 대조** 1건:

| `it()` | 검증 |
| --- | --- |
| `"searchChain이 부르는 외부 소스가 전부 /privacy 국외 이전 목록에 있다 (SC4 방지선)"` | `lib/searchChain.ts`에서 `source: "…"` 리터럴 집합(`semantic-scholar`·`crossref`·`openalex`)을 뽑고, `app/privacy/page.tsx` 소스에 각각의 표기(`Semantic Scholar`·`Crossref`·`OpenAlex`)가 5절(`국외로 전달되는 정보` 이후) 안에 있는지. 폴백을 하나 더 붙이면 여기서 깨진다 |

---

## BR4. 애드센스 ID 출처 통일

### 위치
```
app/layout.tsx:10    const ADSENSE_CLIENT_ID = "ca-pub-7710727724213886";
app/layout.tsx:101   src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
components/AdSlot.tsx:36   const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
components/AdSlot.tsx:49   if (!clientId) return null;
components/AdSlot.tsx:56   data-ad-client={clientId}
public/ads.txt       google.com, pub-7710727724213886, DIRECT, f08c47fec0942fa0
.env.example:5-7     NEXT_PUBLIC_ADSENSE_CLIENT_ID=
README.md:22-27      애드센스 연동 절 (3·4번 항목은 이미 한 일을 "할 일"로 적고 있다)
```
`NEXT_PUBLIC_ADSENSE_CLIENT_ID`는 **두 가지 일**을 한다 — ID 값이면서 슬롯 on/off 스위치다. 그래서 ID가 두 곳(하드코딩·환경변수)에 살고, 환경변수를 켜는 사람이 다른 ID를 넣으면 로더와 슬롯이 다른 계정을 가리킨다. `ads.txt`까지 세 곳이다.

### 판단
- ID는 **공개 식별자**다(HTML·`ads.txt`에 이미 노출). 비밀이 아니므로 환경변수에 둘 이유가 없다. `GA_MEASUREMENT_ID`(`layout.tsx:9`)·`SITE_CONTACT_EMAIL`(`site.ts:21`)과 같은 부류 → **`lib/site.ts` 상수 하나로.**
- 스위치는 **별도 boolean 환경변수**로 분리한다. E3("환경변수 설정 여부")는 그대로 "슬롯을 켤 것인가"라는 운영자 결정으로 남는다. 순서 제약 `BR4 → O5 → E3`도 유지된다 — 이 커밋은 슬롯을 켜지 않는다.
- 로더 스크립트는 지금처럼 **항상** 싣는다(소유권 확인, `layout.tsx:93-98` 주석). 바꾸지 않는다.

### `NEXT_PUBLIC_` 접두사 — 빌드 타임 인라인을 어떻게 다루나
Next는 `process.env.NEXT_PUBLIC_X`라는 **정확한 리터럴 표현식**을 빌드 시 문자열로 치환한다. 그래서:
1. `lib/site.ts`에 `process.env.NEXT_PUBLIC_ADSENSE_SLOTS`를 리터럴로 쓰면 그 파일이 서버·클라이언트 어느 번들에 들어가든 인라인된다. `AdSlot`("use client")이 import해도 된다. **`process.env[name]`·구조분해·별도 상수로 이름을 옮기는 형태는 인라인되지 않는다** — `site.ts` 안에서 반드시 리터럴로 접근.
2. 값은 **빌드 시점**에 박힌다. Vercel에서 환경변수를 추가·변경한 뒤 **재배포**해야 반영된다. 런타임에 켜는 스위치가 아니다. `.env.example` 주석에 적는다.
3. vitest는 인라인하지 않고 런타임 `process.env`를 읽는다. 테스트에서 `vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOTS", "on")`으로 제어 가능 — **단, 모듈 상단에서 상수로 굳히면 import 시점에 평가돼 stubEnv가 늦는다.** 그래서 `site.ts`는 상수가 아니라 **함수**로 노출한다(아래). 인라인은 함수 본문 안의 리터럴에도 적용된다.

### 변경 후

`lib/site.ts:21` 뒤에 추가:
```ts
/**
 * Google AdSense 게시자 ID — 로더 스크립트(app/layout.tsx)·광고 슬롯
 * (components/AdSlot.tsx)·public/ads.txt가 전부 이 값과 같아야 한다.
 * 공개 식별자라 환경변수에 둘 이유가 없고, 두 곳에 두면 어긋난다(BR4).
 * 테스트가 세 곳의 일치를 잠근다.
 */
export const ADSENSE_CLIENT_ID = "ca-pub-7710727724213886";

/**
 * 광고 **슬롯**을 그릴 것인가. 로더 스크립트는 소유권 확인을 위해 항상 실리고,
 * 슬롯만 이 스위치를 따른다(승인 전 빈 점선 박스가 본문에 노출되는 것을 막는다).
 *
 * NEXT_PUBLIC_ 변수는 빌드 시 `process.env.NEXT_PUBLIC_ADSENSE_SLOTS` 리터럴이
 * 문자열로 치환된다 — 그래서 반드시 이 리터럴 형태로 접근하고, 값을 바꾸면
 * 재배포해야 한다. 함수인 이유: 모듈 상단 상수로 굳히면 vitest에서
 * vi.stubEnv가 import보다 늦어 테스트할 수 없다.
 */
export function adSlotsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADSENSE_SLOTS === "on";
}
```

`app/layout.tsx:10` 삭제, `:7` import에 `ADSENSE_CLIENT_ID` 추가. `:101` 그대로(이름이 같다).

`components/AdSlot.tsx:36` → `const enabled = adSlotsEnabled();`, `:40-47`의 `useEffect` 의존성 `[clientId]` → `[enabled]`, `:41`·`:49` `if (!clientId)` → `if (!enabled)`, `:56` `data-ad-client={ADSENSE_CLIENT_ID}`. import `import { ADSENSE_CLIENT_ID, adSlotsEnabled } from "@/lib/site";`. `:8-11` 주석의 `NEXT_PUBLIC_ADSENSE_CLIENT_ID` → `NEXT_PUBLIC_ADSENSE_SLOTS=on`.

`.env.example:5-7`:
```
# 광고 슬롯 표시 여부. AdSense 승인 뒤 "on"으로. 게시자 ID는 lib/site.ts에 있다.
# NEXT_PUBLIC_ 변수는 빌드 시 박히므로 Vercel에서 바꾼 뒤 재배포해야 한다.
NEXT_PUBLIC_ADSENSE_SLOTS=
```

`README.md:22-27` 애드센스 절:
```
1. AdSense 계정 승인
2. 게시자 ID가 바뀌면 `lib/site.ts`의 `ADSENSE_CLIENT_ID`와 `public/ads.txt`를 함께 고친다
3. `.env.local`(또는 Vercel 환경변수)에 `NEXT_PUBLIC_ADSENSE_SLOTS=on` 설정 후 재배포
4. `components/AdSlot.tsx`의 `<ins>` 태그에 실제 `data-ad-slot` 값 채우기

승인 전(스위치 off)에는 광고 슬롯이 렌더되지 않고 로더 스크립트만 실린다.
```

### 함정
1. **Vercel에 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 이미 설정돼 있는지 이 저장소에서는 알 수 없다.** 설정돼 있으면 이 커밋으로 슬롯이 **꺼진다**(새 변수명이 없으므로). 배포 전 Vercel 대시보드 확인 — 있으면 `NEXT_PUBLIC_ADSENSE_SLOTS=on`으로 옮긴다. 메모리(`vercel-yeongulab-ids.md`)에 프로젝트 ID가 있으니 확인 가능. batch05 `:18`·`:1030`은 "미설정"을 전제로 썼다.
2. O5(batch05 C7)가 `layout.tsx:6`의 `AdSlot` import를 지운다. 이 커밋은 `:7`·`:10`을 만진다. **인접 줄**이라 리베이스 시 수동 병합 1회. BR4가 먼저다(색인의 순서 제약).
3. `adSlotsEnabled()`를 렌더마다 부르는 비용은 0(인라인된 리터럴 비교).
4. `"on"`이라는 값 관례 — `"true"`·`"1"`을 받지 않는다. 문서에 적었으니 충분하다. 넓히면 "`NEXT_PUBLIC_ADSENSE_SLOTS=false`가 왜 켜지지"류를 만든다.

### 테스트 — `lib/__tests__/site.test.ts` (신설, node 환경)

| `it()` | 검증 |
| --- | --- |
| **`"애드센스 ID가 layout·AdSlot·ads.txt 세 곳에서 site.ts와 같다 (BR4 — 이원화 방지)"`** | `app/layout.tsx`·`components/AdSlot.tsx` 소스에 `ca-pub-` 리터럴 **0회** + `ADSENSE_CLIENT_ID` import 존재; `public/ads.txt`에 `pub-${ADSENSE_CLIENT_ID.replace(/^ca-/, "")}` 포함 |
| `"옛 환경변수 이름이 소스 어디에도 없다"` | `app/**`·`components/**`·`lib/**`·`.env.example`·`README.md`에 `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 0회 |
| `"adSlotsEnabled는 'on'일 때만 참"` | `vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOTS","on")` → true; `"true"`·`""`·미설정 → false. `afterEach(vi.unstubAllEnvs)` |
| `"site.ts는 환경변수를 리터럴로 접근한다 (인라인 계약)"` | `lib/site.ts` 소스에 `process.env.NEXT_PUBLIC_ADSENSE_SLOTS` 리터럴 존재, `process.env[` 0회 |

`components/__tests__/AdSlot.test.tsx` (신설, jsdom) 2건: 스위치 off → `container.innerHTML === ""`; on → `ins.adsbygoogle`에 `data-ad-client === ADSENSE_CLIENT_ID`. `window.adsbygoogle` push는 try로 감싸져 있어 스텁 불필요.

---

# 파트 4 — 커밋 분할과 순서

**10개 커밋.** batch0의 8개 뒤에 번호를 잇는다(마스터 순서표의 단계 2에 끼운다).

### 커밋 9 — `fix: 차트 값 칸의 빈 셀이 뒤 항목을 당기던 문제 (ER2)`
- `lib/chartGeometry.ts` — `splitValueCells` 신설, `parsePairs` 라벨 분할 규칙
- `lib/__tests__/chartGeometry.test.ts` 5건
- **작업 순서**: 테스트 1번(`"12, , 7, 15"`)을 먼저 써서 빨간 것을 확인 — 현재 코드는 `[A,B,C]=[12,7,15]`를 낸다.
- **K3(커밋 5)와 파일이 겹치지 않는다**(파트 0-(1)). 순서 무관.

### 커밋 10 — `fix: 선·산점도의 x값과 y축 0 강제 (ER1, ER6, V1)`
- `lib/chartGeometry.ts` — `yRange`·`resolveXAxis`·`layoutXY` 추가
- `components/SimpleChart.tsx` — `:64-77`, `:285-323`, `:391-395`, `:133`
- `content/guide/05-writing.mdx:76` (V1)
- `lib/__tests__/chartGeometry.test.ts` 12건, `components/__tests__/SimpleChart.test.tsx` 5건
- **커밋 9 뒤.** 같은 파일(`chartGeometry.ts`)이고 `parsePairs` 반환을 `layoutXY`가 받는다.
- **작업 순서**: `layoutXY` 좌표 테스트를 먼저 써서 종전 `xForIndex` 값(`242.67`)과 다름을 눈으로 확인한 뒤 컴포넌트를 바꾼다. 커밋 메시지에 `[56, 242.67, 429.33, 616] → [56, 112, 560, 616]`을 인용.
- **이유**: ER1과 ER6은 같은 렌더 블록(`:285-323`)을 재작성하므로 쪼개면 같은 30줄을 두 번 만진다. V1은 "글과 코드가 같은 오해"(백로그 패턴 2)라 코드와 한 커밋.

### 커밋 11 — `fix: 검색 실패 시 직전 결과가 화면에 남던 문제 (ER3)`
- `components/PriorResearchSearch.tsx:62`, `:187`
- `components/__tests__/PriorResearchSearch.test.tsx` 3건
- K2(커밋 4)와 같은 파일, 다른 hunk. **커밋 4 뒤에 리베이스** 권장.

### 커밋 12 — `fix: 사례 공유 mailto 길이를 인코딩된 URL로 잰다 (ER4)`
- `components/ResearchShowcaseForm.tsx:45-47`, `:76-77`, `:90-92`
- `components/__tests__/ResearchShowcaseForm.test.tsx` 신설 4건
- 독립. 상한값은 파트 5-2.

### 커밋 13 — `fix: 설계 유형 퀴즈가 완전 동점을 판별한 척하던 문제 (ER5)`
- `components/ResearchDesignQuiz.tsx:176-182`, `:226-266`
- `components/__tests__/ResearchDesignQuiz.test.tsx` 신설 5건
- 독립.

### 커밋 14 — `fix: 전체 삭제가 실패를 삼키지 않고, 내보내기 범위를 정직하게 말한다 (ER7, ER8, S3-DataReset·PlanExport)`
- `components/DataReset.tsx` 전면, `components/PlanExport.tsx:21`(export)·`:78-84`
- `components/__tests__/DataReset.test.tsx` 신설 8건, `components/__tests__/PlanExport.test.tsx` 신설 6건
- batch0 S3가 커밋을 배정하지 않았던 DataReset·PlanExport 테스트를 여기서 닫는다. `PlanBackup`은 건드리지 않으므로 K1(커밋 3)과 독립.
- reload 스파이가 jsdom 30에서 안 되면 해당 2건 `it.skip` + 사유(파트 5-3).

### 커밋 15 — `fix: 저장값 형태를 initial 기준으로 되살린다 — 손상 백업이 페이지를 죽이지 않게 (SC3)`
- `lib/usePersistentState.ts` — `reconcile` 추가, `:50-52`
- `lib/__tests__/usePersistentState.test.tsx` 10건 추가
- 독립. 15개 도구가 이 훅을 쓰므로 **전체 테스트 초록 확인 필수**(특히 `SimpleChart`·`StatsCalculator`·`RandomSampler`·`SampleSizeCalculator` 테스트가 `localStorage.clear()` 후 initial을 읽는 경로).
- **선행 확인**: 파트 3 SC3 함정 1(initial의 null 필드 grep).

### 커밋 16 — `fix: 사례 본문을 md 포맷으로 컴파일해 raw HTML·JSX를 실행하지 않는다 (SC1)`
- `lib/showcaseMdx.ts` 신설, `app/showcase/[slug]/page.tsx:85-90`
- `lib/__tests__/showcaseMdx.test.ts` 신설 6건
- 독립. T7·M6과 **분리**(파트 3 SC1 함정 4).

### 커밋 17 — `docs: 개인정보처리방침에 Crossref(영국) 전달 명시 (SC4)`
- `app/privacy/page.tsx:72-75`, `:105-106`, `:113`
- 방지선 1건은 T6(`routes.test.ts`)이 있으면 거기, 없으면 `searchChain.test.ts`
- **묶음 0.5(애드센스 방어)와 함께 즉시 내보낼 수 있다.** 코드 의존 0.

### 커밋 18 — `refactor: 애드센스 ID를 lib/site.ts 한 곳으로, 슬롯 스위치는 별도 변수로 (BR4)`
- `lib/site.ts`, `app/layout.tsx:7,:10`, `components/AdSlot.tsx`, `.env.example`, `README.md`
- `lib/__tests__/site.test.ts` 신설 4건, `components/__tests__/AdSlot.test.tsx` 신설 2건
- **O5(batch05 C7) 앞.** `layout.tsx` 인접 줄.
- **배포 전 Vercel 환경변수 확인**(파트 5-4).

### 순서 요약
```
9 → 10                          (chartGeometry.ts 직렬)
4(K2) → 11                      (같은 파일, 권장)
12 · 13 · 14 · 15 · 16 · 17     서로 독립, 병렬 가능
18 → batch05 C7(O5)             (layout.tsx)
```
`SimpleChart.tsx`를 만지는 다른 설계와의 순서: **10 → batch06 C3(O3·O4)** — O3의 14행 치환표는 `:285-323`이 재작성된 뒤 줄 번호를 다시 잰다(색 속성의 **집합**은 그대로 14곳이다: 격자 3·눈금 3·라벨 3·축제목 2·배경 2·범례 1). **10 → 묶음 6 B2** — `yRange`에 오차 배열 인자를 더하는 형태로. K3와는 무관.

---

# 파트 5 — 불확실한 지점

1. **ER1 — x 라벨 겹침.** 수치 x에서 라벨을 점 위치마다 찍으므로 촘촘한 x는 겹친다. y처럼 5분할 눈금으로 바꾸는 것은 새 기능이라 뺐다. 겹침이 심하면 후속 항목으로.
2. **ER4 — 상한 `2000`.** mailto 핸들러 실측이 아니다. 인코딩 한글 약 200자라 버튼이 자주 숨는다. Outlook·Apple Mail·Gmail에서 실측한 뒤 상수만 조정. **구현 시 판단 필요.** 테스트 4번의 `1900`도 접두 길이 실측 후 맞춘다.
3. **ER8 — `window.location.reload` 스파이.** batch0 파트 5-6과 같은 미확인. `defineProperty` 방식 실패 시 2건 skip.
4. **BR4 — Vercel의 기존 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`.** 설정돼 있으면 이 커밋으로 슬롯이 꺼진다. 대시보드에서 확인하고 새 이름으로 옮긴다.
5. **SC3 — initial에 null 필드가 있는 도구.** 이번에 읽은 9개 객체 initial에는 없지만 15개 전부를 열지는 않았다. `reconcile` 첫 줄에 null-initial 분기를 넣을지 grep 후 결정.
6. **SC1 — `SHOWCASE_MDX_OPTIONS`의 타입.** `remarkPlugins` 튜플이 `SerializeOptions`와 안 맞으면 `as const`·`satisfies` 조정. 동작에는 영향 없다.
7. **SC4 — 방침 개정일.** `:1-40`을 안 읽었다. 시행일 표기가 있으면 갱신.
8. **ER5 — "이(가)" 조사.** 접전 유형 목록의 마지막 단어로 `josa`를 부른다. `"모델 구현"`이 마지막이면 "모델 구현이", `"설문조사"`면 "설문조사가". `lib/korean.ts:31-36`의 `josa(word, [받침, 무받침])` 시그니처 확인함.
