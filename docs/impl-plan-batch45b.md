# 구현 설계 — 묶음 4.5b: 라운드 17 대비·키보드·실측 30건

범위: `docs/backlog-index.md` 라운드 17 절의 **AC1~AC14 · KB1~KB13 · BR1 BR2**.
형식은 `docs/impl-plan-batch3.md`를 따른다. 모든 색 비율은 WCAG 2.x 상대휘도 공식으로
**직접 계산했다**(스크립트 결과를 그대로 옮김, 소수 둘째 자리 반올림).

전제가 되는 다른 설계와의 관계:

- **`docs/impl-plan-batch06.md` O3(차트 색 토큰화 + 내보내기 치환)**를 그대로 전제한다.
  AC13은 O3 자체이고, AC2·AA1·O4는 O3의 `--chart-*` 토큰에 **값만** 넣는다.
  단, **O4가 정한 다크 8색은 폐기한다**(아래 정정 4).
- **`docs/impl-plan-batch3.md` 묶음 4.5(L5 M1 M2 M3)와 파일이 겹치는 곳**은 KB2·KB4 둘뿐이다
  (파트 3 순서 표 참조).

---

## 0. 백로그·기존 설계 판정 정정 — 착수 전에 읽을 것 (9건)

| # | 항목 | 주장 | 실제 | 결과 |
| --- | --- | --- | --- | --- |
| 1 | AC1 | `#8e9296`이 3.05:1 | **3.13**(대 `--bg`). 그러나 대 `--surface` `#f7f7f8`는 **2.93** — 입력이 `note-box`(surface) 안에도 놓인다(`ReflectionBox:85`) | 후보 탈락. `#85898d`(3.52 / 3.29) 채택 |
| 2 | AC4 | `disabled:opacity-50` 라벨 1.97:1 (8곳) | 테두리형 3곳(`text-ink-soft`)은 **1.99**. 채움형 5곳(`bg-ink text-bg`)은 흰 글자가 `#8b8c8c` 위에 놓여 **3.37** — 실패 종류가 다르다(텍스트 4.5 미달이지 "안 읽힘"은 아님) | 처방은 같다(토큰). 숫자만 정정 |
| 3 | AC13 | 색 리터럴 13곳 | hex 리터럴 **12곳**(`:231 232 248 266 267 277 292 293 318 326 331 372`) + `fill="white"` **2곳**(`:221 355`) = 속성 14개. batch06 O3의 치환표 14행과 일치 | AC13 = O3. 별도 작업 없음 |
| 4 | batch06 O4 | 다크 8색이 "전부 통과" | 배경 대비만 통과. **인접 인덱스 상호 대비 1.04~1.66**(C2↔C3 1.04, C4↔C5 1.05, C6↔C7 1.05, C8↔C1 1.06). AC2의 요구(≥1.8)를 전부 미달 | **O4 값 폐기**, 이 문서의 파트 2-B로 대체 |
| 5 | AC11 | 포커스 링이 `bg-ink`에 인접해 2.97 | 2.97은 맞다(`#2f6f4f`↔`#17181a`). 그러나 전역 링은 `outline-offset: 2px`라 **링과 요소 사이 2px가 페이지 배경색**이다 — 인접색은 `--bg`(5.99)지 ink가 아니다. `outline-offset-[-2px]`로 안쪽에 그리는 5곳(`SiteNav:23` `StageRail:154,209` `StageTools:169` `articles/page:69`)은 **어느 곳도 `bg-ink`가 아니다** | **문제 없음.** 코드 변경 0 |
| 6 | KB7 · AC4 | "8곳(6곳 겹침)" | `disabled=` 버튼은 **9곳**: 입력 게이트 7 + 로딩 게이트 2(`PriorResearchSearch:120,140` = KB2). AC4의 8 = 입력 게이트 6 + 로딩 2(`opacity-50`). **`ResearchShowcaseForm:249`(`opacity-40`, `!ready`)는 어느 쪽 집계에도 없다** | 7번째 입력 게이트는 같은 파일의 AC5+KB6 커밋에 넣는다 |
| 7 | AC3 | 4단계 상호 1.45~2.30 | 현재 `bg-surface / accent@.3 / accent@.6 / accent` = **1.54 / 1.65 / 2.20**, 레벨0 대 bg 1.07 | 방향 맞음. 숫자만 정정 |
| 8 | AC7 | 라이트만 언급 | 다크도 `#f87171`↔`#93989e` = **1.05** | 처방(비색 단서)이 양쪽에 필요하다는 근거 보강 |
| 9 | KB2 | "`aria-busy`로 바꾸면 테스트가 깨지나" | `PriorResearchSearch.test.tsx`는 클릭 **전**에만 `getByRole("button", { name: "검색" })`을 잡고, 로딩 중 버튼 상태를 단언하지 않는다. `disabled`를 떼도 세 테스트 전부 그대로 통과 | 안 깨진다. 단, `aria-busy`는 잘못된 속성이다(아래 KB2 판단) |

그리고 **AC14는 백로그대로 "문제 없음"이다** — `SiteFooter`·`AdSlot`은 확인만 했고 코드 변경이 없다.

---

## 1. 토큰 설계 — `app/globals.css`

### 판단 — 새 토큰 몇 개를 만드나

**4개 + 차트 8개 + 히트맵 3개.** 이유를 하나씩:

| 토큰 | 만드는 이유 | 안 만드는 대안을 버린 이유 |
| --- | --- | --- |
| `--line-strong` | 입력 테두리(47곳)와 히트맵 칸 테두리는 **정보를 나르는 경계**라 3:1이 필요하다 | `--line` 자체를 3:1로 올리면 카드·구분선·`divide-line` 전부가 굵어 보인다. 장식 경계와 정보 경계는 다른 토큰이어야 한다 |
| `--disabled-bg` `--disabled-ink` | `opacity`는 배경까지 같이 옅어져 라벨 대비가 무너진다. 비활성을 **명시 색**으로 그려야 라벨이 읽힌다 | `text-ink-soft`만 쓰면 활성 테두리형 버튼과 구분이 안 된다. 배경을 함께 바꿔야 "눌리지 않는 상태"가 보인다 |
| `--danger` 라이트값 변경 | AC6 — `--surface` 위 4.51은 여유 0.01 | 새 토큰이 아니라 값 교체 |
| `--heat-1..3` | 알파 합성(`bg-accent/30`)은 밑색에 따라 값이 흔들려 계산으로 잠글 수 없다 | Tailwind 임의값(`bg-[#52bd88]`)은 다크 분기를 컴포넌트에 떠넘긴다 |
| `--chart-1..8` | batch06 O3이 이미 만든 토큰. 여기서는 값만 | — |

**`--line`은 바꾸지 않는다**(AC8 판단, 파트 2-A). `--focus`류 토큰도 만들지 않는다(AC11 문제 없음).

### 값 표 — 라이트·다크 전부 계산

기준색: 라이트 `--bg #ffffff` `--surface #f7f7f8` · 다크 `--bg #101113` `--surface #17181b`.

| 토큰 | 라이트 | 대 bg | 대 surface | 다크 | 대 bg | 대 surface | 요구 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `--line-strong` | `#85898d` | 3.52 | 3.29 | `#666b72` | 3.52 | 3.31 | ≥3.0 양쪽 |
| `--disabled-bg` | `#e6e7e9` | 1.24 | 1.16 | `#2a2c2f` | 1.35 | 1.27 | 구분만(비텍스트 예외) |
| `--disabled-ink` | `#5f646a` | 5.97 | — | `#9da2a8` | — | — | — |
| `--disabled-ink` 대 `--disabled-bg` | | **4.82** | | | **5.45** | | ≥4.5 |
| `--danger` | `#cf1f1f` (변경) | 5.43 | 5.07 | `#f87171` (유지) | 6.83 | 6.42 | ≥4.5 양쪽 |
| `--heat-1` | `#52bd88` | 2.34 | 2.18 | `#1e5037` | 2.03 | 1.91 | 인접 단계 ≥1.8 |
| `--heat-2` | `#32845b` | 4.58 | — | `#318059` | 3.92 | — | |
| `--heat-3` | `#20543a` | 8.78 | — | `#52bd88` | 8.09 | — | |
| 히트맵 인접(0→1, 1→2, 2→3) | | **2.18 / 1.96 / 1.92** | | | **1.91 / 1.93 / 2.06** | | ≥1.8 |

주의 두 가지:

- `--disabled-bg` 라이트가 `--line`과 우연히 같은 값이다. **`var(--line)`으로 묶지 마라** — `--line`을 나중에 올리면
  비활성 배경까지 딸려간다. 리터럴로 둔다.
- 다크 `--heat-3 = #52bd88`은 `--accent`(`#4fa377`)보다 밝다(1.32:1 차이). 범위를 넓혀야 세 단계가 전부 1.9를
  넘긴다. 라이트 `--heat-3 = #20543a`도 `--accent`(`#2f6f4f`)보다 어둡다. **히트맵은 accent와 같은 색이 아니어도 된다.**

### 차트 팔레트 8색 (AC2 + AA1 + O4 + AC9)

제약: 배경 대비 ≥3:1 **그리고** 인접 인덱스 ≥1.8:1. 원형·도넛은 마지막 조각이 첫 조각과 맞닿으므로
**C8↔C1도 인접**이다. 색상(hue) 순서는 기존과 같다 — 초록·파랑·주황·보라·자홍·노랑·청록·회색.

설계 원리: 휘도를 4단 순환(어둡·밝·중·밝…)으로 벌린다. 두 단만 쓰면 인접은 넘기지만
비인접 절반이 1.00이 된다.

**라이트** (대 `#ffffff`):

| 토큰 | 값 | L | 대 bg | 대 다음(→) |
| --- | --- | --- | --- | --- |
| `--chart-1` | `#1c5438` | 0.069 | 8.84 | →C2 2.62 |
| `--chart-2` | `#5290cd` | 0.261 | 3.37 | →C3 2.08 |
| `--chart-3` | `#804d20` | 0.100 | 7.00 | →C4 2.19 |
| `--chart-4` | `#a77fcf` | 0.279 | 3.19 | →C5 2.99 |
| `--chart-5` | `#7d2442` | 0.060 | 9.53 | →C6 2.45 |
| `--chart-6` | `#8d8314` | 0.219 | 3.90 | →C7 1.92 |
| `--chart-7` | `#1b5e5e` | 0.090 | 7.48 | →C8 2.37 |
| `--chart-8` | `#919191` | 0.283 | 3.15 | →C1 2.81 |

최소: 대 bg **3.15**, 인접 **1.92**. AA1(`#b8a020` 2.60, `#4ab8b0` 2.39) 해소.

**다크** (대 `#101113`):

| 토큰 | 값 | L | 대 bg | 대 다음(→) |
| --- | --- | --- | --- | --- |
| `--chart-1` | `#4fa377` | 0.292 | 6.15 | →C2 1.97 |
| `--chart-2` | `#2965a2` | 0.124 | 3.13 | →C3 3.15 |
| `--chart-3` | `#e5b184` | 0.498 | 9.85 | →C4 2.20 |
| `--chart-4` | `#9961d1` | 0.199 | 4.48 | →C5 2.60 |
| `--chart-5` | `#efbecf` | 0.597 | 11.64 | →C6 3.62 |
| `--chart-6` | `#6e6613` | 0.129 | 3.21 | →C7 2.54 |
| `--chart-7` | `#36bcbc` | 0.404 | 8.16 | →C8 2.60 |
| `--chart-8` | `#636363` | 0.125 | 3.14 | →C1 1.96 |

최소: 대 bg **3.13**, 인접 **1.96**. 다크 C1은 다크 `--accent`와 같다(batch06의 관계 유지).
**라이트 C1은 `--accent`와 더 이상 같지 않다**(`#2f6f4f`를 쓰면 C8↔C1 wrap이 1.39로 깨진다).

함정 — 이 팔레트의 성격:

- 라이트 C3(`#804d20`)은 주황이 아니라 **갈색**, C6(`#8d8314`)은 **올리브**, 다크 C6은 어두운 올리브다.
  3:1 + 인접 1.8을 동시에 만족하면 "선명한 주황·노랑"은 수학적으로 불가능하다(밝은 노랑은 흰 배경에서 2.4를 못 넘는다).
  **구현 시 hue 순서를 바꿔도 된다** — 테스트는 값이 아니라 제약을 잠근다.
- 비인접 쌍 몇은 여전히 1.0대다(라이트 C4↔C8 1.01, 다크 C2↔C8 1.01). 인접이 아니라 요구 밖이지만,
  범례 없이 색만으로 8계열을 구분하는 것은 어떤 팔레트로도 불가능하다. 백로그 AC2의 "패턴·마커를 2차 단서로"는
  **이번 범위에 넣지 않는다**(O3·TQ5가 SVG 구조를 건드리는 중이라 충돌).
- **AC9는 자동 해소된다** — `components/`에서 차트 색을 **텍스트에 쓰는 곳은 0곳**이다(grep `#4a90c2` 등 → `SimpleChart.tsx`뿐,
  전부 `fill`/`stroke`). 텍스트 4.5 기준은 적용 대상이 없다.
- `lib/chartExport.ts`의 `CHART_EXPORT_COLORS`(batch06)는 **라이트 표의 값으로** 채운다. 배포된 그림 색이 바뀐다 — AA1이 이미 경고한 사항.

### 변경 후 코드 — `app/globals.css`

**(1) `:root` 블록**, `--danger: #dc2626;`(`:15`) 줄을 교체하고 그 뒤에 추가. 기존 주석(`:12-14`)도 갱신:

```css
  /* 오류 문구 색 — 라이트/다크에서 각각 AA(4.5:1)를 넘겨야 해서 토큰으로 둔다.
     text-xs로 쓰이므로 큰 글씨 예외(3:1)를 적용할 수 없다.
     --bg뿐 아니라 --surface 위에도 놓인다(note-box 안의 오류 문구).
     라이트 #cf1f1f 대 --bg #ffffff = 5.43:1, 대 --surface #f7f7f8 = 5.07:1
     (이전 #dc2626은 surface 위에서 4.51 — 여유 0.01이라 surface를 한 단계만 어둡게 해도 깨졌다) */
  --danger: #cf1f1f;
  /* 정보를 나르는 경계 — 입력 테두리, 히트맵 칸 테두리. 비텍스트 3:1(WCAG 1.4.11).
     --line은 카드·구분선 같은 장식 경계에만 쓴다(1.24:1, 요구 없음).
     #85898d 대 --bg 3.52, 대 --surface 3.29 — 입력은 note-box(surface) 안에도 놓인다 */
  --line-strong: #85898d;
  /* 비활성 버튼 — opacity 대신 명시 색. 라벨이 읽혀야 "왜 못 누르는지"를 읽을 수 있다.
     --disabled-ink 대 --disabled-bg = 4.82. --line과 값이 같지만 묶지 않는다(독립 변경) */
  --disabled-bg: #e6e7e9;
  --disabled-ink: #5f646a;
  /* 활동 히트맵 3단계 — 인접 단계끼리 1.8:1 이상(surface→1 2.18, 1→2 1.96, 2→3 1.92).
     알파 합성(bg-accent/30)은 밑색에 따라 흔들려 계산으로 잠글 수 없어 명시 색으로 둔다 */
  --heat-1: #52bd88;
  --heat-2: #32845b;
  --heat-3: #20543a;
```

`--chart-1..8`은 batch06 O3이 넣는 자리에 **라이트 표의 값**을 넣는다.

**(2) `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {` 블록**과 **(3) `:root[data-theme="dark"]` 블록** —
**두 곳 모두, 같은 값으로**:

```css
    --line-strong: #666b72; /* 대 #101113 3.52, 대 #17181b 3.31 */
    --disabled-bg: #2a2c2f;
    --disabled-ink: #9da2a8; /* 대 --disabled-bg 5.45 */
    --heat-1: #1e5037; /* surface→1 1.91, 1→2 1.93, 2→3 2.06 */
    --heat-2: #318059;
    --heat-3: #52bd88;
```

`--chart-1..8` 다크 값도 두 블록 모두에(다크 표).

**(4) `@theme inline` 블록**(`:24-36`)에 추가 — 이게 없으면 `border-line-strong` 같은 유틸리티가 생성되지 않는다:

```css
  --color-line-strong: var(--line-strong);
  --color-disabled-bg: var(--disabled-bg);
  --color-disabled-ink: var(--disabled-ink);
  --color-heat-1: var(--heat-1);
  --color-heat-2: var(--heat-2);
  --color-heat-3: var(--heat-3);
```

`--chart-*`는 SVG 속성에서 `var()`로 직접 쓰므로 `@theme`에 넣지 않는다(O3 결정 유지).

### 함정

- **다크 블록 두 곳 중 한쪽만 고치는 실수** — batch06 O2의 "두 다크 블록 선언 이름 집합 일치" 테스트가 잡는다.
  그 테스트가 아직 없다면 이 묶음의 `tokens.test.ts`(파트 4)가 같은 단언을 갖는다.
- Tailwind v4에서 `@theme inline`의 `--color-*`가 없는 이름은 **조용히 클래스가 안 나온다**(빌드 오류 없음).
  구현 후 `border-line-strong`이 실제 CSS 출력에 있는지 `.next` 산출물이나 devtools로 확인.
- `--danger` 값 변경은 `globals.css:60`(`:root[data-theme="dark"]`)의 주석 "6.83"과 무관하다(다크는 유지).

### 테스트 — `lib/__tests__/tokens.test.ts` (신규, node) + `lib/__tests__/support/wcag.ts` (헬퍼)

**대비는 CSS 파싱 + 계산 테스트로 잠글 수 있다.** 이유: 토큰이 전부 `globals.css`의 세 블록에 hex 리터럴로 있고,
jsdom이 필요 없다. `fs.readFileSync("app/globals.css")` → 블록별 `--name: value;` 파싱 → 상대휘도.

`support/wcag.ts`(vitest는 `*.test.*`만 수집하므로 헬퍼는 실행되지 않는다):

```ts
export function relativeLuminance(hex: string): number   // #rrggbb → 0..1
export function contrastRatio(a: string, b: string): number
export type TokenBlocks = { light: Record<string,string>; darkMedia: Record<string,string>; darkAttr: Record<string,string> };
export function parseGlobalsTokens(css: string): TokenBlocks
// light = ":root {" 첫 블록, darkMedia = "@media (prefers-color-scheme: dark)" 안의 :root:not(...) 블록,
// darkAttr = ':root[data-theme="dark"]' 블록. var(--x) 참조는 같은 블록→light 순으로 푼다.
```

batch06 O3/O4 테스트도 같은 파서를 쓴다고 명시했으므로 **그쪽 구현이 먼저 들어와 있으면 이 헬퍼로 옮긴다.**

`tokens.test.ts`:

| `it()` | 검증 |
| --- | --- |
| `"라이트·다크 --line-strong이 --bg와 --surface 양쪽에 3:1 이상이다"` | 4개 비율 ≥3.0. 실패 메시지에 값과 비율 |
| `"--disabled-ink가 --disabled-bg 위에서 4.5:1 이상이다 (라이트·다크)"` | ≥4.5 |
| `"--danger가 --bg·--surface 양쪽에 4.5:1 이상이다 (라이트·다크)"` | **AC6 회귀선** — surface를 어둡게 하면 여기서 터진다 |
| `"히트맵 surface→heat-1→2→3 인접 단계가 1.8:1 이상이다 (라이트·다크)"` | 6개 비율 |
| `"차트 8색이 --bg 대비 3:1 이상이다 (라이트·다크)"` | 16개 |
| `"차트 인접 인덱스(C8↔C1 포함)가 1.8:1 이상이다 (라이트·다크)"` | 16쌍 — **AC2 회귀선** |
| `"두 다크 블록의 토큰 이름 집합과 값이 같다"` | `darkMedia`와 `darkAttr` 전체 비교(`--chart-*` `--heat-*` 포함) |
| `"@theme inline이 새 토큰 6개를 노출한다"` | `--color-line-strong` 등 6개 문자열 존재 — 유틸리티가 안 나오는 조용한 실패 방지 |
| `"토큰 값이 전부 #rrggbb 리터럴이거나 var() 참조다"` | 파서가 못 읽는 형식(`rgb()` 등)이 들어오면 위 테스트가 헛통과하므로 |

---

## 2-A. 대비 — 항목별

### AC1. 입력 테두리 1.24:1 — 47곳 `M`

**위치 (실측)**: `border border-line bg-bg`가 18개 파일 47곳. 파일별: `CitationFormatter` 8 · `SampleSizeCalculator` 5 · `SimpleChart` 5 ·
`FigureCaptionHelper` 4 · `ObjectiveTemplateGenerator` 4 · `VariableTableBuilder` 3 · `DeadlineTracker` `DisclosureGenerator` `RandomSampler`
`ResearchShowcaseForm` `StatsCalculator` 각 2 · `AcademicPhrases` `ImradChecker` `LengthChecker` `PriorResearchSearch` `ReflectionBox`
`SpeechTimer` `SurveyBiasChecker` 각 1.

**단, 47곳이 전부 입력은 아니다.** `SimpleChart:212`의 `<div className="overflow-x-auto rounded-lg border border-line bg-bg p-2">`는
차트를 감싸는 **장식 상자**다. 나머지 46곳(`<input>` `<textarea>` `<select>`)만 바꾼다.

**변경**: 46곳에서 `border-line` → `border-line-strong`. 한 줄 sed로 끝나지만 `SimpleChart:212`를 제외해야 하므로
**`<input|<textarea|<select` 태그 안의 className에서만** 치환한다. `focus:border-accent`는 그대로.

**함정**:
- `focus:border-accent`(`#2f6f4f`, 대 bg 5.99)는 이미 3:1을 넘으므로 손대지 않는다.
- G7(batch3 커밋 4)이 `VariableTableBuilder:57-98`을 통째로 바꾼다. 그 코드도 `border-line bg-bg` 3곳을 쓴다 —
  **G7이 먼저 들어가면 그 뒤에 치환**, 아니면 G7 코드를 넣을 때 `line-strong`으로 넣는다.
- M2(batch3 커밋 12)가 `PriorResearchSearch:108-116` 입력에 `id`·`aria-describedby`를 붙인다. 같은 줄이지만 다른 속성 — 텍스트 충돌만 있고 의미 충돌 없음.

**테스트** — `components/__tests__/InputBorders.test.tsx`(신규, jsdom)는 만들지 **않는다.** 대신 `lib/__tests__/tokens.test.ts`에:

| `it()` | 검증 |
| --- | --- |
| `"입력 요소의 className에 border-line(강조 아님)이 남아 있지 않다"` | `components/*.tsx`를 읽어 `<input`/`<textarea`/`<select` 여는 태그 안의 `className="…"`에 `\bborder-line\b`(뒤에 `-strong`이 아닌)이 0회. 정규식은 여는 태그 전체(`/<(input|textarea|select)\b[^>]*>/gs`)를 잡는다 |

이건 소스 grep 테스트다 — jsdom 렌더보다 싸고 47곳을 사람이 세지 않게 한다.

### AC2 · AA1 · O4 · AC9. 차트 팔레트 — 파트 1의 표대로. 한 커밋.

**위치**: `app/globals.css`(세 블록), `lib/chartExport.ts`(`CHART_EXPORT_COLORS`, batch06이 신설), `components/SimpleChart.tsx`(변경 없음 — O3 이후 `var(--chart-N)` 참조).

**테스트**: 파트 1의 `tokens.test.ts` 2건 + batch06 `chartExport.test.ts`의 "`CHART_EXPORT_COLORS` = `:root` 값" 단언이 라이트 표를 잠근다.
batch06 O4의 테스트 `"다크 팔레트 8색이 다크 --bg 대비 3:1 이상"`은 유지하되 값이 바뀌므로 통과 여부만 확인.

### AC3. 히트맵 — batch3 커밋 7(G3·L4)에 합류

batch3 `impl-plan-batch3.md:966-973`이 `ActivityHeatmap` 전체 교체 코드를 갖고 있고 거기서 `LEGEND_LEVELS`·`levelFor`를
**지금과 같은 알파 클래스로** 옮겨 놓았다. 그 코드에서 두 상수만 바꾼다:

```tsx
// 범례 스와치 — levelFor의 4단계와 같은 순서.
// 레벨0(surface)이 배경과 1.07:1이라 격자가 안 보였다 — 모든 칸에 --line-strong 테두리를 두어
// 칸 자체가 보이게 하고, 1~3단계는 인접끼리 1.8:1 이상 벌어진 명시 색을 쓴다(globals.css --heat-*).
const LEGEND_LEVELS = ["bg-surface", "bg-heat-1", "bg-heat-2", "bg-heat-3"];

function levelFor(count: number): string {
  if (count <= 0) return "bg-surface";
  if (count === 1) return "bg-heat-1";
  if (count <= 3) return "bg-heat-2";
  return "bg-heat-3";
}
```

칸(`batch3:1062`)과 범례 스와치(`:1094`)의 클래스 `h-3 w-3 rounded-sm` → `h-3 w-3 rounded-sm border border-line-strong`.

**함정**: 12×12px 칸에 1px 테두리가 붙으면 내부 색 면적은 10×10이다. `gap-1`(4px)은 유지 — 줄이면 테두리끼리 붙어 격자가 표로 보인다.
`box-sizing`은 Tailwind preflight가 `border-box`라 칸 크기는 그대로다.

**테스트** — batch3의 `ActivityHeatmap.test.tsx`에 1건 추가:

| `it()` | 검증 |
| --- | --- |
| `"0건 칸도 테두리 클래스를 가져 격자가 유지된다"` | 활동 0건 날짜의 칸이 `border-line-strong`을 포함 |

### AC4 + KB7. disabled 6곳 → `aria-disabled` + 명시 토큰 (한 커밋)

**대상 6곳과 각각의 게이트·핸들러 (실측)**:

| 파일:줄 | 게이트 | 핸들러가 스스로 막는가 | 힌트 문구가 이미 있는가 |
| --- | --- | --- | --- |
| `FigureCaptionHelper:133-134` | `!checkText.trim()` | **아니오** — `() => setChecked(true)` | 없음 |
| `ImradChecker:140-141` | `!text.trim()` | **아니오** | 없음 |
| `ObjectiveTemplateGenerator:141-142` | `!sentence` | 확인 필요(`copy`) | **있음** — `:132` "빈칸을 채우면 여기에 문장이 완성됩니다." (라이브 영역 안) |
| `RandomSampler:93-94` | `items.length === 0` | 확인 필요(`draw`) | 없음 |
| `SurveyBiasChecker:69-70` | `lines.length === 0` | **아니오** | 없음 |
| `VariableTableBuilder:111-112` | `filled.length === 0` | **예** — `copyTable`이 `if (filled.length === 0) return;` | 없음 |

**공통 패턴** (붙여넣을 수준):

```tsx
        <button
          type="button"
          // disabled 대신 aria-disabled — disabled는 탭 순서에서 빠져 "왜 못 누르는지"를 들을 기회 자체가 없다.
          // 눌리지 않는 이유는 aria-describedby가 가리키는 힌트가 말한다. 클릭은 핸들러가 막는다.
          aria-disabled={!canRun || undefined}
          aria-describedby={canRun ? undefined : "imrad-check-hint"}
          onClick={() => { if (!canRun) return; setChecked(true); }}
          className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-ink aria-disabled:hover:opacity-100"
        >
          구조 점검하기
        </button>
        {!canRun && (
          <p id="imrad-check-hint" className="mt-2 text-xs text-ink-soft">
            초고를 붙여넣으면 점검할 수 있습니다.
          </p>
        )}
```

- `canRun`은 각 파일의 기존 게이트 부정: `const canRun = text.trim().length > 0;` 등.
- **테두리형 3곳**(`FigureCaptionHelper` `ObjectiveTemplateGenerator`, 그리고 KB2의 칩)은 `bg-disabled-bg`가 아니라
  `aria-disabled:border-transparent aria-disabled:bg-disabled-bg aria-disabled:text-disabled-ink`. 테두리를 지워야 활성 테두리형과 구분된다.
- 힌트 문구는 **파일마다 한 문장** — 백로그 KB7이 "규칙이 문장으로 없다"고 한 지점이다:

| 파일 | id | 문구 |
| --- | --- | --- |
| `FigureCaptionHelper` | `caption-check-hint` | "제목을 입력하면 확인할 수 있습니다." |
| `ImradChecker` | `imrad-check-hint` | "초고를 붙여넣으면 점검할 수 있습니다." |
| `ObjectiveTemplateGenerator` | (기존 `:132` 문단에 `id="objective-sentence-hint"`) | 문구 변경 없음 |
| `RandomSampler` | `sampler-draw-hint` | "명단을 입력하면 추첨할 수 있습니다." |
| `SurveyBiasChecker` | `survey-check-hint` | "문항을 입력하면 점검할 수 있습니다." |
| `VariableTableBuilder` | `variable-copy-hint` | "변수명을 하나 이상 적으면 복사할 수 있습니다." |

**함정**:
- `aria-disabled={false}`를 렌더하지 마라(`|| undefined`). 배치3 M2의 `aria-invalid`와 같은 이유.
- `aria-describedby`가 가리키는 힌트는 **조건부 렌더**다. `canRun`이 참이면 둘 다 사라지므로 죽은 참조가 생기지 않는다 — 조건을 같은 변수로 써야 한다.
- `ObjectiveTemplateGenerator:132`의 힌트는 `aria-live` 영역 안이다. `id`만 붙이므로 낭독 동작은 그대로.
- Tailwind v4는 `aria-disabled:` 변형을 기본 제공한다(`aria-checked/disabled/expanded/hidden/pressed/readonly/required/selected`). 설정 불필요.
- `hover:opacity-85`가 비활성에도 먹는다 → `aria-disabled:hover:opacity-100`으로 되돌린다. 순서: Tailwind v4는 변형 중첩을 `aria-disabled:hover:`로 쓴다.
- **`disabled` 속성을 완전히 뗀다.** 남겨두면 `aria-disabled`와 무관하게 포커스가 빠진다.
- `RandomSampler`·`ObjectiveTemplateGenerator`의 핸들러(`draw`·`copy`)가 빈 입력을 스스로 막는지 **구현 시 확인**. 안 막으면 `if (!canRun) return;`을 핸들러 첫 줄에.
- 묶음 4.5 M2와 **파일이 하나도 안 겹친다**(M2: `DeadlineTracker` `StatsCalculator` `PriorResearchSearch` `SampleSizeCalculator`). 순서 자유.
  M1(`TopicIdeaGenerator` `PresentationQuestionBank`)·L5(`ProgressOverview`)·M3(`GuideBlock`)과도 무관.

**테스트** — `components/__tests__/DisabledButtons.test.tsx`(신규, jsdom). 6개 컴포넌트를 한 파일에(`LiveRegions.test.tsx` 관례):

| `it()` | 검증 |
| --- | --- |
| `"입력이 비면 버튼이 aria-disabled이고 탭 순서에 남는다"` (×6, `describe.each`) | `button.getAttribute("aria-disabled") === "true"`, `button.hasAttribute("disabled") === false`, `button.tabIndex === 0` |
| `"aria-describedby가 가리키는 힌트가 DOM에 있다"` | `getElementById(button.getAttribute("aria-describedby"))` non-null — **죽은 참조 회귀선** |
| `"입력을 채우면 aria-disabled와 힌트가 함께 사라진다"` | 둘 다 `null` |
| `"비활성 상태에서 클릭해도 결과가 나오지 않는다"` | `ImradChecker`: 빈 상태 클릭 → 점검 결과 문구 없음. **핸들러 가드 회귀선** |

### AC5 + KB6. `ResearchShowcaseForm` — 메일 링크와 복사 버튼 (한 커밋, 같은 파일)

**위치**: `:246-252`(복사 버튼, `disabled={!ready}` + `opacity-40`) · `:254-266`(메일 `<a>`) · `:230-242`(라이브 영역의 힌트 문단 — 이미 있다:
"연구 주제와 연구질문을 채우면 보낼 내용이 여기에 만들어집니다.") · `:273-278`(`tooLongForMail` 안내).

**판단 — `<a>`를 어떻게 탭 순서에 남기나**: `href`를 **항상** 준다. 준비 전에는 `onClick`에서 `preventDefault`. `href={undefined}`는 포커스를 못 받고,
`href="#"`는 문서 맨 위로 튄다. `<button>`으로 바꾸면 준비된 뒤 `mailto:`를 `window.location`으로 열어야 해서 새 탭 동작·중간 클릭이 깨진다.

```tsx
      {/* 준비 전 문단(:239-241)에 id를 준다 — 버튼·링크의 aria-describedby 대상 */}
          <p id="showcase-ready-hint" className="text-sm text-ink-soft">
            연구 주제와 연구질문을 채우면 보낼 내용이 여기에 만들어집니다.
          </p>
      …
        <button
          type="button"
          onClick={() => { if (!ready) return; copy(); }}
          aria-disabled={!ready || undefined}
          aria-describedby={ready ? undefined : "showcase-ready-hint"}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-ink aria-disabled:hover:opacity-100"
        >
          복사하기
        </button>
        {/* 항상 렌더한다 — 긴 글을 쓰는 도중 탭 순서에서 예고 없이 빠지지 않게. 못 보내는 이유는 힌트가 말한다. */}
        <a
          href={mailHref}
          onClick={(e) => { if (!ready || tooLongForMail) e.preventDefault(); }}
          aria-disabled={!ready || tooLongForMail || undefined}
          aria-describedby={
            tooLongForMail ? "showcase-mail-too-long" : ready ? undefined : "showcase-ready-hint"
          }
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-disabled-bg aria-disabled:text-disabled-ink aria-disabled:hover:text-disabled-ink"
        >
          메일로 보내기
        </a>
      …
      {tooLongForMail && (
        <p id="showcase-mail-too-long" className="mt-3 text-xs leading-relaxed text-ink-soft">
          (기존 문구 그대로)
        </p>
      )}
```

**함정**:
- `mailHref`가 `ready === false`일 때 무엇인지(**구현 시 확인**: 빈 본문 `mailto:`인지 `""`인지). `""`이면 `href=""`는 현재 페이지 재로드다 —
  `preventDefault`가 막지만, `href={ready ? mailHref : "mailto:"}`처럼 무해한 값을 두는 편이 안전하다.
- `pointer-events-none`을 뗀다. 마우스 클릭도 `preventDefault`가 막는다. `pointer-events-none`은 키보드와 무관하고 커서 힌트(`not-allowed`)를 없앤다.
- `aria-disabled` 링크는 낭독기가 "사용 불가"로 읽지만 **Enter를 누르면 브라우저는 여전히 활성화한다** — 그래서 `preventDefault`가 필수다.
- 이 파일의 `<a>`에 `aria-disabled`가 이미 있었다(`:257`). 닿을 수 없는 요소에 붙어 있던 것을 닿게 만드는 것이 이 항목의 전부다.

**테스트** — `components/__tests__/ResearchShowcaseForm.test.tsx`(신규, jsdom):

| `it()` | 검증 |
| --- | --- |
| `"준비 전에도 메일 링크가 탭 순서에 있고 aria-disabled다"` | `getByRole("link", { name: "메일로 보내기" })`가 존재(hidden 아님), `aria-disabled="true"`, `tabIndex === 0` |
| `"준비 전 링크를 누르면 이동하지 않는다"` | `click` 이벤트의 `defaultPrevented === true`(`fireEvent.click` 반환값이 `false`) |
| `"준비되면 aria-disabled가 사라지고 href가 mailto다"` | 주제·질문 입력 후 `href`가 `mailto:`로 시작, `aria-disabled` 없음 |
| `"복사 버튼이 준비 전에 힌트 문단을 가리킨다"` | `aria-describedby === "showcase-ready-hint"`, 대상 존재 |

### AC6. `--danger` 라이트 → `#cf1f1f` — 파트 1. 테스트는 `tokens.test.ts`의 danger 행.

`#cf1f1f`↔`--ink-soft` = 1.09. AC7의 문제는 그대로다(색으로는 못 푼다).

### AC7. `ReflectionBox:87-97` — 실패를 색 말고 다른 단서로

```tsx
      <p
        aria-live="polite"
        className={`mt-1.5 text-xs ${status === "failed" ? "font-medium text-danger" : "text-ink-soft"}`}
        suppressHydrationWarning
      >
        {status === "failed"
          ? /* 색만으로 실패를 알리면 흑백 인쇄·색각이상에서 정상 문구와 같은 밝기다(danger↔ink-soft 1.03).
               접두어와 굵기가 색 없이도 실패를 말한다. */
            "저장 실패: 저장하지 못했습니다(프라이빗 모드나 저장 공간 부족일 수 있어요). 입력 내용은 이 화면을 벗어나면 사라집니다."
          : status === "saved"
            ? "이 기기에 자동저장됨"
            : "이 기기의 브라우저에만 저장됩니다"}
      </p>
```

아이콘은 넣지 않는다 — 접두어 "저장 실패:"가 낭독기에도 인쇄에도 같은 단서다.

**함정**: `ReflectionBox.test.tsx`가 실패 문구를 `getByText("저장하지 못했습니다…")` 정확 일치로 잡으면 깨진다 — **구현 시 grep**. 정규식(`/저장하지 못했습니다/`)이면 통과.

**테스트** — `ReflectionBox.test.tsx`에 1건: `"저장 실패 문구는 색 외의 단서(접두어·굵기)를 갖는다"` — 텍스트가 `저장 실패:`로 시작, className에 `font-medium`.

### AC8. 카드 경계 1.07 / 1.16 — **변경 없음**

`.card`(bg + `--line` 1.24) · `.note-box`(surface 1.07 + `--line` 1.16 대 surface). 둘 다 **묶음을 나타내는 장식 경계**다 —
내용 이해에 필요한 정보는 제목(`h2`)이 나른다. WCAG 1.4.11은 "내용 식별에 필요한" 그래픽에만 3:1을 요구한다.
`--line`을 올리는 대안(`#d0d3d6` 1.50 / 다크 `#35383c` 1.60)을 계산해 두었으나 **입력 테두리를 `--line-strong`으로 분리한 뒤에는 이유가 없다.**
운영자가 "카드가 안 보인다"고 판단하면 그때 `--line`만 올린다 — 이 문서는 값을 위 괄호에 남겨 둔다.

### AC10. area 채움 1.44 — **변경 없음**

`SimpleChart:299-305` `<polygon fill={COLORS[0]} opacity={0.25}>`. 영역 그래프의 경계는 **바로 뒤의 `<polyline strokeWidth={2}>`(`:306-313`)**가 3:1 이상(새 C1 8.84)으로 긋는다.
채움은 장식이다. 3:1로 올리려면 `opacity ≥ 0.8`이 필요한데(계산: C1 L 0.069 → 흰색과 혼합 후 L ≤ 0.30이려면 α ≥ 0.75) 그건 사실상 불투명 영역이다.
새 팔레트에서 채움은 `#1c5438@.25` = 대 흰색 약 1.5로 지금과 비슷하다.

### AC11. 포커스 링 — **문제 없음** (정정 5)

### AC12. 그리드선 1.24 — **변경 없음**

`--chart-grid: var(--line)`(O3). 값은 눈금 숫자(`--chart-axis`, 4.99)가 나른다. 그리드선을 3:1로 올리면(`--line-strong`) 1px 회색 격자가 데이터보다 도드라진다.
인쇄에서 사라지는 것은 맞지만 축 숫자가 남는다.

### AC13. 리터럴 13곳 — batch06 O3이 그 항목이다. 정정 3.

### AC14. 문제 없음.

---

## 2-B. 키보드 — 항목별

### KB1. Skip link `S`

**판단 — 목적지가 둘이어야 한다.** 전역 skip link는 `<main>`으로 간다. 그런데 단계 페이지는 `<main>` 안에서 `StageRail`(`lg` 이상, 링크 6 + 섹션 N)이
`<article>`보다 앞이다. `#main`만으로는 백로그가 센 "탭 18~24회" 중 헤더 6회만 준다. 그래서 **레일 맨 앞에 두 번째 건너뛰기 링크**를 둔다.
DOM 순서를 바꾸는 대안(레일을 article 뒤로 + grid `order`)은 KB14가 확인한 "재배치 0건"을 깨고 탭 순서와 시각 순서를 어긋나게 한다 — 탈락.

**(1) `app/layout.tsx:118`** — `<div className="print:hidden"><SiteHeader /></div>` **바로 앞**에. 두 `<script>`·`<Script>`는 포커스 대상이 아니므로 이 링크가 문서 첫 탭 정지가 된다:

```tsx
        {/* 문서의 첫 탭 정지. 평소에는 sr-only로 숨고 포커스를 받으면 헤더 위에 떠오른다.
            bg-ink/text-bg는 두 테마 모두 17:1 — 다크에서도 보인다. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-bg"
        >
          본문으로 건너뛰기
        </a>
```

`app/layout.tsx:120`:

```tsx
        <main id="main" tabIndex={-1} className="flex-1">{children}</main>
```

`app/globals.css`(`:focus-visible` 규칙 `:76-79` 뒤):

```css
/* skip link의 목적지. 프로그램 포커스만 받는 컨테이너라 링을 그리지 않는다 —
   Tailwind의 focus:outline-none은 @layer utilities 안이라 이 파일의 층 밖 :focus-visible을 못 이긴다. */
main[tabindex="-1"]:focus-visible {
  outline: none;
}
```

**(2) `components/StageRail.tsx:137-140`** — `<aside>` 여는 태그 바로 안, `<h2 id="stage-rail-stages">` 앞:

```tsx
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:mb-2 focus:block focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-bg"
      >
        목차 건너뛰고 본문으로
      </a>
```

`app/guide/[stage]/page.tsx:107-108`의 `<div id="content" …>`에 `tabIndex={-1}` 추가. 같은 CSS 규칙을 `#content[tabindex="-1"]:focus-visible`로 넓힌다
(선택자를 `[tabindex="-1"]:is(main, #content):focus-visible`로 합쳐도 된다).

**다크에서 보이는가**: `bg-ink text-bg` = 라이트 `#17181a`/`#ffffff` 17.77, 다크 `#f2f3f4`/`#101113` 17.00. 전역 `:focus-visible` 링(accent)이 이 상자 바깥 2px에 그려진다(대 bg 5.99 / 6.15).
**`focus:not-sr-only`가 필요한 이유**: Tailwind v4의 `sr-only`는 `position:absolute; width:1px; clip-path…`이고 `not-sr-only`가 그것을 되돌린다. `focus:fixed`는 그 뒤에 와야 `position`을 이긴다 —
v4는 클래스 순서가 아니라 변형 순서로 정렬하므로 둘 다 `focus:` 변형이면 **`not-sr-only`(`position:static`)와 `fixed`가 같은 층에서 충돌**한다. **구현 시 실브라우저에서 확인**; 겹치면 `focus:not-sr-only`를 빼고
`focus:[clip-path:none] focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:fixed …`로 풀어 쓴다.

**함정**:
- `tabIndex={-1}`이 없어도 Chrome·Firefox는 fragment 이동 시 "순차 포커스 시작점"을 옮긴다. Safari는 버전에 따라 다르다 — 그래서 `-1`을 준다.
- `<main>`은 `app/layout.tsx:120` 한 곳뿐이다(grep 확인). `id="main"`이 다른 곳과 충돌하지 않는다.
- `StageRail`은 `hidden lg:block`이라 `lg` 미만에서는 링크(2)도 숨는다 — 그 폭에서는 레일이 탭 순서에 없으니 맞다.
- `#content`는 `scroll-mt-24`를 갖는다. `focus()`의 스크롤도 `scroll-margin`을 따른다(CSSOM View) — 제목이 헤더 밑에 숨지 않는다.

**테스트** — `app/__tests__/skip-link.test.ts`(신규, node, 소스 검사) + `components/__tests__/StageRail.test.tsx`(신규, jsdom):

| `it()` | 검증 |
| --- | --- |
| `"layout의 첫 앵커가 #main을 가리키고 main이 그 id와 tabIndex=-1을 갖는다"` | `layout.tsx` 소스에서 첫 `<a href=` 가 `#main`, `<main id="main" tabIndex={-1}` 존재 |
| `"레일 첫 포커스 요소가 #content로 가는 건너뛰기 링크다"` | `render(<StageRail …/>)` 후 `container.querySelector("a")`의 `href`가 `#content` |
| `"단계 페이지 소스의 #content가 tabIndex=-1을 갖는다"` | 소스 grep |

### KB2. 검색 버튼 `disabled` → `aria-disabled` (`aria-busy`가 아니다)

**판단**: `aria-busy`는 "이 영역이 갱신 중"을 뜻하는 **라이브 영역용** 속성이고 버튼의 활성 여부와 무관하다. 이미 `:164-170`의 `aria-live`가 "검색 중입니다."를 말한다.
버튼에는 `aria-disabled`가 맞다. **기존 테스트는 어느 쪽이든 안 깨진다**(정정 9).

`PriorResearchSearch.tsx:118-124`:

```tsx
        <button
          type="submit"
          // disabled로 두면 Enter 제출 직후 버튼이 포커스를 잃어 <body>로 떨어진다(KB2).
          // 중복 제출은 runSearch의 inFlight 가드가 막는다.
          aria-disabled={status === "loading" || undefined}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 aria-disabled:cursor-progress aria-disabled:bg-disabled-bg aria-disabled:text-disabled-ink aria-disabled:hover:opacity-100"
        >
          {status === "loading" ? "검색 중…" : "검색"}
        </button>
```

`:137-151`의 칩 3개도 같은 방식(`disabled` 제거, `aria-disabled`, 테두리형 비활성 클래스).

`:59-62` `runSearch` 첫머리:

```tsx
  // status는 렌더 전까지 옛 값이라 Enter 연타 두 번이 모두 통과한다 — ref로 즉시 막는다.
  const inFlight = useRef(false);
  …
  async function runSearch(rawQuery: string) {
    const q = rawQuery.trim();
    if (!q || inFlight.current) return;
    inFlight.current = true;
    setStatus("loading");
    …
    } finally {
      inFlight.current = false;
      window.clearTimeout(timer);
    }
```

**함정**:
- `useRef` import 추가(`:3`).
- 결과 도착 후 포커스는 버튼에 남는다. 결과 목록(`:187-225`)이 DOM에서 버튼 뒤라 Tab 한두 번이면 닿는다 — 포커스를 결과로 옮기지 **않는다**(사용자가 검색어를 고치러 돌아가는 경우가 더 잦다).
- M2(batch3)가 같은 파일 `:108-116`·`:155-158`을 고친다. 줄이 겹치지 않는다. **M2 → KB2 순서 권장**(M2가 입력에 `id`를 주면 KB2 테스트가 `getByLabelText` 대신 그 id를 써도 된다).

**테스트** — `PriorResearchSearch.test.tsx`에 추가:

| `it()` | 검증 |
| --- | --- |
| `"검색 중에도 버튼이 포커스를 유지한다"` | `fetch`를 지연 프로미스로 스텁 → Enter 제출 → `document.activeElement`가 그 버튼, `aria-disabled="true"`, `hasAttribute("disabled") === false` → resolve 후 `aria-disabled` 없음 |
| `"검색 중 Enter를 다시 눌러도 fetch가 한 번만 간다"` | `fetch` 호출 횟수 1 |

### KB3. 퀴즈 "다시 고르기"가 자기 자신을 언마운트

**판단 — 버튼을 밖으로 빼지 않는다.** 결과 블록 안에 있는 것이 맞다. 대신 **누르기 전에 1번 문항 첫 라디오로 포커스를 옮긴다.** 라디오는 언마운트되지 않는다.

`ResearchDesignQuiz.tsx`:

```tsx
import { useRef } from "react";              // :3 근처
…
  const firstRadioRef = useRef<HTMLInputElement>(null);   // :170 뒤
…
                  <input
                    ref={qi === 0 && i === 0 ? firstRadioRef : undefined}   // :207, QUESTIONS.map에 (q, qi) 인덱스 추가
                    type="radio"
…
            <button
              type="button"
              onClick={() => {
                // 이 버튼은 결과 블록과 함께 사라진다. 포커스를 먼저 1번 문항으로 보내야
                // 키보드 위치가 <body>로 떨어지지 않는다. focus()는 라디오를 선택하지 않는다.
                firstRadioRef.current?.focus();
                setAnswers({});
              }}
```

**함정**:
- `focus()`를 `setAnswers` **앞에** — 상태 갱신이 동기 렌더를 일으키는 경우(`flushSync`는 없지만) 순서를 보장한다.
- 라디오 `focus()`는 선택을 바꾸지 않는다(화살표 키만 바꾼다). 리셋 후 `checked` 전부 false인 그룹에서 첫 라디오가 포커스를 갖는 상태는 정상이다.
- 라이브 영역(`:226`)이 "0 / 4개 선택 —"으로 바뀌며 낭독된다 — 추가 알림 불필요.
- `ResearchQuestionQuiz.tsx`에는 `setAnswers({})` 패턴이 **없다**(grep). 대상은 `ResearchDesignQuiz` 하나다.

**테스트** — `components/__tests__/ResearchDesignQuiz.test.tsx`(신규, jsdom):

| `it()` | 검증 |
| --- | --- |
| `"다시 고르기 후 포커스가 1번 문항 첫 선택지에 있다"` | 네 문항 선택 → 버튼 클릭 → `document.activeElement === getAllByRole("radio")[0]`, 그 라디오 `checked === false` |
| `"다시 고르기 후 결과 블록이 사라지고 진행 문구가 돌아온다 (경계)"` | `queryByRole("button", { name: "다시 고르기" })` null, `getByText(/0 \/ 4개 선택/)` |

### KB4. `VariableTableBuilder` 삭제 후 포커스 — **G7 코드 위에서** 쓴다

G7(batch3 커밋 4)이 `:57-98`을 통째로 바꾸고 행마다 삭제 버튼을 **둘**(카드 머리용·`sm` 이상용) 둔다. KB4는 그 코드에 얹는다.

```tsx
  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);   // :15 근처
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    setRows(next);
    setNotice(`변수 ${i + 1} 행을 삭제했습니다.`);
    // 삭제 버튼이 사라지면 포커스가 <body>로 날아간다(DeadlineTracker와 같은 처방).
    // 같은 자리에 올라온 행의 이름 칸 → 없으면 앞 행 → 그것도 없으면 '+ 변수 추가'.
    const target = nameInputRefs.current[i + 1] ?? nameInputRefs.current[i - 1];
    (target ?? addButtonRef.current)?.focus();
  }
```

- G7 코드의 이름 `<input>`(첫 번째)에 `ref={(el) => { nameInputRefs.current[i] = el; }}`.
- `+ 변수 추가` 버튼(`:101-107`)에 `ref={addButtonRef}`.
- `:117-119`의 `<p aria-live="polite">`에 `{notice ?? (copyFailed && COPY_FAILED_MESSAGE)}` — 하나의 라이브 영역에 두 문구를 합치지 말고 `notice`를 별도 `<p aria-live="polite" className="sr-only">`로 둔다. `copyFailed`는 눈에 보여야 하는 문구라 합치면 스타일이 꼬인다.

**함정**:
- `nameInputRefs.current[i + 1]`은 **삭제 전** 배열의 i+1이다. 삭제 후 그 요소가 인덱스 i로 내려오지만 DOM 노드는 같으므로(`key={i}` — 주의: **key가 인덱스라 React는 노드를 재사용한다**. i번째 노드가 남고 마지막 노드가 사라진다). 그래서 실제로 살아남는 노드는 `refs[i]`(값은 옛 i+1의 것이 채워짐)다. **`target = refs[i] ?? refs[i-1]`로 써야 옳다.** 위 코드의 `i + 1`은 key가 고유 id일 때의 논리다. **G7이 `key`를 어떻게 두는지에 따라 둘 중 하나** — G7 코드는 `key={i}` 그대로다 → `refs[i]` 판을 쓴다. 단, `focus()`는 리렌더 전에 호출되므로 그 시점 `refs[i]`는 아직 옛 i번째 노드이고 그 노드가 곧 값을 바꿔 남는다. **동작은 옳다.** 테스트가 이걸 잠근다.
- `setRows`는 `usePersistentState`의 setter — 동기 여부와 무관하게 포커스 대상 노드는 살아남는다.

**테스트** — batch3가 신설하는 `VariableTableBuilder.test.tsx`에 추가:

| `it()` | 검증 |
| --- | --- |
| `"가운데 행을 지우면 같은 자리 행의 이름 칸에 포커스가 간다"` | 3행(이름 a,b,c) → 2행 삭제 → `activeElement.value === "c"` |
| `"마지막 행을 지우면 앞 행으로 간다"` | 2행 → 2행 삭제 → `activeElement.value === "a"` |
| `"유일한 행을 지우면 '+ 변수 추가' 버튼으로 간다 (경계)"` | |
| `"삭제를 낭독기에 알린다"` | 라이브 영역에 `"변수 2 행을 삭제했습니다."` |

### KB5. `ReferenceList` 삭제 후 포커스

`ReferenceList.tsx`:

```tsx
  const headingRef = useRef<HTMLHeadingElement>(null);     // :17 근처
  const deleteRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [notice, setNotice] = useState<string | null>(null);

  function remove(id: string) {
    const idx = refs.findIndex((r) => r.id === id);
    const target = refs[idx]?.title ?? "";
    const neighbor = refs[idx + 1] ?? refs[idx - 1];
    setRefs(removeReference(id));
    setNotice(`${target} 항목을 삭제했습니다.`);
    // 삭제 버튼이 사라지면 포커스가 <body>로 날아간다(DeadlineTracker와 같은 처방).
    // 다음 항목의 삭제 버튼 → 없으면 앞 항목 → 목록이 비면 섹션 제목.
    (neighbor ? deleteRefs.current.get(neighbor.id) : headingRef.current)?.focus();
  }
```

- `:53` `<h2 ref={headingRef} tabIndex={-1} …>`.
- `:81-88` 삭제 버튼에 `ref={(el) => { if (el) deleteRefs.current.set(ref.id, el); else deleteRefs.current.delete(ref.id); }}`.
- `:95-97` 라이브 영역 — KB4와 같이 `notice`용 `sr-only` 문단을 따로.

여기서는 `key={ref.id}`(고유)라 KB4의 인덱스 함정이 없다 — `neighbor`의 버튼 노드는 살아남는다.

**함정**: `h2`에 `tabIndex={-1}`을 주면 포커스 시 전역 링이 제목 둘레에 그려진다. 이건 **의도된 표시**다(어디로 갔는지 보여야 한다) — KB1의 `outline:none` 규칙을 여기엔 적용하지 않는다.

**테스트** — `components/__tests__/ReferenceList.test.tsx`(신규, jsdom, `lib/citations`의 localStorage 저장을 `beforeEach`에서 시드):

| `it()` | 검증 |
| --- | --- |
| `"항목을 지우면 다음 항목의 삭제 버튼에 포커스가 간다"` | |
| `"마지막 항목을 지우면 앞 항목으로 간다"` | |
| `"전부 지우면 섹션 제목으로 간다 (경계)"` | `activeElement.tagName === "H2"` |
| `"삭제를 낭독기에 알린다"` | |

### KB6 — AC5와 한 커밋(위).

### KB7 — AC4와 한 커밋(위).

### KB8. `StatsCalculator` 모드 전환이 결과를 조용히 지운다

**위치**: `:58-67` `switchMode`가 `setStaleNotice(false)`. `:308-312`가 문구 "입력이 바뀌었습니다. 다시 계산하세요."를 그린다.
`StatsCalculator.test.tsx:70`이 이 **정확한 문자열**을 `getByText`로 잡는다 — 바꾸면 깨진다.

**판단**: `staleNotice: boolean` → `staleReason: "input" | "mode" | null`. 기존 문구는 그대로 두어 테스트를 지킨다.

```tsx
  const [staleReason, setStaleReason] = useState<"input" | "mode" | null>(null);
  …
  function switchMode(next: Mode) {
    const hadResult = ttestResult !== null || regressionResult !== null;
    setInputs((prev) => ({ ...prev, mode: next }));
    setTtestResult(null);
    setRegressionResult(null);
    setError(null); setDropWarning(null); setThousandsNotice(null); setAmbiguityWarning(null);
    // 결과가 있었다면 왜 사라졌는지 말한다 — 입력 변경 경로(:73)와 같은 처방을 모드 전환에도 적용
    setStaleReason(hadResult ? "mode" : null);
  }
  // :73  setStaleNotice((prev) => prev || hadResult)  →  setStaleReason((prev) => prev ?? (hadResult ? "input" : null))
  // :84  setStaleNotice(false)                        →  setStaleReason(null)
  …
        {staleReason && (
          <p className="mt-3 text-sm text-ink-soft">
            {staleReason === "mode"
              ? "분석 방식을 바꿨습니다. 다시 계산하세요."
              : "입력이 바뀌었습니다. 다시 계산하세요."}
          </p>
        )}
```

**함정**: `:73`의 `prev || hadResult` 의미("한 번 stale이면 계속 stale")를 `??`로 옮길 때 `"mode"`가 `"input"`으로 덮이지 않게 — `prev ?? …`가 그 역할.

**테스트** — `StatsCalculator.test.tsx`에 1건: `"결과가 있는 상태에서 분석 방식을 바꾸면 안내 문구가 나온다"` — 계산 후 "상관" 클릭 → 라이브 영역에 `"분석 방식을 바꿨습니다"`.

### KB9. `AcademicPhrases` 섹션 칩이 검색어 한 글자에 사라진다

**위치**: `:85-108` `{!searching && (<> 칩 6개 + 섹션 안내 </>)}`.

**판단**: 칩은 **항상 렌더**하고, 검색 중에 칩을 누르면 **검색어를 비우고 그 섹션을 연다.** 안내 문단(`SECTION_NOTES`)만 검색 중 숨긴다.
"검색 중엔 전체에서 찾는다"(`:34`)는 그대로다 — 칩이 검색 결과를 섹션으로 걸러 주는 게 아니라 검색을 끝내는 동작이라 의미가 명확하다.

```tsx
          <div className="mt-3 flex flex-wrap gap-2">
            {PHRASE_SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={!searching && section === s}
                // 검색 중에도 탭 순서에 남긴다. 누르면 검색을 끝내고 그 섹션으로 간다.
                onClick={() => setForm({ section: s, query: "" })}
                className={…}
              >
                {s}
              </button>
            ))}
          </div>
          {!searching && (
            <p className="mt-3 rounded-lg …">{SECTION_NOTES[section]}</p>
          )}
```

**함정**: `aria-pressed`를 검색 중 전부 false로 두는 것이 옳다 — 검색 결과는 어느 섹션에도 속하지 않는다.
PF7(정적 배열 재생성·검색어 저장)이 같은 컴포넌트를 건드린다 — 줄이 다르다(`:17-19`, `:22-26`).

**테스트** — `components/__tests__/AcademicPhrases.test.tsx`(신규, jsdom):

| `it()` | 검증 |
| --- | --- |
| `"검색 중에도 섹션 칩 6개가 탭 순서에 있다"` | 한 글자 입력 후 `getAllByRole("button", { pressed: false })` 중 섹션 이름 6개 존재 |
| `"검색 중 칩을 누르면 검색어가 비고 그 섹션이 열린다"` | `aria-pressed="true"`, 입력값 `""` |

### KB10. `#tool-` 딥링크 후 포커스

`StageTools.tsx:144-146` 뒤(`openIndex` 계산 다음)에:

```tsx
  // 딥링크로 들어오면 브라우저는 스크롤만 옮기고 포커스는 문서 맨 앞에 둔다.
  // 시드 직후 한 번, 해시가 가리키는 도구의 <summary>로 보낸다. A1이 이 경로를 주 진입로로 만든다.
  useEffect(() => {
    if (!targetToolId || openIndex === -1) return;
    const summary = document
      .getElementById(`tool-${targetToolId}`)
      ?.querySelector<HTMLElement>("summary");
    summary?.focus();
  }, [targetToolId, openIndex]);
```

`useEffect` import 추가.

**함정**:
- **PF2(묶음 1)가 해시 → `?tool=` 쿼리로 바꾸면 이 effect의 소스(`targetToolId`)만 바뀐다.** 위치는 그대로. PF2가 먼저면 그 코드 위에 얹는다.
- `<summary>`는 기본 포커스 가능(tabindex 없이). `focus-visible:outline-offset-[-2px]`가 이미 있어 링이 카드 안에 그려진다.
- 효과는 `[slug]`가 바뀔 때 `useSeededState`가 재시드하므로 단계 이동 시 한 번 더 돈다 — 해시가 없으면 `targetToolId`가 null이라 아무것도 안 한다.
- `StageTools.test.tsx`가 있다. `window.location.hash`를 세팅하는 테스트가 있으면 포커스 이동이 다른 단언에 영향을 주는지 **구현 시 확인**.

**테스트** — `StageTools.test.tsx`에 1건: `"#tool-xxx 해시로 마운트되면 그 도구의 summary에 포커스가 간다"` — `window.location.hash = "#tool-…"` 후 render → `waitFor(() => activeElement.tagName === "SUMMARY")`.

### KB11. `StageRail` `<aside>` → `<nav>`

`StageRail.tsx:137`:

```tsx
    <nav
      aria-label="단계와 이 페이지 목차"
      className="rail-scroll sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto pr-1 lg:block"
    >
```

닫는 태그 `:227` `</aside>` → `</nav>`. 헤더의 `<nav aria-label="주요 메뉴">`(`SiteHeader:38`)와 라벨이 다르므로 랜드마크 목록에서 구분된다.

**함정**: KB1(2)의 건너뛰기 링크가 이 `<nav>` 안 첫 자식이다. 같은 커밋에서 한다.

**테스트** — `StageRail.test.tsx`: `"레일이 nav 랜드마크이고 헤더 메뉴와 다른 이름을 갖는다"` — `getByRole("navigation", { name: "단계와 이 페이지 목차" })`.

### KB12. 헤더 포커스 링 — **구현 시 판단 필요**

`SiteNav:23`은 이미 `focus-visible:outline-offset-[-2px]`다. 코드로는 링이 `h-14` 항목 안쪽 2px에 그려져 클립 박스(`nav`의 `overflow-x-auto`가 만든 `overflow-y:auto`) 안에 든다.
백로그가 본 "클립 경계에 붙음"은 (a) 링 위·아래가 헤더 `border-b`와 겹쳐 보이는 시각 문제이거나 (b) 활성 항목의 `border-b-2 border-accent`와 링 색이 같아 아래변이 합쳐지는 것으로 추정된다 — **둘 다 소스로는 판정할 수 없다.**

실브라우저 확인 후 처방 후보: (a)면 `outline-offset-[-4px]`, (b)면 링을 `outline-color: var(--ink)`로 바꾸는 `focus-visible:outline-ink`. 이 문서는 값을 정하지 않는다.

### KB13. `PlanBackup` 복원 후 reload

**판단**: reload 자체는 유지한다 — 모든 도구가 마운트 시 localStorage를 읽는 구조라 reload 없이 갱신하려면 훅 전부에 구독기를 넣어야 한다(범위 밖).
대신 **(1) 예고를 말하고 (2) reload 뒤 포커스를 이 버튼으로 되돌린다.**

`PlanBackup.tsx`:

```tsx
const RESTORE_FOCUS_KEY = "research-guide:focus-after-reload";   // :9 근처. 백업 제외 키(PREFIX로 시작하지만 sessionStorage)
…
  const importButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // 복원 → reload 뒤 포커스가 문서 맨 앞에 떨어진다. 떠나기 전에 남긴 표식을 보고 되돌린다.
    try {
      if (window.sessionStorage.getItem(RESTORE_FOCUS_KEY) === "plan-backup") {
        window.sessionStorage.removeItem(RESTORE_FOCUS_KEY);
        importButtonRef.current?.focus();
        setStatus("restored");
      }
    } catch { /* sessionStorage 불가 — 포커스 복원만 포기 */ }
  }, []);
  …
      setStatus("imported");
      try { window.sessionStorage.setItem(RESTORE_FOCUS_KEY, "plan-backup"); } catch {}
      setTimeout(() => window.location.reload(), 800);
```

- `status` 유니온에 `"restored"` 추가. 버튼 문구(`:145`): `imported` → "불러오는 중… 곧 새로 고칩니다", `restored` → "불러왔습니다".
- 라이브 영역: `:131-135`의 오류 문단 옆에 `<p aria-live="polite" className="sr-only">{status === "imported" && "복원했습니다. 화면을 새로 고칩니다."}{status === "restored" && "백업을 불러왔습니다."}</p>`.
- 불러오기 버튼(`:141-147`)에 `ref={importButtonRef}`.

**함정**:
- `sessionStorage`를 쓴다 — `localStorage`에 쓰면 `listRecordKeys()`(`PREFIX` 필터)가 백업·전체삭제 대상으로 잡는다. 키 이름이 `PREFIX`로 시작해도 **저장소가 다르므로** 안 잡힌다.
  그래도 헷갈리니 키를 `"research-guide-ui:focus-after-reload"`처럼 PREFIX 밖으로 두는 편이 낫다 — **구현 시 선택.**
- ER7·ER8(전체삭제 범위·실패 삼킴)이 `DataReset:23`의 reload를 다룬다. 같은 표식 방식을 쓸 수 있으나 이번 범위 밖.
- 800ms 동안 사용자가 다른 곳으로 포커스를 옮겨도 reload 후엔 이 버튼이다 — 허용.

**테스트** — `components/__tests__/PlanBackup.test.tsx`(신규, jsdom):

| `it()` | 검증 |
| --- | --- |
| `"복원 성공 시 예고 문구를 알리고 reload 전에 표식을 남긴다"` | `window.location.reload`를 `vi.fn()`으로(jsdom에서 `Object.defineProperty(window, "location", …)` 필요), 파일 업로드 → 라이브 영역 문구, `sessionStorage` 표식 존재, `vi.advanceTimersByTime(800)` 후 reload 호출 1회 |
| `"표식이 있으면 마운트 시 불러오기 버튼에 포커스하고 표식을 지운다"` | 시드 후 render → `activeElement`가 그 버튼, 표식 삭제됨 |

---

## 2-C. 브라우저 실측

### BR1. `ThemeToggle` 36×36 → 44×44

`ThemeToggle.tsx:43`:

```tsx
      className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface hover:text-ink"
```

- `h-9 w-9`(36) → `h-11 w-11`(44). `-my-2`는 지운다 — 헤더 행이 `h-14`(56) 고정이라 세로 마진은 원래 효과가 없었다.
- 가로는 +8px다. `SiteNav.tsx:8-10` 주석대로 375px 헤더는 여유가 0에 가깝다. `-mr-1`(4px)로 컨테이너 오른쪽 `px-4` 여백을 먹어 순증가를 4px로 줄인다.
  **375px에서 메뉴가 스크롤로 밀리는지 구현 시 실측 필수.** 밀리면 `-mx-1`(양쪽 4px, 순증가 0)로 — 왼쪽 4px는 `gap-1`을 잠식해 "용어사전" 링크 히트 영역과 4px 겹친다. 허용 범위.

**테스트**: 크기는 jsdom으로 못 잰다. `components/__tests__/ThemeToggle.test.tsx`(신규): `"버튼 클래스에 44px급(h-11 w-11)이 있고 36px급(h-9 w-9)이 없다"` — 소스 회귀선.

### BR2. 라디오 실효 43px → `ResearchDesignQuiz:205`

`text-sm`(14px) × `leading-relaxed`(1.625) = 22.75 + `py-2.5`(20) = **42.75 ≈ 43** — 백로그 실측과 정확히 맞는다.
`py-2.5` → `py-3`: 22.75 + 24 = **46.75**.

```tsx
                <label
                  key={opt.label}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface"
                >
```

**함정**: 백로그가 "5개"라 했는데 이 컴포넌트의 라디오는 16개다. 실측 페이지가 `/guide/design`이면 16개 전부 같은 높이여야 한다 — 숫자 불일치는 측정 도구가 뷰포트 안 것만 센 것으로 보인다.
**`GuideBlock`(`stats/GuideBlock.tsx:44-95`)과 `ResearchShowcaseForm:200-217`의 라디오 라벨은 인라인(`flex items-center gap-1.5`, 패딩 없음)이라 높이 ~22px**이다 — 백로그 범위 밖이지만 같은 결함이다. 별도 항목으로 올릴 만하다.

**테스트**: 소스 회귀선 1건을 `ResearchDesignQuiz.test.tsx`에 — `"선택지 라벨이 py-3 이상이다"`(className 검사).

---

## 3. 커밋 분할

묶음 4.5(batch3 커밋 10~13) 뒤에 붙인다. 번호는 14부터.

| # | 커밋 | 내용 | 선행 |
| --- | --- | --- | --- |
| 14 | `feat: 대비 토큰 4종·히트맵 3색 (AC1·AC4·AC6 토큰, tokens.test)` | `globals.css` 토큰 + `@theme` + `lib/__tests__/support/wcag.ts` + `tokens.test.ts`(차트·히트맵 행은 15·16에서 켠다) | — |
| 15 | `fix: 차트 팔레트를 배경 3:1·인접 1.8:1로 (AC2·AA1·O4·AC9)` | `globals.css` `--chart-*` 값 ×2 테마, `lib/chartExport.ts` 라이트 값, `tokens.test` 2행 | **batch06 O3 이후** |
| 16 | `fix: 입력 테두리 --line-strong (AC1)` | 46곳 치환 + 소스 grep 테스트 | 14, **G7(batch3 #4) 이후** |
| 17 | `fix: 히트맵 명시 3색 + 칸 테두리 (AC3)` | `ActivityHeatmap` 상수 2개 + 클래스 | 14, **batch3 #7 이후** (또는 #7에 합류) |
| 18 | `fix: 비활성 버튼을 aria-disabled와 힌트로 (AC4·KB7)` | 6개 컴포넌트 + `DisabledButtons.test.tsx` | 14 |
| 19 | `fix: 사례 공유 메일 링크를 탭 순서에 (AC5·KB6)` | `ResearchShowcaseForm` + 테스트 | 14 |
| 20 | `fix: 저장 실패 문구에 색 아닌 단서 (AC7)` | `ReflectionBox` + 테스트 1건 | — |
| 21 | `feat: skip link 둘과 레일 nav 랜드마크 (KB1·KB11)` | `layout.tsx` `globals.css` `StageRail` `guide/[stage]/page.tsx` + 테스트 | — |
| 22 | `fix: 검색 버튼 포커스 유지·중복 제출 가드 (KB2)` | `PriorResearchSearch` + 테스트 2건 | 14, **M2(batch3 #12) 이후 권장** |
| 23 | `fix: 조건부 렌더 포커스 소실 셋 (KB3·KB4·KB5)` | `ResearchDesignQuiz` `VariableTableBuilder` `ReferenceList` + 테스트 | **G7(batch3 #4) 이후** |
| 24 | `fix: 무음 상태 변화 셋 (KB8·KB9·KB13)` | `StatsCalculator` `AcademicPhrases` `PlanBackup` + 테스트 | — |
| 25 | `fix: 도구 딥링크 진입 시 포커스 (KB10)` | `StageTools` + 테스트 1건 | **PF2(묶음 1) 이후 권장** |
| 26 | `fix: 다크 토글 44px·퀴즈 라디오 py-3 (BR1·BR2)` | `ThemeToggle` `ResearchDesignQuiz` | 23과 같은 파일 — 23 이후 |

AC8·AC10·AC11·AC12·AC14·KB12·KB14는 **커밋 없음**(문서상 판정만). AC13은 batch06 O3 커밋.

### 묶음 4.5(L5 M1 M2 M3)와의 파일 충돌

| 이번 | 묶음 4.5 | 파일 | 관계 |
| --- | --- | --- | --- |
| KB2 (#22) | M2 (#12) | `PriorResearchSearch.tsx` | 줄 안 겹침(`:108-116, :155-158` vs `:118-124, :137-151, :59-62`). M2 먼저 |
| KB4 (#23) · AC1 (#16) | G7 (#4, 묶음 3) | `VariableTableBuilder.tsx` | G7이 `:57-98` 전체 교체. **반드시 G7 뒤** |
| AC3 (#17) | G3·L4 (#7) | `ActivityHeatmap.tsx` | #7이 전체 교체. 뒤에 얹거나 합류 |
| — | L5 M1 M3 | — | 충돌 없음 |

### 다른 미완료 항목과의 관계

- **PF2 → KB10**: PF2가 해시를 쿼리로 바꾸면 KB10의 소스 변수만 바뀐다.
- **PF7 ↔ KB9**: `AcademicPhrases` 같은 파일, 다른 줄.
- **O3 → AC2/AC13**: O3 없이 15를 넣으면 `--chart-*`가 아무 데서도 안 쓰인다.
- **TQ5 ↔ SimpleChart**: 이번 범위는 `SimpleChart.tsx`를 건드리지 않는다(AC10·AC12 변경 없음).
- **ER7·ER8 ↔ KB13**: `DataReset`의 reload에 같은 표식을 쓸 수 있다. 범위 밖.

---

## 4. 구현 시 판단이 필요한 지점 — 10건

1. **KB1** — `focus:not-sr-only`와 `focus:fixed`의 `position` 충돌(Tailwind v4 정렬). 실브라우저 확인 후 풀어 쓸지.
2. **KB12** — 소스로 판정 불가. 실측 후 후보 (a)/(b) 중 택일.
3. **BR1** — 375px에서 +4px가 메뉴를 스크롤로 미는지. 밀면 `-mx-1`.
4. **AC4/KB7** — `RandomSampler.draw`·`ObjectiveTemplateGenerator.copy`가 빈 입력을 스스로 막는지. 안 막으면 가드 추가.
5. **AC5/KB6** — `ready === false`일 때 `mailHref` 값. `""`이면 `"mailto:"`로 대체.
6. **AC7** — `ReflectionBox.test.tsx`가 실패 문구를 정확 일치로 잡는지.
7. **KB4** — G7의 최종 `key`가 인덱스인지 id인지에 따라 `refs[i]` / `refs[i+1]` 중 택일(본문 함정 참조).
8. **KB13** — 표식 키를 `PREFIX` 안에 둘지 밖에 둘지.
9. **AC2** — hue 순서 유지 여부. 갈색·올리브를 받아들일지, 주황·노랑 자리를 다른 hue로 바꿀지. 테스트는 제약만 잠근다.
10. **AC8** — `--line`을 올릴지. 이 문서는 "아니오"이고 후보값만 남겼다.

## 5. 실행 전 확인 (실브라우저)

- 새 토큰 6개의 유틸리티(`border-line-strong` `bg-disabled-bg` `text-disabled-ink` `bg-heat-1/2/3`)가 실제 CSS에 나오는가 — `@theme inline` 누락은 조용히 실패한다.
- 다크 토글 켠 상태와 시스템 다크 상태 **둘 다**에서 히트맵·차트·비활성 버튼 색이 같은가(두 다크 블록).
- 라이트에서 새 차트 팔레트로 원형 8조각을 그려 경계가 전부 보이는가. 내려받은 SVG를 흰 배경에서 열어 같은가.
- 단계 페이지에서 Tab 1회 → "본문으로 건너뛰기"가 헤더 위에 떠오르는가(라이트·다크). Enter → 다음 Tab이 레일의 "목차 건너뛰고 본문으로"인가 → Enter → 다음 Tab이 본문 첫 링크인가.
