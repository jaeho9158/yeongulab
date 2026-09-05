# 묶음 1.5·2·2.5 구현 설계 — 17건

라운드 10. 대상: O1 O2 O3 O4 (다크모드) / A2 T13 M4 A3 A4 A5 A7 B7 B8 P7 T1 (SEO 소품) / L2 L3 (검색 라우트).
판정 근거는 `docs/backlog-index.md`와 `docs/feature-backlog.md`에 있다. 이 문서는 **어떻게 고치는가**만 다룬다.

모든 줄 번호는 이 문서를 쓰는 시점의 파일에서 실제로 확인한 값이다.
`docs/impl-plan-batch05.md`의 커밋 7·8이 아직 안 들어갔다면 **파트 0의 선행 관계**를 먼저 읽어라.

---

# 파트 0 — 조사 중 드러난 백로그의 사실 오류 4건

설계를 시작하기 전에 밝힌다. 백로그가 근거로 든 수치 네 개가 실제 파일과 다르다.
**세 개는 처방을 바꾼다.**

### (1) O1 — "구분선 31편 전부"는 사실이 아니다. 실제 `<hr>`는 **0개**다

```
$ for f in content/articles/*.mdx; do n=$(grep -c '^---$' "$f"); echo $((n-2)); done | 확인
→ 전 파일 0
$ grep -rn '^\*\*\*\|^___\|^- - -' content/   → 0건
```

백로그는 frontmatter 구분자(`---` 여는 줄·닫는 줄)를 세었다. 본문 수평선은 한 편에도 없다.
`--tw-prose-hr`는 **현재 화면에 영향이 없다.** (바인딩은 여전히 넣는다 — 앞으로를 위한 것이지 지금의 증상이 아니다.)

### (2) O1 — 인용문 본문은 이미 다크에서 보인다. 진짜 안 보이는 건 **인라인 코드**다

`prose-p:text-ink-soft`가 컴파일되는 셀렉터는 `& :is(:where(p):not(...))` 로 **자손 p 전부**를 잡는다.
마크다운 blockquote는 `<blockquote><p>…</p></blockquote>`이므로 안쪽 `<p>`가 이미 `--color-ink-soft`를 받는다.
`--tw-prose-quotes`는 blockquote 엘리먼트 자신에만 걸리고 p가 덮어쓴다.

다크에서 실제로 죽는 것은 **`--tw-prose-code`(neutral-900 `#171717`)** 다. 다크 배경 `#101113` 위에서 **1.03:1**.
인라인 코드가 들어간 줄은 `content/articles/*.mdx`에 **37줄** 있다(`grep -rn '\`[^\`]' content/articles/*.mdx | wc -l`).
`--tw-prose-quote-borders`(neutral-200 `#e5e5e5`)도 다크에서 **밝은 회색 막대**로 남아 방향이 반대다.

**처방은 바뀌지 않는다**(토큰 바인딩 한 번으로 전부 해결). 바뀌는 건 **커밋 메시지와 검증 대상**이다.
"인용문 23편"이 아니라 "인라인 코드 · 인용문 좌측선 · 목록 마커"를 육안 확인하라.

### (3) O3 — 다크 대비 1.05:1은 사실이 아니다. `SimpleChart.tsx:221`이 배경을 흰색으로 깐다

```tsx
// components/SimpleChart.tsx:221
<rect width={W} height={H} fill="white" />
```

`W=640 H=340`으로 SVG 전면을 덮는다. 그래서 다크모드에서도 축 텍스트 `#17181a`는 **흰 배경 위**에 있어
대비 **16.4:1**로 읽힌다. 증상은 "안 보인다"가 아니라 **"다크 페이지 한복판에 흰 판때기가 있다"**이다.

**이것이 처방을 크게 바꾼다.** 현재 내보내기 SVG는 이미 라이트 고정색으로 **정상**이다.
즉 O3의 위험은 "내보내기를 고쳐야 한다"가 아니라 **"화면을 고치다가 이미 정상인 내보내기를 망가뜨린다"**이다.
파트 1의 O3 설계는 이 전제 위에 서 있다.

### (4) P7 — 가려진 4편의 목록이 틀렸다

백로그: `figure-first` `from-curriculum` `question-to-test` `negative-results`.
실측(`getAllArticles()` 정렬 규칙을 그대로 태워 확인):

```
featured 10편 정렬순:
  faq, from-curriculum, start-with-reviews, reading-english-papers,
  figure-first, question-to-test, | survey-questions, statistics,
  negative-results, presentation
노출 6편: faq, from-curriculum, start-with-reviews, reading-english-papers, figure-first, question-to-test
가려진 4편: survey-questions, statistics, negative-results, presentation
```

백로그가 지목한 4편 중 3편은 **실제로는 노출되고 있다.** 처방(한도 조정)은 같지만 **어떤 글을 잃고 있었는지가 다르다** —
`statistics`와 `negative-results`는 이 사이트의 간판 글이다. 이것이 P7을 "한도 6 유지 + 플래그 끄기"가 아니라
**"한도 10으로 올리기"**로 권고하는 이유다.

### 선행 관계 (batch05)

| batch05 커밋 | 이 배치에서 같은 파일을 만지는 항목 | 조치 |
| --- | --- | --- |
| 커밋 4 (T6, `app/__tests__/routes.test.ts` 신설) | A2·B7·B8 테스트 | **있으면 그 파일에 추가**, 없으면 신설 |
| 커밋 7 (O5, `articles/[slug]/page.tsx`에 `<AdRails/>`) | **A4**(같은 파일에 `AdSlot` 추가) | **커밋 7 뒤에 A4를 넣어라.** 순서가 뒤집히면 O5의 diff가 A4를 덮는다 |
| 커밋 8 (O7, `articles/[slug]/page.tsx:167` 뒤 도구 카드) | **A4**(삽입 위치가 인접) | 커밋 8 뒤. 아래 A4의 줄 번호는 **커밋 7·8 이전 기준**이다 |
| 커밋 9 (P6-a, `content/showcase/*.mdx` frontmatter + `lib/showcase.ts`) | **M4 T13** | 커밋 9 뒤. 같은 6개 파일의 frontmatter를 만진다 |

batch05가 아직 안 들어갔다면 이 배치는 **O1 O2 O3 O4 L2 L3 A2 A3 A5 A7 B7 B8 P7 T1**까지 그대로 진행 가능하고,
**A4 M4 T13** 셋만 대기한다.

---

# 파트 1 — 묶음 1.5 (다크모드) O1 O2 O3 O4

## O1. prose 토큰을 사이트 토큰에 바인딩

### 조사 결과 — 추측 없이 확인한 것

**typography 플러그인은 설치돼 있다.** `@tailwindcss/typography@0.5.20`, `package.json:29`.
로드는 `app/globals.css:2`의 `@plugin "@tailwindcss/typography";`.

`prose` 사용처는 **4곳**(백로그와 일치):

| 파일:줄 | className |
| --- | --- |
| `app/articles/[slug]/page.tsx:125` | `prose prose-neutral … prose-th:text-ink prose-td:text-ink-soft` |
| `app/guide/[stage]/page.tsx:109` | 동일 + `scroll-mt-24` |
| `app/showcase/[slug]/page.tsx:84` | 동일 |
| `app/privacy/page.tsx:18` | 동일 (표 관련 3개 없음) |

**핵심 확인 — Tailwind v4에서 이 플러그인의 `addComponents`는 `@layer components`가 아니라 `@layer utilities`에 들어간다.**
`tailwindcss`의 `compile()` API로 실제 컴파일해서 확인했다:

```
2   @layer theme, base, components, utilities;
162 @layer utilities {
163   .prose {
578   .prose-neutral {
617 .prose {              ← 사용자가 globals.css에 직접 쓴 규칙 (레이어 밖)
618   --tw-prose-quotes: red;
```

**따라서 `@theme` 안에 `--tw-prose-*`를 넣으면 안 된다.** `@theme`는 값을 `:root`에 얹는데,
`.prose-neutral`은 **엘리먼트 자신**에 같은 변수를 다시 선언하므로 `:root` 값이 항상 진다.
백로그 문구("`@theme`에서 바인딩")를 문자 그대로 따르면 **아무 효과가 없다.**

정답은 **레이어 밖의 `.prose` 규칙**이다. 레이어에 속하지 않은 CSS는 특이도와 무관하게 모든 레이어를 이긴다.
`:root`가 아니라 `.prose`에 걸므로 `.prose-neutral`과 같은 엘리먼트에서 겨루고, 레이어 밖이라 이긴다.

DEFAULT `.prose`가 실제로 참조하는 변수 18종(컴파일 산출물에서 추출):

```
body headings lead links bold counters bullets hr quotes quote-borders
captions kbd kbd-shadows code pre-code pre-bg th-borders td-borders
```

### 변경 — `app/globals.css`

`:65`(`:root[data-theme="dark"]` 블록 닫는 `}`)와 `:67`(`body {`) **사이**에 넣는다.
다크 블록보다 뒤일 필요는 없다(변수 참조라 값 확정 시점이 아니라 사용 시점에 풀린다). 다만
**두 다크 블록 뒤에 두는 것이 읽는 사람에게 "토큰 → prose" 방향을 보여준다.**

```css
/* prose 토큰을 사이트 토큰에 바인딩한다.
 *
 * 왜 @theme이 아니라 여기인가 — @tailwindcss/typography의 .prose-neutral은
 * Tailwind v4에서 @layer utilities 안에 들어가고, 이 변수들을 엘리먼트 자신에
 * 선언한다. @theme이 얹는 :root 값은 항상 그것에 진다. 반면 레이어에 속하지
 * 않은 이 규칙은 같은 엘리먼트에서 utilities 레이어를 이긴다.
 *
 * 왜 각 페이지의 prose-* className 나열이 아니라 여기인가 — 지금 네 곳
 * (articles/[slug]:125, guide/[stage]:109, showcase/[slug]:84, privacy:18)이
 * p·li·strong·a·th·td만 덮었다. 나머지(코드·인용선·마커·표 괘선)는 라이트
 * 기본값으로 남아 다크에서 어긋난다. 여기서 한 번 묶으면 새 요소가 생겨도
 * 자동으로 따라온다.
 *
 * prose-invert는 쓰지 않는다. 사이트 토큰이 이미 테마에 따라 뒤집히므로
 * invert 변수를 켜면 뒤집기가 두 번 일어난다.
 */
.prose {
  --tw-prose-body: var(--ink-soft);
  --tw-prose-headings: var(--ink);
  --tw-prose-lead: var(--ink-soft);
  --tw-prose-links: var(--accent);
  --tw-prose-bold: var(--ink);
  --tw-prose-counters: var(--ink-soft);
  /* 마커를 --line에 묶으면 다크(#2a2c2f 대 #101113 = 1.35:1)에서 사라진다.
     텍스트가 아니라 그래픽이지만 목록의 의미를 나르므로 --ink-soft로 올린다. */
  --tw-prose-bullets: var(--ink-soft);
  --tw-prose-hr: var(--line);
  --tw-prose-quotes: var(--ink);
  --tw-prose-quote-borders: var(--line);
  --tw-prose-captions: var(--ink-soft);
  --tw-prose-kbd: var(--ink);
  --tw-prose-kbd-shadows: color-mix(in oklab, var(--ink) 10%, transparent);
  --tw-prose-code: var(--ink);
  /* pre는 라이트/다크 모두에서 "어두운 판 위 밝은 글씨"를 유지한다.
     코드블록은 본문 2곳뿐이고(28-archiving-by-semester, 04-data-collection)
     현재 모습이 두 테마 모두에서 읽히므로 뒤집지 않는다. */
  --tw-prose-pre-code: #e5e5e5;
  --tw-prose-pre-bg: #262626;
  --tw-prose-th-borders: var(--line);
  --tw-prose-td-borders: var(--line);
}
```

### 함정

1. **`@theme inline` 블록(`:25-37`)에 넣지 마라.** 위에서 설명한 이유로 무효다.
   실수했는지 확인하는 법: 다크에서 인라인 코드가 여전히 안 보이면 그것이다.
2. **`.prose` 규칙을 `@layer components { }`로 감싸지 마라.** 플러그인이 utilities에 있으므로 진다.
   레이어 없이 그냥 쓴다.
3. `--tw-prose-kbd-shadows`는 플러그인이 `box-shadow`의 **색 자리**에 넣는다. `rgb(… / 10%)` 또는
   `color-mix(…)` 형태의 **완전한 색값**이어야 한다. 숫자 3개(`23 24 26`)를 넣으면 조용히 무효가 된다.
4. **네 곳의 기존 `prose-*` className을 지우지 마라.** `prose-p:text-ink-soft`는 `& :is(:where(p)…)`로
   컴파일돼 `--tw-prose-body`보다 **더 구체적으로** 이긴다. 지우면 본문 색이 `--tw-prose-body`로 떨어지는데
   값이 같아 화면은 안 변하지만 **표·목록에서 미묘한 회귀가 난다**(td는 `prose-td:` 쪽만 있고 privacy에는 그것도 없다).
   이번 라운드는 **추가만** 한다.
5. `--tw-prose-links: var(--accent)`는 `prose-a:text-accent`와 값이 같다. 중복이지만
   privacy 포함 네 곳 모두 `prose-a:text-accent`가 있으므로 실효는 없고, className을 나중에 걷어낼 때를 위한 안전망이다.

### 테스트

CSS는 vitest로 검증할 수 없다. **대신 회귀를 막는 지점을 문서·육안으로 고정한다.**

`app/__tests__/proseTokens.test.ts` (신설, 노드 환경):

```ts
it("prose 토큰 바인딩이 globals.css에 남아 있고 @theme 블록 안에 있지 않다", ...)
```
- `app/globals.css`를 읽어 `.prose {` 블록을 정규식으로 잘라낸다.
- 검증 1: 위 18개 변수 이름이 **전부** 그 블록 안에 있다(하나라도 빠지면 실패).
- 검증 2: `@theme` 블록의 시작~끝 구간에 `--tw-prose-`가 **0회**다 (함정 1의 재발 방지).
- 검증 3: `.prose {` 블록이 `@layer` 안에 있지 않다 — 블록 시작 위치 앞의 `@layer … {`와 `}` 개수를 세어 깊이 0인지 본다.

`it("네 곳의 prose className에 prose-p·prose-li·prose-strong·prose-a가 남아 있다")`
- 네 파일을 읽어 각각 `prose-p:text-ink-soft`를 포함하는지 확인 (함정 4의 재발 방지).

**육안 게이트**: 다크모드로 `/articles/faq`(인라인 코드 다수), `/articles/statistics`(인용문·표),
`/privacy`를 열어 ① 인라인 코드가 읽히는가 ② 인용문 좌측선이 배경보다 살짝 밝은 회색인가
③ 목록 마커가 보이는가 ④ 표 괘선이 `--line`인가.

---

## O2. `color-scheme` 선언

### 현재 — `app/globals.css` 186줄에 `color-scheme` **0회** (확인함)

네이티브 컨트롤 사용처(실측):
- `components/DeadlineTracker.tsx:130-134` — `type="date"` (달력 팝업 전체가 흰색)
- `ChecklistCard` 체크박스 (6단계 전부)
- `VariableTableBuilder` · `RandomSampler` · `SampleSizeCalculator`의 `<select>` / `type="number"`
- 문서 스크롤바 전역

### 변경 — 3곳

**(a) `:root` 블록, `:5`(`--bg: #ffffff;`) 바로 앞**

```css
:root {
  /* 네이티브 컨트롤(체크박스·date 팝업·select·스크롤바)과 기본 캔버스가
     테마를 따르게 한다. 이 선언이 없으면 브라우저가 항상 라이트로 그린다. */
  color-scheme: light;
  --bg: #ffffff;
```

**(b) `:41` `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {` 블록 안, `--bg: #101113;` 앞**

```css
    color-scheme: dark;
    --bg: #101113;
```

**(c) `:56` `:root[data-theme="dark"] {` 블록 안, `--bg: #101113;` 앞**

```css
  color-scheme: dark;
  --bg: #101113;
```

### `.rail-scroll`(`:174-177`)을 대체할 수 있나 — **아니다. 남긴다**

`.rail-scroll`은 `scrollbar-width: thin`으로 **폭**을 줄이는 것이 본체다. `color-scheme: dark`는
색만 바꾸고 폭은 안 건드린다. 다만 `scrollbar-color: var(--line) transparent`는 이제
`color-scheme`이 주는 기본 다크 스크롤바보다 **더 어둡게** 만든다(`--line` 다크 = `#2a2c2f`, 대 `--bg` 1.35:1 — 거의 안 보임).

**처방**: `scrollbar-color`의 thumb를 `--ink-soft`로 올리고 주석의 근거를 갱신한다.

```css
/* 단계 페이지 레일의 내부 스크롤바 — :root의 color-scheme이 색은 테마에
   맞춰 주지만 폭까지는 줄이지 않는다. 폭을 얇게 두되 thumb는 --line이 아니라
   --ink-soft로 잡는다 — --line은 다크에서 배경 대비 1.35:1이라 사라진다. */
.rail-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--ink-soft) transparent;
}
```

### 함정

1. **`html` 요소가 아니라 `:root`에 걸어야 한다** — 같은 요소지만, 기존 다크 블록이 `:root`
   셀렉터를 쓰므로 같은 선언 블록 안에 넣어야 세 상태(시스템 다크 / 명시 다크 / 명시 라이트)가 전부 맞는다.
2. `:root { color-scheme: light }`(특이도 0,1,0)와 `:root:not([data-theme="light"])`(0,2,0) —
   후자가 이기므로 순서와 무관하게 정상 동작한다. **`:root[data-theme="dark"]`(0,2,0)도 마찬가지.**
   명시 라이트(`data-theme="light"`)일 때는 `:not()`이 걸러 주고 `:root`의 `light`가 남는다. 세 경우 모두 맞다.
3. `app/layout.tsx:81-92`의 `theme-init` 스크립트가 첫 페인트 전에 `data-theme`을 확정하므로
   깜빡임은 없다. **이 스크립트를 옮기지 마라.**
4. **`app/layout.tsx:49-54`의 `viewport.themeColor`는 그대로 둔다.** 별개 메커니즘(주소창 색)이고 이미 맞다.
5. macOS Safari에서 `color-scheme: dark`는 `<select>`의 팝업까지 다크로 바꾼다. 의도한 동작이다.

### 테스트

`app/__tests__/proseTokens.test.ts`(O1과 같은 파일, 이름은 `globalsCss.test.ts`가 더 정확하다)에 추가:

```ts
it("color-scheme이 라이트 1곳·다크 2곳에 선언돼 있다", ...)
```
- `globals.css`에서 `:root {` 블록에 `color-scheme: light`가 있는지
- `@media (prefers-color-scheme: dark)` 블록과 `:root[data-theme="dark"]` 블록 **각각**에 `color-scheme: dark`가 있는지
- **다크 블록 두 개가 서로 같은 선언 집합을 갖는지** — 한쪽에만 넣는 실수가 이 저장소의 재발 유형이다.
  두 블록의 `--` 선언 이름 집합 + `color-scheme` 값을 뽑아 `toEqual`로 비교한다.

`it(".rail-scroll의 scrollbar-color thumb가 --line이 아니다")` — 회귀 방지 1줄.

---

## O3. SimpleChart 화면색 / 내보내기색 분리

### 현재 실측 — 하드코딩 위치

| 줄 | 값 | 역할 |
| --- | --- | --- |
| `:221` | `fill="white"` | **배경 전면** (파트 0-(3)) |
| `:231` `:266` `:292` | `stroke="#e6e7e9"` | 격자선 (라이트 `--line`) |
| `:232` `:267` `:293` | `fill="#6b7076"` | 눈금 숫자 (라이트 `--ink-soft`) |
| `:248` `:277` `:318` | `fill="#17181a"` | 항목 라벨 (라이트 `--ink`) |
| `:326` `:331` | `fill="#6b7076"` | 축 제목 |
| `:355` | `fill="white"` | 도넛 구멍 |
| `:372` | `fill="#17181a"` | 범례 텍스트 |
| `:24-33` | `COLORS[8]` | 데이터 계열 (O4) |

합 13곳 + 배경 2곳 + 팔레트 8색.

### 세 방식 비교

**(a) 렌더 시 JS로 색을 계산해 속성에 직접 박는다**

`getComputedStyle(document.documentElement).getPropertyValue('--ink')`를 읽어 state에 담고 `fill={ink}`.

- 장점: 내보내기가 자동으로 옳다(값이 이미 리터럴). 문자열 치환이 없다.
- 단점 1: **테마가 바뀌면 다시 읽어야 한다.** 이 사이트는 테마 소스가 셋이다 —
  `prefers-color-scheme` 변경, `data-theme` 속성 변경(테마 토글), 첫 마운트.
  `matchMedia` 리스너 + `MutationObserver` 둘을 달아야 한다. **차트 하나 때문에 테마 구독기가 생긴다.**
- 단점 2: 서버 렌더에서는 값을 모른다 → 첫 페인트가 빈 색이거나 라이트로 그렸다가 바뀐다(FOUC).
  `app/layout.tsx:76-80` 주석이 이 사이트가 FOUC를 얼마나 싫어하는지 말해 준다.
- 단점 3: jsdom 테스트에서 `getComputedStyle`이 CSS 변수를 안 푼다 → 기존 5개 테스트 전부가
  빈 문자열 색으로 렌더된다.
- **탈락.**

**(b) `currentColor` + 다운로드 시 치환**

화면 SVG를 `currentColor`로 그리고 부모에 `text-ink`를 건다.

- 단점 1: **`currentColor`는 색이 하나뿐이다.** 격자선·눈금·라벨·축제목·데이터 8색 = 12가지 색이 필요하다.
  중첩 `<g style="color: …">`로 나눌 수는 있지만 결국 그 style에 무엇을 쓸지가 원래 문제로 되돌아온다.
- **탈락(순수 형태로는).** 아래 (b′)로 변형한다.

**(c) 색 객체를 prop으로 받아 두 벌 렌더**

`<Chart colors={SCREEN}/>`를 화면에, 다운로드 시 `<Chart colors={EXPORT}/>`를 오프스크린에 렌더해 직렬화.

- 단점 1: 다운로드 경로가 React 렌더를 한 번 더 돌린다(`createRoot` + `flushSync` 또는 `renderToStaticMarkup`).
  `renderToStaticMarkup`을 클라이언트 번들에 끌어오면 `react-dom/server`가 통째로 딸려 온다.
- 단점 2: **두 벌이 어긋날 수 있다.** 화면 렌더와 내보내기 렌더가 서로 다른 코드 경로를 타면
  "화면엔 있는데 파일엔 없는 요소"가 조용히 생긴다. 이 도구는 학생이 논문에 넣는 그림을 만든다.
- 단점 3: 화면 쪽 `colors={SCREEN}`을 어떻게 만드나 → (a)의 문제가 그대로 돌아온다.
- **탈락.**

### 선택 — (b′) SVG 속성에 `var(--chart-*)` + 다운로드 시 **문자열 치환**

화면 SVG의 색 속성을 전부 `fill="var(--chart-label)"` 형태로 쓴다. React는 이것을 속성 문자열
그대로 DOM에 쓰고, 브라우저는 CSS 변수로 푼다. 변수는 `globals.css`의 `:root`/다크 두 블록에
정의하므로 **테마 구독기도 FOUC도 없다** — (a)의 세 단점이 전부 사라진다.

`XMLSerializer`가 뱉는 문자열에는 `var(--chart-label)`이 **리터럴로 남는다.** 여기서
순수 함수 하나로 치환한다. 이것이 유일하게 "사이트 밖에서 CSS 변수가 안 풀린다"를 다루는 지점이고,
**순수 함수라 테스트로 완전히 잠글 수 있다.**

> **핵심 안전 판단**: 치환 함수는 **던지지 않는다.** 알 수 없는 토큰은 `#17181a`(진한 잉크)로 떨어뜨린다.
> 이유 — 다운로드 핸들러에서 예외가 나면 학생은 아무 파일도 못 받는다. 알 수 없는 토큰이 생겨도
> "흰 배경 위 진한 색"이면 최악이라도 읽힌다. **흰 배경에 흰 글씨가 되는 경로를 문법적으로 없앤다.**
> 완전성은 런타임 예외가 아니라 **테스트**가 보증한다.

### 변경 1 — `app/globals.css`

`:root` 블록 안, `--danger: #dc2626;`(`:15`) 뒤 · `--font-display`(`:17`) 앞:

```css
  /* 간이 차트(components/SimpleChart.tsx) 전용 팔레트.
     차트는 SVG 속성에 var()를 그대로 쓰고, 내보내기 시점에
     lib/chartExport.ts가 이 이름들을 라이트 고정색으로 치환한다.
     그래서 여기 값을 고치면 lib/chartExport.ts의 라이트 값도 같이 고쳐야 한다
     (테스트가 이름 집합 일치를 잠근다). */
  --chart-bg: var(--bg);
  --chart-grid: var(--line);
  --chart-axis: var(--ink-soft);
  --chart-label: var(--ink);
  --chart-1: #2f6f4f;
  --chart-2: #4a90c2;
  --chart-3: #c2794a;
  --chart-4: #8b5fbf;
  --chart-5: #c24a6b;
  --chart-6: #b8a020;
  --chart-7: #4ab8b0;
  --chart-8: #6b7076;
```

다크 두 블록(`:41-52`, `:56-65`)에는 **O4의 8색만** 다시 선언한다(`--chart-bg/grid/axis/label`은
`--bg`/`--line`/`--ink-soft`/`--ink`를 참조하므로 자동으로 따라온다). O4 절에 정확한 값이 있다.

### 변경 2 — `lib/chartExport.ts` (신설)

```ts
/**
 * 차트 SVG 내보내기 — CSS 변수를 라이트 고정색으로 치환한다.
 *
 * 왜 필요한가: 화면의 SVG는 fill="var(--chart-label)"처럼 CSS 변수를 참조한다
 * (테마를 따라가게 하려고). 그런데 내려받은 .svg 파일은 사이트 밖에서 열리므로
 * 그 변수를 풀어 줄 :root가 없다. 브라우저·워드·한글은 값을 못 찾으면 색을
 * 무시하고 SVG 기본값(검정) 또는 상속값으로 그리는데, 배경 rect까지 무색이 되면
 * 학생이 논문에 넣은 그림이 깨진다.
 *
 * 왜 던지지 않는가: 다운로드 중 예외는 "파일이 아예 안 나온다"가 된다.
 * 모르는 토큰은 진한 잉크로 떨어뜨려 최악이라도 흰 배경 위에서 읽히게 한다.
 * "흰 배경에 흰 글씨"는 이 폴백 때문에 문법적으로 불가능하다.
 * 지도 완전성은 chartExport.test.ts가 SimpleChart.tsx를 읽어 대조한다.
 */

/** 알 수 없는 토큰의 폴백 — 흰 배경 위에서 반드시 읽히는 색이어야 한다. */
export const CHART_EXPORT_FALLBACK = "#17181a";

/** 내보내기 고정색 — 라이트 테마 값과 같아야 한다(globals.css :root). */
export const CHART_EXPORT_COLORS: Record<string, string> = {
  "chart-bg": "#ffffff",
  "chart-grid": "#e6e7e9",
  "chart-axis": "#6b7076",
  "chart-label": "#17181a",
  "chart-1": "#2f6f4f",
  "chart-2": "#4a90c2",
  "chart-3": "#c2794a",
  "chart-4": "#8b5fbf",
  "chart-5": "#c24a6b",
  "chart-6": "#b8a020",
  "chart-7": "#4ab8b0",
  "chart-8": "#6b7076",
};

/** SVG 직렬화 문자열의 var(--chart-*)를 전부 고정색으로 바꾼다. */
export function inlineChartColors(svgSource: string): string {
  return svgSource.replace(
    // 공백 허용: var( --chart-1 ) 도 잡는다. 폴백 인자가 붙은 형태는
    // SimpleChart가 쓰지 않으므로 의도적으로 안 잡는다 — 잡으려다
    // 중첩 괄호를 잘못 세면 SVG가 깨진다.
    /var\(\s*--(chart-[a-z0-9-]+)\s*\)/g,
    (_match, token: string) =>
      CHART_EXPORT_COLORS[token] ?? CHART_EXPORT_FALLBACK,
  );
}
```

### 변경 3 — `components/SimpleChart.tsx`

**`:24-33`의 `COLORS` 교체:**

```tsx
// 화면에서는 CSS 변수를 따라가 테마에 맞춰지고(globals.css의 :root/다크 블록),
// 내보낼 때는 lib/chartExport.ts가 라이트 고정색으로 치환한다.
// 색을 늘리려면 globals.css와 CHART_EXPORT_COLORS 양쪽을 같이 늘려야 한다
// (chartExport.test.ts가 불일치를 잡는다).
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];
```

**`:83-100`의 `downloadSvg` — 한 줄만 바뀐다:**

```tsx
  function downloadSvg() {
    const svg = document.getElementById("simple-chart-svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    // 화면 SVG는 CSS 변수를 참조한다. 파일은 사이트 밖에서 열리므로
    // 여기서 라이트 고정색을 인라인으로 박는다 — 근거는 lib/chartExport.ts.
    const source = inlineChartColors(serializer.serializeToString(svg));
    const blob = new Blob(
      [`<?xml version="1.0" standalone="no"?>\n${source}`],
      { type: "image/svg+xml;charset=utf-8" },
    );
    // 이하 :92-99 그대로
  }
```

import 추가(`:4` 뒤): `import { inlineChartColors } from "@/lib/chartExport";`

**색 속성 13곳 치환 표** (붙여넣을 값):

| 줄 | 현재 | 변경 후 |
| --- | --- | --- |
| `:221` | `fill="white"` | `fill="var(--chart-bg)"` |
| `:231` | `stroke="#e6e7e9"` | `stroke="var(--chart-grid)"` |
| `:232` | `fill="#6b7076"` | `fill="var(--chart-axis)"` |
| `:248` | `fill="#17181a"` | `fill="var(--chart-label)"` |
| `:266` | `stroke="#e6e7e9"` | `stroke="var(--chart-grid)"` |
| `:267` | `fill="#6b7076"` | `fill="var(--chart-axis)"` |
| `:277` | `fill="#17181a"` | `fill="var(--chart-label)"` |
| `:292` | `stroke="#e6e7e9"` | `stroke="var(--chart-grid)"` |
| `:293` | `fill="#6b7076"` | `fill="var(--chart-axis)"` |
| `:318` | `fill="#17181a"` | `fill="var(--chart-label)"` |
| `:326` | `fill="#6b7076"` | `fill="var(--chart-axis)"` |
| `:331` | `fill="#6b7076"` | `fill="var(--chart-axis)"` |
| `:355` | `fill="white"` | `fill="var(--chart-bg)"` |
| `:372` | `fill="#17181a"` | `fill="var(--chart-label)"` |

### 함정

1. **`:355`의 도넛 구멍을 잊으면 다크에서 도넛 가운데가 흰 원으로 남는다.** 표의 14행 전부를 고쳐라.
2. **React는 `fill`을 속성으로 그대로 쓴다** — `style` 객체가 아니므로 camelCase 변환·값 검증이 없다.
   `fill={COLORS[i % COLORS.length]}`에 `"var(--chart-3)"`이 들어가도 그대로 나간다. 확인 완료.
3. **기존 테스트 5개가 배경 rect를 `width !== "640"`으로 걸러낸다**(`SimpleChart.test.tsx:16-18,36-38,51-53`).
   색만 바꾸므로 이 필터는 안 깨진다. **`W` 상수나 rect 구조를 건드리지 마라.**
4. `stroke`/`fill` 속성에 `var()`를 쓰는 것은 SVG2 + CSS Values다. **모든 상용 브라우저에서 동작하지만
   `<img src="chart.svg">`로 임베드하면 외부 `:root`가 안 닿는다.** 그래서 내보내기 치환이 필수다 —
   이 각주가 곧 이 항목이 존재하는 이유다.
5. **`CHART_EXPORT_COLORS`의 라이트 값을 `globals.css`의 `:root` 값과 다르게 쓰지 마라.**
   다르면 "화면에서 본 색과 내려받은 색이 다르다"가 된다. 테스트가 이걸 잡는다(아래).
6. `inlineChartColors`의 정규식은 `var(--chart-1, red)` 같은 **폴백 인자 형태를 안 잡는다.**
   의도한 제약이다. SimpleChart에서 폴백 인자를 쓰지 마라 — 테스트가 그 형태를 발견하면 실패시킨다.

### 테스트

**`lib/__tests__/chartExport.test.ts` (신설, node 환경)**

```ts
it("var(--chart-*)를 전부 고정색으로 바꾸고 var(가 하나도 남지 않는다 (정상)")
```
- 입력: `'<rect fill="var(--chart-bg)"/><text fill="var(--chart-label)">a</text>'`
- 출력에 `#ffffff`·`#17181a`가 있고 `"var("`가 `0`회.

```ts
it("알 수 없는 토큰은 던지지 않고 진한 잉크로 떨어진다 (실패 격리)")
```
- 입력 `'fill="var(--chart-99)"'` → `#17181a`. **`#ffffff`가 아님을 명시적으로 확인** —
  이것이 "흰 배경에 흰 글씨" 실패 모드를 막는 단언이다.

```ts
it("공백이 섞인 var( --chart-1 )도 잡는다 (경계)")
```

```ts
it("chart 계열이 아닌 var()는 건드리지 않는다 (거짓 양성 방지)")
```
- `'fill="var(--ink)"'` → 그대로.

```ts
it("SimpleChart.tsx가 쓰는 모든 --chart-* 토큰이 CHART_EXPORT_COLORS에 있다 (조용한 누락 방지)")
```
- `fs.readFileSync("components/SimpleChart.tsx")`에서 `/--chart-[a-z0-9-]+/g`를 전부 뽑아 집합으로.
- `Object.keys(CHART_EXPORT_COLORS)`의 상위집합인지 확인. **한 방향만 보지 말고 양방향으로**:
  쓰이지 않는 키가 남아 있어도 실패시킨다(죽은 색이 쌓이는 것을 막는다).

```ts
it("CHART_EXPORT_COLORS의 값이 globals.css의 :root 값과 같다 (화면색 = 내보내기색)")
```
- `app/globals.css`의 `:root {` … 첫 `}`까지를 잘라 `--chart-N: #xxxxxx;`를 파싱.
- `--chart-1`~`--chart-8`을 `CHART_EXPORT_COLORS`와 대조.
- `--chart-bg/grid/axis/label`은 `var(--bg)` 등을 가리키므로 **`--bg`·`--line`·`--ink-soft`·`--ink`의
  `:root` 값과** 대조한다.

```ts
it("SimpleChart.tsx에 폴백 인자를 쓴 var(--chart-*, …) 형태가 없다 (정규식 미탐 방지)")
```

**`components/__tests__/SimpleChart.test.tsx` 추가 2건**

```ts
it("색 속성이 하드코딩 hex가 아니라 var(--chart-*)다")
```
- 렌더 후 `container.querySelectorAll("svg [fill], svg [stroke]")`를 순회.
- 각 `fill`/`stroke` 값이 `"none"` 이거나 `/^var\(--chart-/`에 맞는지. **`#`으로 시작하는 값이 0개**.
- 이 하나가 "13곳 중 하나를 빠뜨렸다"를 잡는다. 표의 14행을 사람이 세는 것보다 낫다.

```ts
it("내려받는 SVG 문자열에 var(가 남지 않고 배경이 흰색이다 (내보내기 계약)")
```
- jsdom에서 `URL.createObjectURL`·`Blob`을 스텁하고 `SVG로 내려받기` 버튼을 클릭.
- 캡처한 Blob 내용(또는 `inlineChartColors`에 넘긴 문자열)을 검사:
  `"var("` 0회, 그리고 배경 rect가 `fill="#ffffff"`.
- **jsdom에 `URL.createObjectURL`이 없다.** `beforeEach`에서
  `URL.createObjectURL = vi.fn(() => "blob:x"); URL.revokeObjectURL = vi.fn();`로 채워라.
  `Blob.prototype.text()`는 jsdom 30에 있다(`await blob.text()`).
  없으면 `inlineChartColors`를 `vi.spyOn`으로 감싸 인자·반환을 보는 쪽으로 낮춘다.

---

## O4. 다크용 데이터 계열 팔레트

### 실측 정정

백로그는 `#2f6f4f`가 다크 배경 대비 "약 2.6:1"이라 했다. **실제 계산은 3.16:1이다**(WCAG 상대휘도).
비텍스트 최소 3:1을 아슬하게 넘긴다. 그러나 전체 그림은 백로그의 방향이 맞다 —
라이트 기준 중명도 색이라 다크에서 여유가 없다.

라이트 팔레트 8색 대 `#101113`:

| 색 | 대 다크 `#101113` | 대 흰색 |
| --- | --- | --- |
| `#2f6f4f` | **3.16** | 5.99 |
| `#4a90c2` | 5.45 | 3.47 |
| `#c2794a` | 5.51 | 3.43 |
| `#8b5fbf` | 4.04 | 4.68 |
| `#c24a6b` | 4.04 | 4.68 |
| `#b8a020` | 7.28 | **2.60** |
| `#4ab8b0` | 7.89 | **2.39** |
| `#6b7076` | 3.78 | 4.99 |

> **범위 밖 발견 — 운영자 판단이 필요하다.** 라이트에서 `#b8a020`(2.60)과 `#4ab8b0`(2.39)이
> **흰 배경 대비 3:1에 미달**한다. 지금도 그렇고, 내보낸 SVG에서도 그렇다.
> O4는 "다크 팔레트"만 판정됐으므로 이번 라운드에서 라이트 값을 바꾸지 않는다 —
> **바꾸면 이미 배포된 그림과 색이 달라진다.** 백로그에 새 항목으로 올릴 것을 권한다.

### 변경 — 다크 8색

`app/globals.css`의 다크 블록 **두 곳 모두**(`:41-52`의 `@media` 안, `:56-65`)에 추가.
`--danger` 선언 뒤에 붙인다.

```css
    /* 차트 계열색 다크판 — 라이트 값(:root)은 밝은 배경 기준 중명도라
       #101113 위에서 여유가 없다(#2f6f4f = 3.16:1). globals.css:47이 accent를
       #2f6f4f → #4fa377로 올린 것과 같은 판단을 차트에도 적용한다.
       전부 --bg(#101113) 대비 6:1 이상 — 비텍스트 최소 3:1의 두 배.
       색상(hue) 순서는 라이트와 같게 유지한다: 초록·파랑·주황·보라·자홍·노랑·청록·회색. */
    --chart-1: #4fa377;
    --chart-2: #7cb8e0;
    --chart-3: #e0a06a;
    --chart-4: #b58fe0;
    --chart-5: #e8869e;
    --chart-6: #d4c04a;
    --chart-7: #5fd6cc;
    --chart-8: #93989e;
```

검산(대 `#101113`): 6.15 / 8.81 / 8.46 / 7.17 / 7.50 / 10.29 / 10.77 / 6.50. 전부 통과.
`--chart-1`은 `--accent`의 다크값 `#4fa377`과 같고, `--chart-8`은 `--ink-soft`의 다크값 `#93989e`와 같다 —
라이트에서 `--chart-1 = --accent`, `--chart-8 = --ink-soft`였던 관계를 그대로 옮긴 것이다.

### 함정

1. **두 다크 블록 중 한쪽만 고치는 실수.** 시스템 다크로만 테스트하면 명시 토글에서 안 먹고,
   토글로만 테스트하면 시스템 다크에서 안 먹는다. O2의 테스트("두 다크 블록의 선언 이름 집합이 같다")가 이것도 잡는다.
2. **`CHART_EXPORT_COLORS`는 절대 다크값으로 두지 마라.** 내보내기는 라이트 고정이다.
   O3의 테스트 "CHART_EXPORT_COLORS = :root 값"이 `:root`(라이트)만 보므로 자동으로 잡힌다.
3. 데이터 계열이 8개를 넘으면 `COLORS[i % 8]`로 순환한다 — 기존 동작이고 안 바꾼다.

### 테스트

`lib/__tests__/chartExport.test.ts`에 추가:

```ts
it("다크 팔레트 8색이 다크 --bg 대비 3:1 이상이다 (접근성 계약)")
```
- `globals.css`의 `:root[data-theme="dark"]` 블록을 파싱해 `--chart-1`~`8`과 `--bg`를 뽑는다.
- 테스트 파일 안에 WCAG 상대휘도 계산기를 **직접 둔다**(라이브러리 추가 없이 12줄).
- 각 색이 `>= 3` 인지. 실패 메시지에 색과 실제 비율을 담아라.

```ts
it("두 다크 블록의 --chart-* 값이 동일하다 (한쪽만 고치는 실수 방지)")
```

---

# 파트 2 — 묶음 2 (SEO 소품) 11건

## A2. sitemap `lastModified`를 문서별 날짜로

### 현재 — `app/sitemap.ts:8`

```ts
// 빌드 시점 고정 — 배포할 때마다 갱신된다
const lastModified = new Date();
```

이 값을 `:19`~`:82`의 **모든** 항목이 공유한다. 실측: 정적 5 + 단계 6 + 자료실 31 + 사례 6 + `/showcase` 1 = **49 URL**.

### 변경 — `app/sitemap.ts`

`:8`을 바꾸고 두 `map`에 날짜를 넣는다.

```ts
// 코드와 함께 바뀌는 페이지(홈·가이드·단계·도구·목록)는 빌드 시각을 쓴다.
// 문서·사례는 콘텐츠가 진실 원본이라 각자의 날짜를 쓴다 — 배포마다 49개
// URL 전부가 "방금 수정됨"으로 나가면 크롤러가 이 신호를 통째로 버린다.
const buildTime = new Date();

/**
 * "2026-08-30" → Date. 파싱이 실패하면 빌드 시각으로 떨어진다.
 * 던지지 않는 이유: sitemap 하나 때문에 배포 전체가 막히는 것보다,
 * 그 URL만 예전 동작(빌드 시각)으로 돌아가는 편이 낫다. 잘못된 날짜
 * 자체는 lib/frontmatter.ts(S6)와 아래 테스트가 막는다.
 */
function contentDate(value: string | undefined): Date {
  if (!value) return buildTime;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? buildTime : d;
}
```

그다음 `:8`의 `lastModified` 식별자를 **전부 `buildTime`으로 바꾼다**(정적 5곳 + 단계 map 1곳 +
`/tools` + `/articles` + `/about` + `/showcase` = 총 10곳). 그리고 두 map만 바꾼다:

```ts
    ...articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: contentDate(article.updated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
```

```ts
          ...showcases.map((showcase) => ({
            url: `${SITE_URL}/showcase/${showcase.slug}`,
            lastModified: contentDate(showcase.published),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          })),
```

### 함정

1. **`lastModified` 식별자를 남겨 두고 `buildTime`을 새로 만들면** 정적 항목이 옛 상수를 계속 쓴다.
   `lastModified,` (축약형 속성)로 쓰인 자리가 많으니 **`lastModified: buildTime,`으로 전부 풀어 써라.**
   축약형을 놔둔 채 상수 이름만 바꾸면 타입 에러로 잡히니 안전하지만, 한 번에 고쳐라.
2. `new Date("2026-08-30")`은 **UTC 자정**으로 파싱된다. `<lastmod>2026-08-30T00:00:00.000Z</lastmod>`가
   나간다. 하루 어긋나 보일 수 있지만 크롤러에겐 무해하고, KST를 붙이려 `T00:00:00+09:00`을 만들면
   frontmatter 규약이 늘어난다. **그대로 둔다.**
3. `/articles`(목록)·`/showcase`(목록)는 `buildTime`을 유지한다 — 실제로 배포마다 바뀐다.
4. T13을 하지 않으면 **사례 6개 URL은 여전히 같은 날짜**다. A2는 그래도 자료실 31개에서 값을 낸다.

### 테스트 — `app/__tests__/sitemap.test.ts` (또는 batch05 T6의 `routes.test.ts`에 추가)

```ts
it("자료실 URL의 lastModified가 문서의 updated를 따라간다 (정상)")
```
- `sitemap()`을 부르고 `/articles/`로 시작하는 항목만 뽑는다.
- 각 항목의 `lastModified`를 ISO 앞 10자로 자른 값이 대응 문서의 `updated`와 같은지.

```ts
it("자료실 URL의 lastModified가 서로 다른 값을 갖는다 (공유 상수 재발 방지)")
```
- `new Set(...).size > 1`. **이것이 백로그가 요구한 단언이다.**

```ts
it("정적·단계 URL은 하나의 빌드 시각을 공유한다 (경계)")
```
- 홈·`/guide`·6개 단계·`/tools`·`/articles`의 `lastModified`가 전부 같은 값인지.

```ts
it("updated가 빈 문서가 있어도 sitemap이 던지지 않는다 (실패 격리)")
```
- `contentDate`를 export해 직접 호출: `contentDate(undefined)`·`contentDate("아무말")`이
  `Number.isNaN` 아닌 Date를 준다.

---

## T13 + M4. 사례 정렬 결정성과 게재일

### 실측

`content/showcase/`에 6편. `published`가 **전부 `2026-09-05`**로 동일(6편 확인).
파일명 접두사 `01-`이 둘(`01-lysozyme-charge-aggregation.mdx`, `01-trem2-chain.mdx`).
`lib/showcase.ts:51`:

```ts
    .sort((a, b) => (a.published < b.published ? 1 : -1));
```

`published`가 전부 같으므로 비교가 **항상 `-1`**이다. `Array.prototype.sort`는 안정 정렬이므로
결과는 `readdirSync`의 순서 그대로다 — 즉 **파일시스템 순서**다. 백로그의 진단이 정확하다.

### M4 변경 — `lib/showcase.ts:45-52` (먼저, 단독으로 안전)

```ts
/** 프로덕션 빌드에서만 캐시 — 근거와 dev 함정은 lib/contentCache.ts 참고. */
export const getAllShowcases = buildOnlyCache((): Showcase[] => {
  if (!fs.existsSync(SHOWCASE_DIR)) return [];
  return fs
    .readdirSync(SHOWCASE_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readShowcaseFile)
    // published 내림차순. 같은 날 올린 사례가 여럿이면(초기 6편이 그렇다)
    // 비교가 항상 -1이 되어 안정 정렬이 readdirSync 순서, 즉 파일시스템
    // 순서를 그대로 남긴다. 파일 하나만 더해도 목록이 통째로 밀릴 수 있으므로
    // slug를 2차 키로 둬서 결정적으로 만든다. localeCompare를 쓰지 않는 이유는
    // 실행 환경의 ICU 유무에 따라 결과가 달라지기 때문이다 — slug는 ASCII다.
    .sort((a, b) => {
      if (a.published !== b.published) return a.published < b.published ? 1 : -1;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
});
```

### T13 — **운영자 판단이 필요하다. 임의로 날짜를 지어내지 마라**

백로그는 "사례에 실제 게재일"을 요구한다. 그런데 **6편은 실제로 같은 날 올라갔다.**
날짜를 흩뿌리면 sitemap의 `<lastmod>`가 다양해지는 대신 **사실이 아닌 값을 검색엔진에 낸다.**
`lib/jsonLd.ts:8-9`가 명시한 이 저장소의 원칙("모르는 값은 지어내지 않는다")과 정면으로 충돌한다.

**두 갈래를 제시하고 운영자에게 묻는다:**

- **(가) 진실 유지 (권장).** `published`를 `2026-09-05`로 두고, M4의 tie-break만으로 결정성을 얻는다.
  sitemap의 사례 6 URL은 같은 날짜를 갖는다 — **그것이 사실이므로 손해가 아니다.**
  A2의 실익은 자료실 31 URL에서 이미 나온다.
- **(나) 실제 게재일 기입.** 운영자가 6편 각각을 언제 검토·게재했는지 **기억하고 있다면** 그 날짜를 넣는다.
  기억이 없으면 (가)로 간다.

**어느 쪽이든 파일명 접두사 중복은 정리한다** — 이건 사실 문제가 아니라 규약 문제다.
정렬 결과(M4 적용 후, published 동일 시 slug 오름차순)에 맞춰 재부여:

```
eeg-binaural                  → 01-eeg-binaural.mdx
focused-ultrasound-bbb        → 02-focused-ultrasound-bbb.mdx
lysozyme-charge-aggregation   → 03-lysozyme-charge-aggregation.mdx
sex-difference-adr            → 04-sex-difference-adr.mdx
trem2-chain                   → 05-trem2-chain.mdx
aria-deep-learning            → 06-aria-deep-learning.mdx
```

**`git mv`로 옮겨라.** `slug`는 frontmatter에 있으므로 **URL은 하나도 안 바뀐다**(확인함:
`readShowcaseFile`이 `data.slug`만 쓰고 파일명은 안 본다). 접두사는 사람이 디렉터리를 볼 때의
순서 힌트일 뿐이다.

### 함정

1. **파일명을 바꿔도 URL이 안 바뀌는지 반드시 확인하고 옮겨라.** `lib/showcase.ts:29-42`가
   `data.slug`만 읽는다 — 확인 완료. 그래도 `git mv` 후 `npm run build`로 `/showcase/eeg-binaural`가
   생성되는지 눈으로 봐라.
2. batch05 커밋 9(P6-a)가 같은 6개 파일의 frontmatter에 `lesson`을 더한다. **먼저 들어간 쪽 뒤에 하라** —
   `git mv`와 내용 수정이 같은 diff에 섞이면 리뷰가 불가능해진다. `git mv`만 하는 커밋을 따로 둬라.
3. `buildOnlyCache`(`lib/contentCache.ts`)가 프로덕션에서 결과를 캐시한다. 정렬 변경은 캐시 **안쪽**이라
   문제없다.

### 테스트 — `lib/__tests__/showcase.test.ts` (batch05 커밋 9가 신설하면 거기에 추가)

```ts
it("published가 같아도 slug 오름차순으로 결정적이다 (M4)")
```
- `getAllShowcases()`를 두 번 불러 같은 순서인지 — 이건 캐시 때문에 무의미하다. **대신**
  같은 `published`를 가진 인접 쌍에 대해 `a.slug < b.slug`인지 확인한다.

```ts
it("published 내림차순이 우선한다 (경계)")
```
- 전체를 훑어 `a.published >= b.published`가 유지되는지.

```ts
it("모든 사례가 YYYY-MM-DD 형식의 published를 갖는다")
```
- `/^\d{4}-\d{2}-\d{2}$/`. A2의 `contentDate`가 폴백으로 조용히 삼키는 것을 여기서 잡는다.

---

## A3. Article JSON-LD에 `image`

### 현재 — `lib/jsonLd.ts:17-52`

`ArticleJsonLdInput`에 이미지 필드가 없고 `articleJsonLd`가 `image`를 안 낸다.
`:8-9` 주석: "모르는 필드(예: 이미지, 정확한 발행일)는 지어내지 않고 아예 뺀다."

호출부는 2곳:
- `app/articles/[slug]/page.tsx:64-69`
- `app/showcase/[slug]/page.tsx:42-47`

OG 라우트는 실재한다: `app/articles/[slug]/opengraph-image.tsx`, `app/showcase/[slug]/opengraph-image.tsx`.
둘 다 `generateStaticParams`로 빌드 시 구워진다.

### 변경 1 — `lib/jsonLd.ts`

`:8-9` 주석을 **고쳐 쓴다**(원칙 문장은 유지, 예외를 덧붙인다):

```ts
 * 원칙: 실제로 아는 값만 넣는다. 모르는 필드(예: 정확한 발행일)는
 * 지어내지 않고 아예 뺀다.
 *
 * image는 이 원칙의 예외가 아니라 원칙의 적용이다 — opengraph-image 파일
 * 규약(app/articles/[slug]/opengraph-image.tsx,
 * app/showcase/[slug]/opengraph-image.tsx)이 생긴 뒤로 이미지 URL은
 * 지어내는 값이 아니라 아는 값이 됐다. 그래서 호출부가 경로를 넘길 때만
 * 넣고, 안 넘기면 여전히 뺀다.
```

`:17-24` 타입:

```ts
export type ArticleJsonLdInput = {
  title: string;
  description: string;
  /** "2026-08-30" 형식. */
  updated: string;
  /** 이 문서의 경로, 예: "/articles/faq" */
  path: string;
  /**
   * 대표 이미지 경로. opengraph-image 라우트가 있는 페이지만 넘긴다.
   * 없으면 image 필드 자체를 내지 않는다 (지어내지 않는다).
   */
  imagePath?: string;
};
```

`:26-52` 본문 — `inLanguage: "ko",` 뒤(닫는 `}` 앞)에:

```ts
    inLanguage: "ko",
    // 구글 Article 리치결과는 image를 요구한다. 값을 아는 페이지만 낸다.
    ...(input.imagePath ? { image: [toAbsoluteUrl(input.imagePath)] } : {}),
  };
```

> `image`를 **배열**로 내는 이유: schema.org Article의 `image`는 단수/복수 모두 허용하지만
> 구글 문서가 "여러 종횡비를 배열로 제공하라"를 권한다. 지금은 1200×630 하나뿐이라 원소 1개다.
> 배열로 두면 나중에 정사각·4:3을 더할 때 스키마가 안 바뀐다.

### 변경 2 — 호출부 2곳

`app/articles/[slug]/page.tsx:64-69`:

```tsx
    articleJsonLd({
      title: article.title,
      description: article.description,
      updated: article.updated,
      path: `/articles/${article.slug}`,
      imagePath: `/articles/${article.slug}/opengraph-image`,
    }),
```

`app/showcase/[slug]/page.tsx:42-47`:

```tsx
    articleJsonLd({
      title: item.title,
      description: item.summary,
      updated: item.published,
      path: `/showcase/${item.slug}`,
      imagePath: `/showcase/${item.slug}/opengraph-image`,
    }),
```

### 함정 — **여기가 이 항목의 유일한 불확실성이다**

**Next의 file-convention OG 이미지가 실제로 어떤 URL로 나가는지 빌드 산출물에서 확인해야 한다.**
Next는 `<meta property="og:image">`에 `…/opengraph-image` 뒤에 캐시 무효화용 쿼리
(`?<id>`) 또는 경로 세그먼트를 붙이는 버전이 있었다. 쿼리가 붙는 형태라면 **경로만으로도 200이 나오지만**,
경로 자체가 다르면(예: `/opengraph-image-<hash>`) JSON-LD가 404를 가리키게 된다.

**구현 시 판단 필요 — 반드시 이 절차를 밟아라:**

```
npm run build && npx next start
curl -s http://localhost:3000/articles/faq | grep 'og:image'
```

`content=` 값의 **경로 부분**을 그대로 `imagePath`에 쓴다. 쿼리(`?…`)는 빼도 된다(캐시 힌트일 뿐).
그다음 그 경로가 실제로 200 + `image/png`인지 확인:

```
curl -sI http://localhost:3000/articles/faq/opengraph-image | head -3
```

**이 확인 없이 커밋하지 마라.** 틀리면 리치결과 자격이 생기는 게 아니라 "이미지 URL이 깨진 Article"이 된다.
확인 결과가 예상과 다르면 `lib/site.ts` 옆에 `ogImagePath(kind, slug)` 헬퍼를 두고 두 호출부가 공유하게 하라.

부가 함정:
- **`app/opengraph-image.tsx`(사이트 루트)는 건드리지 않는다.** A3은 Article 타입에만 해당한다.
- `metadataBase`(`app/layout.tsx:21`)는 `<meta>`에만 적용되고 JSON-LD에는 안 닿는다.
  그래서 `toAbsoluteUrl`(`lib/jsonLd.ts:13-15`)로 직접 절대화하는 것이 맞다.

### 테스트 — `lib/__tests__/jsonLd.test.ts`에 추가

```ts
it("imagePath를 넘기면 image를 절대 URL 배열로 낸다 (정상)")
```
- `articleJsonLd({…, imagePath: "/articles/faq/opengraph-image"})`
- `schema.image`가 배열, 길이 1, `/^https?:\/\/.+\/articles\/faq\/opengraph-image$/`.

```ts
it("imagePath가 없으면 image 키 자체가 없다 (지어내지 않는다)")
```
- `expect("image" in schema).toBe(false)`. **`toBeUndefined()`가 아니라 `in`으로** —
  `image: undefined`가 들어가면 `JSON.stringify`가 지우긴 하지만 계약이 흐려진다.

```ts
it("빈 문자열 imagePath는 image를 만들지 않는다 (경계)")
```

`app/__tests__/`에 (선택, batch05 T6 파일에 붙여도 된다):

```ts
it("자료실·사례 상세가 자기 opengraph-image 경로를 JSON-LD에 넘긴다")
```
- 두 `page.tsx`를 문자열로 읽어 `imagePath:` 줄이 각각 `articles/`/`showcase/` + `opengraph-image`를
  포함하는지. 조잡하지만 **호출부 누락**이라는 실제 회귀를 잡는다.

---

## A4. 자료실 상세에 광고 슬롯 1개

### 현재 — `app/articles/[slug]/page.tsx`에 `AdSlot` import 0회 (확인함)

`AdSlot` 사용처는 `app/guide/page.tsx:99`, `app/guide/[stage]/page.tsx:191`, `app/layout.tsx:129,132` 뿐.

패턴 원본 — `app/guide/[stage]/page.tsx:189-192`:

```tsx
        <div className="2xl:hidden">
          <AdSlot label="본문 하단 광고" />
        </div>
```

### 변경 — `app/articles/[slug]/page.tsx`

import 추가 (`:13` 뒤):

```tsx
import { AdSlot } from "@/components/AdSlot";
```

**삽입 위치: `:150`(prose `</div>`)과 `:152`(`{stage && (`) 사이.**

```tsx
      </div>

      {/* 본문 끝 ~ "이어지는 단계" 사이. 2xl 이상에서는 레이아웃의 좌우 레일이
          이미 광고를 싣고 있으므로 겹치지 않게 숨긴다 — 단계 페이지
          (guide/[stage]/page.tsx)와 같은 패턴이다.
          본문 중간 삽입은 하지 않는다: 애드센스 재검토 중 콘텐츠/광고 비율을
          건드리지 않는다. */}
      <div className="2xl:hidden">
        <AdSlot label="자료실 본문 하단 광고" />
      </div>

      {stage && (
```

### 함정

1. **batch05 커밋 7(O5)·커밋 8(O7)이 같은 파일을 만진다.** 커밋 7은 `<AdRails />`를 넣고,
   커밋 8은 `:167` 뒤에 도구 카드를 넣는다. **A4를 그 뒤에 하라.** 위 줄 번호는 둘 다 안 들어간 상태 기준이다.
   먼저 들어갔다면 "prose `</div>` 바로 다음"이라는 **위치 규칙**으로 찾아라(줄 번호가 밀린다).
2. `AdSlot`은 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 없으면 `null`을 반환한다(`components/AdSlot.tsx:49`).
   현재 환경변수는 미설정(E3 대기)이므로 **화면상 아무것도 안 보이는 것이 정상**이다.
   "안 나온다"고 다른 걸 고치지 마라.
3. `AdSlot`은 `"use client"`다. `page.tsx`는 서버 컴포넌트지만 클라이언트 컴포넌트를 자식으로 두는 건 정상이다.
4. **`my-8`이 `AdSlot` 안에 이미 있다**(`sizeClass = "my-8 h-24 w-full"`). 바깥 div에 `mt-*`를 또 주지 마라.

### 테스트 — `app/__tests__/adSlots.test.ts` (batch05 커밋 7이 `adRails.test.ts`를 만들면 거기에)

```ts
it("자료실 상세에 2xl:hidden AdSlot이 정확히 1개 있다")
```
- `app/articles/[slug]/page.tsx`를 읽어 `<AdSlot`의 등장 횟수가 1, 그리고 `2xl:hidden`이 그 앞 200자 안에 있는지.

```ts
it("본문(prose) 블록 안에 AdSlot이 없다 (중간 삽입 금지)")
```
- `prose prose-neutral`이 나오는 위치와 `<AdSlot` 위치를 비교해 후자가 뒤인지 —
  "콘텐츠/광고 비율을 건드리지 않는다"는 판정을 코드로 잠근다.

---

## A5. 단계 페이지 "함께 읽기" 4편 상한

### 현재 — `app/guide/[stage]/page.tsx`

`:56` `const relatedArticles = getArticlesForStage(stage.slug);`
`:82` `relatedArticleCount={relatedArticles.length}` (StageRail로 전달)
`:164` `{relatedArticles.length > 0 && (`
`:171` `{relatedArticles.map((article) => (` — **상한 없음**

실측: `topic`·`prior-research`가 각 8편(백로그와 일치).

### 변경

**(1) `:56` 뒤에 상한과 절단:**

```tsx
  const relatedArticles = getArticlesForStage(stage.slug);
  // 8편까지 늘어난 단계가 둘 있다(topic, prior-research). 목록이 길어지면
  // 본문 끝의 "다음 단계"가 화면 밖으로 밀려 진행 흐름이 끊긴다.
  // 4편만 보이고 나머지는 자료실 카테고리 앵커로 넘긴다.
  const RELATED_LIMIT = 4;
  const shownArticles = relatedArticles.slice(0, RELATED_LIMIT);
  const hasMoreArticles = relatedArticles.length > RELATED_LIMIT;
  // "더 보기"가 가리킬 카테고리 — 보이는 4편이 한 카테고리에 몰려 있을 때만
  // 앵커를 건다. 섞여 있으면 앵커가 오히려 오해를 부르므로 목록 전체로 보낸다.
  const shownCategories = new Set(
    shownArticles.map((a) => a.category).filter(Boolean),
  );
  const moreHref =
    shownCategories.size === 1
      ? `/articles#${[...shownCategories][0]}`
      : "/articles";
```

**(2) `:82` — 레일 배지가 실제 노출 수와 맞게:**

```tsx
        relatedArticleCount={shownArticles.length}
```

**(3) `:171` map 대상 교체 + `:189`(`</ul>`) 뒤 "더 보기" 링크:**

```tsx
              {shownArticles.map((article) => (
```

```tsx
            </ul>
            {hasMoreArticles && (
              <Link
                href={moreHref}
                className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
              >
                자료실에서 더 보기 →
              </Link>
            )}
          </div>
```

### 함정

1. **`relatedArticleCount`를 `relatedArticles.length`로 남겨 두면** 레일에 "8"이 뜨는데 본문엔 4편이다.
   `StageRail`이 이 숫자를 어디에 쓰는지 확인하고 바꿔라 — 목차 배지라면 노출 수가 맞다.
   **만약 "이 단계와 관련된 문서가 몇 편 있는가"라는 정보 배지라면 8이 맞다.**
   `components/StageRail.tsx`를 읽고 결정하라 — **구현 시 판단 필요.** 기본 권고는 `shownArticles.length`다
   (목차는 화면에 있는 것을 세는 물건이다).
2. `:164`의 조건 `relatedArticles.length > 0`은 그대로 둬도 맞다(`shownArticles`도 같이 0이 된다).
   굳이 바꾸지 마라 — diff가 커진다.
3. 앵커 대상은 실재한다: `app/articles/page.tsx:80`이 `id={key}`(= `topic`/`search`/`method`/`writing`)를
   단다. **확인 완료.**
4. `Link`는 이미 이 파일에서 import돼 있다(`:86` 등에서 사용). 추가 import 불필요.
5. 자르는 순서는 `getArticlesForStage`의 순서 = `getAllArticles()`의 카테고리·order 순이다.
   **결정적이다.** 무작위나 최신순이 아니다 — 그래서 매 빌드 같은 4편이 나온다.

### 테스트 — `lib/__tests__/articles.test.ts`에 추가

```ts
it("단계별 관련 문서가 4편을 넘는 단계가 있다 (A5의 전제가 여전히 참인가)")
```
- `getAllStages()`를 돌며 `getArticlesForStage(slug).length`의 최댓값이 `> 4`인지.
  전제가 깨지면(예: 문서를 재배치해 전부 4편 이하) 이 테스트가 실패하며 "상한 코드가 이제 죽었다"를 알린다.

`app/__tests__/`에:

```ts
it("단계 페이지가 관련 문서를 4편으로 자른다")
```
- `app/guide/[stage]/page.tsx`를 읽어 `RELATED_LIMIT = 4`와 `slice(0, RELATED_LIMIT)`이 있는지.
- `relatedArticles.map(`이 **없는지**(잘리지 않은 배열을 그리는 실수 방지).

---

## A7. 404를 막다른 길에서 빼기

### 현재 — `app/not-found.tsx` 35줄, 버튼 2개(`홈으로`, `6단계 가이드 보기`)

### 변경 — `app/not-found.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없음",
};

export default function NotFound() {
  // 색인된 URL이 50개에 가깝다. 주소가 바뀐 페이지에 닿은 사람에게
  // 버튼 두 개만 주면 대부분 그대로 나간다. 실제 목적지를 보여준다.
  const articles = getFeaturedArticles(4);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-label text-xs tracking-wider text-accent">404</p>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래에서 원하는 곳으로
        이동해보세요.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          홈으로
        </Link>
        <Link
          href="/guide"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent"
        >
          6단계 가이드 보기
        </Link>
        <Link
          href="/articles"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent"
        >
          자료실
        </Link>
        <Link
          href="/tools"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent"
        >
          도구 모아보기
        </Link>
      </div>

      {articles.length > 0 && (
        <div className="mt-12 border-t border-line pt-6">
          <p className="text-xs text-ink-soft">자료실에서 많이 보는 문서</p>
          <ul className="mt-3 border-b border-line">
            {articles.map((article) => (
              <li key={article.slug} className="border-t border-line">
                <Link
                  href={`/articles/${article.slug}`}
                  className="group block py-4"
                >
                  <span className="block text-[16px] font-semibold text-ink transition group-hover:text-accent">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-sm leading-[1.6] text-ink-soft">
                    {article.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 함정

1. **`not-found.tsx`에서 `fs`를 쓰는 것이 안전한가** — `getFeaturedArticles`는 `lib/articles.ts`를 통해
   `fs.readdirSync`를 한다. `app/not-found.tsx`는 서버 컴포넌트이고 Next가 **빌드 시 정적으로 렌더**한다.
   `app/page.tsx:60`이 이미 같은 호출을 한다. 문제없다. **다만 `npm run build`로 `/_not-found`가
   정적으로 프리렌더되는지 확인하라** — 만약 dynamic으로 떨어지면 404마다 파일시스템을 읽게 된다.
2. **`getFeaturedArticles(4)`는 P7 결정과 무관하다.** 한도를 인자로 직접 주므로 4편이 나온다.
   P7이 홈 한도를 10으로 올려도 404는 4편.
3. `articles.length > 0` 가드를 넣은 이유: `content/articles/`가 비면 `getAllArticles()`가 `[]`를 준다
   (`lib/articles.ts:92`). 빈 `<ul>`이 괘선만 남기는 것을 막는다.
4. **batch05 커밋 7(O5)이 광고 레일을 레이아웃에서 빼기 전에는 404에도 레일이 붙는다.**
   A7이 404를 "머무는 페이지"로 만들수록 O5의 위험이 커진다. **O5를 먼저 넣어라.**

### 테스트 — `app/__tests__/notFound.test.tsx` (jsdom)

```ts
it("404가 자료실 문서 4편과 네 개의 이동 링크를 보여준다 (정상)")
```
- `render(<NotFound />)` — 서버 컴포넌트지만 async가 아니므로 직접 렌더된다.
- `screen.getAllByRole("link")`의 href 집합에 `/`, `/guide`, `/articles`, `/tools`가 있는지.
- `/articles/`로 시작하는 링크가 정확히 4개인지.

```ts
it("모든 링크가 상대 경로다 (외부로 새지 않는다)")
```

---

## B7. 자료실 RSS

### 변경 1 — `app/feed.xml/route.ts` (신설)

```ts
import { getAllArticles } from "@/lib/articles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 자료실 RSS 2.0.
 *
 * 정적으로 굽는다 — 콘텐츠가 파일이라 요청마다 계산할 이유가 없고,
 * 빌드 산출물에 남아야 CDN이 그대로 서빙한다.
 */
export const dynamic = "force-static";

const FEED_LIMIT = 20;

/** XML 텍스트 노드/속성에 안전하게 넣기 위한 이스케이프. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * "2026-08-30" → RFC 822. RSS 2.0의 pubDate는 RFC 822를 요구한다
 * (ISO 8601이 아니다 — 리더가 조용히 무시한다).
 * 파싱 실패 시 undefined를 주고 호출부가 pubDate를 통째로 뺀다.
 */
function toRfc822(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toUTCString();
}

export function GET(): Response {
  // getAllArticles()는 카테고리·order 순이다. 피드는 시간순이어야 하므로
  // 복사본을 만들어 updated 내림차순으로 다시 정렬한다.
  // (원본 배열은 buildOnlyCache가 캐시하므로 절대 제자리 정렬하지 마라.)
  const items = [...getAllArticles()]
    .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : a.slug < b.slug ? -1 : 1))
    .slice(0, FEED_LIMIT);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE_NAME} 자료실`)}</title>
    <link>${SITE_URL}/articles</link>
    <description>청소년 연구를 위한 자료실 문서. 주제 선정부터 투고까지.</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map((a) => {
    const pubDate = toRfc822(a.updated);
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/articles/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/articles/${a.slug}</guid>
      <description><![CDATA[${a.summary}]]></description>${
        pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""
      }
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

### 변경 2 — `app/layout.tsx` metadata에 alternate

`:28`의 `alternates: { canonical: "./" },`를 교체:

```tsx
  alternates: {
    // "./"는 현재 경로 기준으로 풀린다 — 페이지마다 자기 URL이 canonical이 된다
    canonical: "./",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_NAME} 자료실` },
      ],
    },
  },
```

### 변경 3 — `app/robots.ts`

`/feed.xml`은 색인 대상이 아니지만 막을 이유도 없다. **건드리지 마라.**
`app/sitemap.ts`에도 넣지 않는다 — 피드는 HTML 페이지가 아니다.

### 함정

1. **`description`을 CDATA로 감싸면서 동시에 `escapeXml`을 적용하지 마라.** 둘 중 하나다.
   위 코드는 `title`은 이스케이프, `description`은 CDATA다. `summary`에 `]]>`가 들어가면 깨지는데,
   한국어 요약에 그럴 일은 없다. 걱정되면 `summary.replace("]]>", "]]&gt;")`를 넣어라.
2. **`pubDate`는 RFC 822**(`Fri, 30 Aug 2026 00:00:00 GMT`)여야 한다. `toISOString()`을 쓰면
   많은 리더가 날짜를 못 읽고 "지금"으로 표시한다. `toUTCString()`이 RFC 822 호환 형식을 준다.
3. **`getAllArticles()`의 배열을 제자리 정렬(`.sort()`)하지 마라.** `buildOnlyCache`가 같은 배열
   참조를 캐시하므로(`lib/contentCache.ts`) 목록 페이지 순서가 통째로 망가진다.
   `[...getAllArticles()]`로 복사해야 한다. **이것이 이 항목의 진짜 함정이다.**
4. `updated` 동률 시 slug tie-break를 넣었다 — M4와 같은 이유. `updated`가 `2026-09-05`인 문서가 여럿이다.
5. `dynamic = "force-static"`이 없으면 Next가 이 라우트를 동적으로 볼 수 있다(`Response`를 직접 만들므로).
   빌드 로그에서 `/feed.xml`이 `○ (Static)`인지 확인하라.
6. **파일명은 `app/feed.xml/route.ts`다.** 디렉터리 이름에 점이 들어가는 것이 맞다(Next의 정적 라우트 세그먼트).

### 테스트 — `app/__tests__/feed.test.ts`

```ts
it("최근 20편을 updated 내림차순으로 낸다 (정상)")
```
- `GET()`을 부르고 `await res.text()`.
- `<item>` 개수가 `min(20, 전체)`.
- `<pubDate>`를 순서대로 뽑아 `new Date()`로 파싱했을 때 단조 비증가인지.

```ts
it("getAllArticles()의 순서를 훼손하지 않는다 (제자리 정렬 방지)")
```
- `const before = getAllArticles().map(a => a.slug)` → `GET()` → `const after = …` → `toEqual`.
  **함정 3을 잡는 단언이다. 반드시 넣어라.**

```ts
it("모든 link/guid가 SITE_URL로 시작하는 절대 URL이다 (상대→절대)")
```

```ts
it("pubDate가 RFC 822 형식이다 (경계)")
```
- `/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/`.

```ts
it("제목의 &와 <가 이스케이프된다 (XML 파손 방지)")
```
- 실제 문서 제목 중 특수문자가 없다면, `escapeXml`을 export해 직접 단위 테스트.

```ts
it("Content-Type이 application/rss+xml이다")
```

---

## B8. PWA 매니페스트

### 변경 — `app/manifest.ts` (신설, Next 규약)

```ts
import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

/**
 * PWA 매니페스트. "이 기기에 설치"라는 심상이 실제 동작과 맞는 앱이다 —
 * 모든 도구 상태가 localStorage에만 있고 서버로 나가지 않는다.
 *
 * 서비스워커는 만들지 않는다: 애드센스 재검토 중 광고 스크립트를 캐시하면
 * 정책 위반 소지가 있다(백로그 D5 기각 근거). 매니페스트만으로도
 * 설치·홈화면 추가·standalone 표시는 동작한다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "청소년 연구 6단계 가이드 — 연구랩",
    short_name: SITE_NAME,
    description:
      "주제 선정부터 논문 투고까지 6단계로 따라가는 청소년 연구 가이드. 기록은 이 기기에만 저장됩니다.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "ko",
    dir: "ltr",
    // globals.css의 라이트 --bg / --ink와 같은 값. 스플래시와 주소창에 쓰인다.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        // app/icon.svg (파일 규약). SVG 하나로 모든 크기를 덮는다 —
        // maskable PNG 세트를 만들려면 원본 아트워크가 필요한데 없다.
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
```

### 함정 — **아이콘이 이 항목의 유일한 실질 위험이다**

1. **`app/icon.svg`가 `/icon.svg`로 서빙되는지 확인해야 한다.** Next의 `icon.svg` 파일 규약은
   `<link rel="icon" href="/icon.svg?…">`를 자동으로 넣지만, 해시가 붙은 경로일 수 있다.
   **`npm run build && npx next start` 후 `curl -sI http://localhost:3000/icon.svg`로 200을 확인하라.**
   404라면 **`public/icon.svg`로 사본을 두고** 매니페스트가 그것을 가리키게 하라
   (`app/icon.svg`는 파비콘 용도로 남긴다).
2. **현재 `app/icon.svg`는 `width="20" height="20"`에 `fill="none" stroke="#2f6f4f"`다**(확인함).
   투명 배경 · 선 그림이라 안드로이드 홈화면에서 **배경 없이 초록 선만 뜬다.** 최소 512×512
   불투명 아이콘이 사실상 필요하다. **구현 시 판단 필요** — 세 갈래:
   - (가) `background_color`가 스플래시를 채우므로 그대로 간다(설치 아이콘은 볼품없다).
   - (나) `public/icon-512.png`를 하나 만들어 `purpose: "any maskable"`로 넣는다. **원본 아트워크가 없으므로
     운영자 작업이다.**
   - (다) B8을 (나)가 준비될 때까지 보류한다.
   백로그가 "매니페스트만"이라고 못박았으므로 **(가)로 진행하되 (나)를 백로그에 올리는 것**을 권한다.
3. `theme_color`를 다크값(`#101113`)으로 두지 마라 — 매니페스트는 정적이라 테마를 못 따라간다.
   주소창 색은 이미 `app/layout.tsx:49-54`의 `viewport.themeColor`가 미디어쿼리로 처리한다.
   **매니페스트의 `theme_color`는 설치 후 standalone 창에만 쓰이므로 라이트 고정이 안전하다.**
4. `start_url: "/"`에 쿼리(`?source=pwa`)를 붙이고 싶어질 수 있다. **붙이지 마라** —
   `alternates.canonical`과 어긋나 중복 URL이 색인된다.

### 테스트 — `app/__tests__/manifest.test.ts`

```ts
it("필수 필드가 채워져 있고 start_url·scope가 루트다 (정상)")
```
- `name`, `short_name`, `start_url === "/"`, `scope === "/"`, `display === "standalone"`, `icons.length >= 1`.

```ts
it("start_url에 쿼리가 없다 (canonical 중복 방지)")
```
- `expect(manifest().start_url).not.toContain("?")`.

```ts
it("theme_color·background_color가 globals.css의 라이트 --bg와 같다")
```
- `globals.css`의 `:root` 블록에서 `--bg`를 파싱해 대조. 색이 갈라지는 것을 막는다.

---

## P7 + T1. featured 한도와 그 한도를 승인하던 테스트

**둘은 같은 커밋이다.** T1이 지금 형태로 남아 있으면 P7을 고쳐도 재발한다(백로그 판정 그대로).

### 실측 (파트 0-(4)에서 정정한 값)

`featured: true` **10편**. `app/page.tsx:60` `getFeaturedArticles(6)`. `lib/articles.ts:143` `slice(0, limit)`.
가려진 4편: `survey-questions`, `statistics`, `negative-results`, `presentation`.

`lib/__tests__/articles.test.ts:75-83`:

```ts
describe("getFeaturedArticles", () => {
  it("최대 6편, 전부 featured다", () => {
    const featured = getFeaturedArticles(6);
    expect(featured.length).toBeLessThanOrEqual(6);
```

`toBeLessThanOrEqual(6)`은 `featured: true`가 100개여도 통과한다.

### 정책 권고 — **한도를 10으로 올린다**

홈의 featured 섹션은 `app/page.tsx:251-270`에서 **괘선 목록**으로 그려진다(그리드가 아니다).
번호 + 제목 + 한 줄 요약이 행마다 붙는 형태라 6행이든 10행이든 리듬이 안 깨진다.
가려진 4편에 `statistics`(통계 정직하게 읽기)와 `negative-results`(음성 결과)가 들어 있다 —
이 사이트의 간판 글이 홈에 없다. **플래그를 끄는 것보다 한도를 올리는 쪽이 운영자 의도에 맞는다.**

> 반대 선택(6 유지 + 4편 플래그 끄기)도 유효하다. **어느 쪽이든 아래 구조 변경은 같다.**
> 상수를 하나로 만들면 두 선택 사이를 오가는 데 한 줄만 바꾸면 된다.

### 변경 1 — `lib/articles.ts`

`:136-150`의 `getFeaturedArticles` 위에 상수를 export한다:

```ts
/**
 * 홈에 노출할 featured 문서 수. app/page.tsx와 테스트가 이 값을 공유한다.
 *
 * featured 플래그 개수와 이 한도가 어긋나면 운영자가 켠 플래그가 조용히
 * 사라진다(실제로 4편이 그 상태였다). articles.test.ts가 둘의 일치를
 * 검사하므로, 플래그를 늘렸는데 이 값을 안 올리면 테스트가 빨개진다.
 */
export const HOME_FEATURED_LIMIT = 10;
```

`:140`의 기본값도 맞춘다:

```ts
export function getFeaturedArticles(limit = HOME_FEATURED_LIMIT): Article[] {
```

### 변경 2 — `app/page.tsx:60`

```tsx
  const articles = getFeaturedArticles(HOME_FEATURED_LIMIT);
```

`:7`의 import에 추가: `import { getFeaturedArticles, HOME_FEATURED_LIMIT } from "@/lib/articles";`

### 변경 3 (T1) — `lib/__tests__/articles.test.ts:75-83` 교체

```ts
describe("getFeaturedArticles", () => {
  // 옛 테스트는 length <= 6만 봤다. featured 플래그가 10개여도 통과했고,
  // 그래서 4편이 노출되지 않는 상태를 "정상"으로 보증하고 있었다.
  // 이제 한도와 플래그 개수의 일치 자체를 검사한다.
  it("홈 한도가 featured 플래그 개수와 일치해 한 편도 잘리지 않는다", () => {
    const flagged = getAllArticles().filter((a) => a.featured);
    const shown = getFeaturedArticles(HOME_FEATURED_LIMIT);
    expect(shown.length).toBe(flagged.length);
    expect(shown.map((a) => a.slug)).toEqual(flagged.map((a) => a.slug));
  });

  it("전부 featured다", () => {
    for (const article of getFeaturedArticles(HOME_FEATURED_LIMIT)) {
      expect(article.featured).toBe(true);
    }
  });

  it("limit보다 featured가 많으면 앞에서부터 자른다 (경계)", () => {
    expect(getFeaturedArticles(2).length).toBe(2);
  });

  it("featured가 하나도 없으면 카테고리별 첫 글로 대체한다 (실패 격리)", () => {
    // 폴백 경로(lib/articles.ts:145-149)는 지금 실데이터로는 절대 안 밟힌다.
    // getArticlesByCategory()로 기대값을 만들어 함수를 직접 검증한다.
    // 실데이터에 featured가 있는 한 이 케이스는 단언 대상이 아니므로,
    // 이 it은 "featured가 0개가 되면 홈이 비지 않는다"는 계약만 문서화한다.
    // 구현 시 판단 필요: 모듈 목킹까지 갈지, 이 it을 빼고 주석으로 남길지.
  });
});
```

> 마지막 `it`은 **구현 시 판단 필요**다. `fs`를 목킹해 빈 디렉터리를 만드는 것은 이 저장소의
> 다른 테스트 관행과 다르다. 폴백 경로를 테스트하려면 `getFeaturedArticles`를
> `(all: Article[], limit: number)`를 받는 순수 함수로 쪼개는 편이 낫지만 **그건 이번 범위 밖이다.**
> 지금은 이 `it`을 **빼고**, 폴백 경로에 "테스트 없음 — 실데이터로 도달 불가" 주석을 다는 것을 권한다.

### 함정

1. **`HOME_FEATURED_LIMIT`을 `app/page.tsx`에 두지 마라.** 테스트가 `app/`을 import하면 RSC 경계를 넘는다.
   `lib/articles.ts`가 맞다.
2. 새 테스트의 `expect(shown.map(...)).toEqual(flagged.map(...))`는 **순서까지** 본다.
   `getFeaturedArticles`가 `getAllArticles().filter(...)`를 그대로 쓰므로 순서가 같다(`lib/articles.ts:142-143`).
3. **`getFeaturedArticles(4)`를 쓰는 A7과 충돌하지 않는다** — A7은 인자를 명시한다.
4. 앞으로 `featured: true`를 11번째로 켜면 새 테스트가 **빨개진다.** 그게 의도다 —
   운영자가 한도를 같이 올리도록 강제한다. 이 사실을 커밋 메시지에 적어라.

---

# 파트 3 — 묶음 2.5 (검색 라우트) L2 L3

## 현재 예산 구조 — 실측

| 지점 | 값 | 근거 |
| --- | --- | --- |
| 소스별 업스트림 타임아웃 | **8000ms** | `app/api/search-papers/route.ts:25` `UPSTREAM_TIMEOUT_MS`, `:46 :65 :86 :100` 네 곳에서 `AbortSignal.timeout(...)` |
| 최대 단계 수 | 4회 fetch | S2 → Crossref → (초록 보강) → OpenAlex |
| **서버 최악** | **32초** | 8 × 4 |
| 클라이언트 중단 | **10000ms** | `components/PriorResearchSearch.tsx:7` `CLIENT_TIMEOUT_MS` |
| `maxDuration` | **없음** | `route.ts` 전체에 `export const maxDuration` 0회 (확인함) |

S2가 타임아웃(8초)나면 클라이언트에 남은 시간은 2초다. 그 2초 안에 Crossref + OpenAlex를 끝내야 한다.
**폴백을 만든 바로 그 이유(S2 실패)에서 폴백이 도달 불가능하다.** 백로그의 진단이 정확하다.

## 설계 — 세 층의 상한을 명시적으로 겹친다

```
서버 예산  SEARCH_BUDGET_MS = 12000   ← runSearchChain이 여기 안에서 끝난다
클라이언트 CLIENT_TIMEOUT_MS = 16000  ← 서버가 답할 시간을 준 뒤 포기
플랫폼     maxDuration = 20           ← 클라이언트가 먼저 포기하므로 여기 닿지 않는다
```

**순서가 곧 설계다.** `예산 < 클라이언트 < maxDuration`.

- 예산 < 클라이언트: 정상 경로에서 **항상 서버가 먼저 답한다.** 학생은 `ERROR_MESSAGES.timeout`이 아니라
  `searchChain`이 만든 구체적인 한국어 문구를 본다.
- 클라이언트 < maxDuration: 서버가 예산을 넘겨 폭주해도 **플랫폼 504(HTML)보다 클라이언트 중단이 먼저**다.
  504는 `NextResponse.json`을 실행조차 못 시키므로(L3의 지적) 학생이 보는 것은 파싱 실패다.
  이 순서가 그 경로를 닫는다.

## 예산 배분 — 순수 함수로 뽑는다

각 단계에 "남은 예산 전부"를 주면 앞 단계가 다 먹고 폴백이 굶는다. "고정 몫"을 주면
앞 단계가 빨리 끝났을 때 뒤 단계가 여유를 못 받는다. **남은 시간에서 뒤 단계 몫을 예약한 나머지**를 준다.

```ts
// lib/searchChain.ts (신설 부분)

/** 서버가 응답까지 쓸 수 있는 총 예산. 클라이언트 타임아웃보다 작아야 한다. */
export const SEARCH_BUDGET_MS = 12_000;

export type SearchStep = "semanticScholar" | "crossref" | "enrich" | "openAlex";

/**
 * 각 단계 뒤에 남겨 둘 최소 예약분(ms). "이 단계가 끝난 시점에 뒤 단계들이
 * 쓸 수 있어야 하는 최소 시간"이다.
 *
 * enrich(초록 보강)는 선택적 보강이므로 예약분을 갖지 않는다 —
 * 뒤에 아무 단계도 없고, 실패해도 결과가 나간다.
 */
const RESERVE_AFTER: Record<SearchStep, number> = {
  semanticScholar: 5_000, // crossref 3s + openAlex 2s
  crossref: 2_000, // openAlex 2s
  enrich: 0,
  openAlex: 0,
};

/** 단계별 상한. 한 단계가 예산을 통째로 빨아들이지 않게 한다. */
const CAP: Record<SearchStep, number> = {
  semanticScholar: 6_000,
  crossref: 5_000,
  enrich: 2_500,
  openAlex: 5_000,
};

/**
 * 단계별 최소 실행 시간. 이보다 적게 남았으면 부르지 않는다 —
 * 어차피 실패할 요청을 보내면 업스트림에 부하만 주고 예산은 그만큼 더 준다.
 *
 * enrich는 선택 보강이라 문턱을 높게 잡는다: 시간이 빠듯하면
 * 초록 없는 결과를 주는 편이 아무 결과도 못 주는 것보다 낫다.
 */
const MIN_TO_RUN: Record<SearchStep, number> = {
  semanticScholar: 1_500,
  crossref: 1_500,
  enrich: 800,
  openAlex: 1_500,
};

/**
 * 남은 예산에서 이 단계에 줄 시간을 계산한다.
 * null이면 "부르지 말고 건너뛰어라".
 *
 * 순수 함수라 시계 없이 전수 테스트할 수 있다 — 이 배분이 이 항목의
 * 실제 로직이고, 체인 자체는 그것을 소비할 뿐이다.
 */
export function allocate(remainingMs: number, step: SearchStep): number | null {
  const usable = Math.min(remainingMs - RESERVE_AFTER[step], CAP[step]);
  return usable >= MIN_TO_RUN[step] ? usable : null;
}
```

배분 예시(총 12초):

| 상황 | S2 | 남음 | Crossref | 남음 | enrich | OpenAlex |
| --- | --- | --- | --- | --- | --- | --- |
| 전부 느림 | 6000 (cap) | 6000 | 4000 | 2000 | **skip**(2000−0=2000, cap 2500 → 2000 ≥ 800 → 2000) | — |
| S2 즉시 429 (0.2s) | 6000 부여, 200ms 소비 | 11800 | 5000 (cap) | 6800 | 2500 (cap) | — |
| S2 6초 소진, CR 4초 소진 | 6000 | 6000 | 4000 | 2000 | — | 2000 |

**`allocate`가 정확히 무엇을 주는지는 테스트가 전수로 잠근다** — 위 표는 설계 의도지 계약이 아니다.

## 변경 1 — `lib/searchChain.ts`

**타입(`:20-26`) — 두 번째 인자로 `AbortSignal`을 받는다:**

```ts
export type SearchFetchers = {
  semanticScholar: (query: string, signal: AbortSignal) => Promise<Response>;
  crossref: (query: string, signal: AbortSignal) => Promise<Response>;
  /** Crossref 결과 중 초록이 빈 항목을 채울 DOI 조회 (보강 실패는 무해) */
  openAlexByDois: (dois: string[], signal: AbortSignal) => Promise<Response>;
  openAlex: (query: string, signal: AbortSignal) => Promise<Response>;
};
```

**옵션과 시계 주입:**

```ts
export type SearchChainOptions = {
  /** 총 예산(ms). 기본 SEARCH_BUDGET_MS. */
  totalMs?: number;
  /** 테스트에서 시간을 진행시키기 위한 주입점. 기본 Date.now. */
  now?: () => number;
  /**
   * 단계에 줄 AbortSignal 생성기. 기본 AbortSignal.timeout.
   * 테스트가 실제로 기다리지 않게 하려고 뚫어 둔다.
   */
  signalFor?: (ms: number) => AbortSignal;
};
```

**`withOpenAlexAbstracts`(`:36-52`) — 예산을 받고 못 받으면 건너뛴다:**

```ts
async function withOpenAlexAbstracts(
  papers: Paper[],
  fetchByDois: SearchFetchers["openAlexByDois"],
  budgetMs: number | null,
  signalFor: (ms: number) => AbortSignal,
): Promise<Paper[]> {
  // 예산이 없으면 보강을 통째로 건너뛴다. 초록 없는 결과가
  // 아무 결과도 없는 것보다 낫다.
  if (budgetMs === null) return papers;

  const missing = papers
    .filter((p) => !p.abstract && p.paperId.startsWith("10."))
    .map((p) => p.paperId);
  if (missing.length === 0) return papers;

  try {
    const res = await fetchByDois(missing, signalFor(budgetMs));
    if (!res.ok) return papers;
    return fillMissingAbstracts(papers, buildAbstractsByDoi(await res.json()));
  } catch {
    return papers;
  }
}
```

**`runSearchChain`(`:54-119`) — 예산을 재며 내려간다:**

```ts
export async function runSearchChain(
  query: string,
  fetchers: SearchFetchers,
  options: SearchChainOptions = {},
): Promise<SearchChainResult> {
  const totalMs = options.totalMs ?? SEARCH_BUDGET_MS;
  const now = options.now ?? (() => Date.now());
  const signalFor = options.signalFor ?? ((ms: number) => AbortSignal.timeout(ms));
  const deadline = now() + totalMs;
  const remaining = () => deadline - now();

  // 1차: Semantic Scholar
  const s2Budget = allocate(remaining(), "semanticScholar");
  if (s2Budget !== null) {
    try {
      const res = await fetchers.semanticScholar(query, signalFor(s2Budget));
      if (res.ok) {
        return {
          status: 200,
          body: { data: mapSemanticScholar(await res.json()), source: "semantic-scholar" },
        };
      }
      if (!shouldFallback(res.status)) {
        // 400대(잘못된 검색어 등)는 폴백해도 같은 결과이므로 그대로 전달
        return {
          status: res.status,
          body: { error: `검색 서비스가 요청을 거부했습니다. (${res.status})` },
        };
      }
    } catch {
      // 타임아웃·네트워크 오류 — 아래 폴백으로
    }
  }

  // 2차: Crossref
  const crBudget = allocate(remaining(), "crossref");
  if (crBudget !== null) {
    try {
      const res = await fetchers.crossref(query, signalFor(crBudget));
      if (res.ok) {
        const data = mapCrossref(await res.json());
        // Crossref가 0건이면 마지막으로 OpenAlex에 물어본다
        if (data.length > 0) {
          return {
            status: 200,
            body: {
              data: await withOpenAlexAbstracts(
                data,
                fetchers.openAlexByDois,
                allocate(remaining(), "enrich"),
                signalFor,
              ),
              source: "crossref",
            },
          };
        }
      }
    } catch {
      // 타임아웃·네트워크 오류 — 아래 폴백으로
    }
  }

  // 3차: OpenAlex
  const oaBudget = allocate(remaining(), "openAlex");
  if (oaBudget === null) {
    // 앞 단계들이 예산을 다 썼다. 어차피 실패할 요청을 보내는 대신
    // 지금 답한다 — 플랫폼 타임아웃에 걸려 이 문구가 학생에게
    // 닿지 못하는 것이 L3이 지적한 실패다.
    return {
      status: 504,
      body: {
        error:
          "검색이 제한 시간 안에 끝나지 않았습니다. 키워드를 줄이거나 잠시 후 다시 시도해주세요.",
      },
    };
  }
  try {
    const res = await fetchers.openAlex(query, signalFor(oaBudget));
    // 이하 :101-118 그대로
```

## 변경 2 — `app/api/search-papers/route.ts`

**`:25` 교체:**

```ts
// 소스별 고정 타임아웃을 없앤다. 예산은 lib/searchChain.ts가 전체를 보고
// 단계마다 나눠 주고, 여기서는 받은 signal을 fetch에 그대로 넘긴다.
// 고정 8초 × 최대 4단 = 32초였고, 클라이언트는 10초에 끊었다 —
// 폴백이 필요한 바로 그 상황(1차 타임아웃)에서 폴백이 도달 불가능했다.
```

**네 fetch 함수의 시그니처와 `signal`(`:34 :44-48`, `:51 :59-67`, `:71 :84-88`, `:91 :98-102`):**

```ts
async function fetchSemanticScholar(query: string, signal: AbortSignal): Promise<Response> {
  // … url 구성 그대로 …
  return fetch(url, { headers, signal, next: { revalidate: CACHE_SECONDS } });
}
```

나머지 셋도 같은 방식(`signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)` → `signal`).
`fetchOpenAlexByDois`는 첫 인자가 `dois: string[]`이고 둘째가 `signal`이다.

**L3 — 파일 상단(`:28` 근처, 상수 옆)에:**

```ts
/**
 * Vercel Function의 실행 상한(초).
 *
 * 명시하지 않으면 플랫폼 기본값에 걸려 504가 나가고, 그때는
 * NextResponse.json이 실행조차 안 된다 — searchChain이 만든 한국어 오류
 * 문구가 사용자에게 절대 닿지 않는 경로가 생긴다. SUCCESS_HEADERS의
 * CDN 캐시도 안 붙는다.
 *
 * 세 상한의 관계(순서가 곧 설계다):
 *   SEARCH_BUDGET_MS 12s  <  CLIENT_TIMEOUT_MS 16s  <  maxDuration 20s
 * 정상 경로에서는 예산이 먼저 끝나 구체적인 오류 문구가 나가고,
 * 서버가 폭주해도 클라이언트 중단이 플랫폼 504보다 먼저 온다.
 */
export const maxDuration = 20;
```

**`GET`(`:117-122`) — 옵션 인자는 안 넘긴다**(기본값이 곧 프로덕션 값이다):

```ts
  const result = await runSearchChain(query, {
    semanticScholar: fetchSemanticScholar,
    crossref: fetchCrossref,
    openAlexByDois: fetchOpenAlexByDois,
    openAlex: fetchOpenAlex,
  });
```

**변경 없음.** 시그니처가 늘었을 뿐 전달 방식은 같다.

## 변경 3 — `components/PriorResearchSearch.tsx:7`

```tsx
/**
 * 클라이언트 중단 시각. 서버 예산(lib/searchChain.ts SEARCH_BUDGET_MS = 12s)보다
 * 커야 한다 — 작으면 서버가 만든 구체적인 오류 문구 대신 늘 ERROR_MESSAGES.timeout만
 * 보게 된다. 동시에 maxDuration(20s)보다는 작아야 한다 — 플랫폼 504(HTML)를
 * 받아 JSON 파싱이 깨지기 전에 우리가 먼저 포기한다.
 */
const CLIENT_TIMEOUT_MS = 16000;
```

`:65`의 `window.setTimeout(..., CLIENT_TIMEOUT_MS)`는 그대로.

## 기존 테스트가 깨지나 — **아니다. 확인했다**

`lib/__tests__/searchChain.test.ts`의 fetcher는 전부 인자를 덜 받는 형태다:

```ts
const never = () => { throw new Error("호출되면 안 되는 단계"); };          // :16-18
semanticScholar: async () => json(S2_OK)                                     // :42
openAlexByDois: async (dois) => { asked.push(dois); return json(...); }      // :146-149
```

**TypeScript는 매개변수가 적은 함수를 많은 시그니처에 할당할 수 있다**(bivariance가 아니라 arity 규칙).
`(query: string, signal: AbortSignal) => Promise<Response>` 자리에 `() => Promise<Response>`와
`(dois: string[]) => Promise<Response>`는 **둘 다 정상 할당**된다.

`runSearchChain(query, fetchers)` 2인자 호출도 `options`가 선택이라 그대로 컴파일된다.

**단, 런타임에서 하나가 달라진다**: 기본 `signalFor`가 `AbortSignal.timeout(ms)`를 만든다.
Node 20+에는 있고 vitest 4의 node 환경에서 동작한다. 타이머가 12초짜리로 잡히지만 fetcher가
즉시 반환하므로 테스트는 즉시 끝난다. **다만 `AbortSignal.timeout`이 만든 타이머가
프로세스를 붙잡아 vitest 종료가 늦어질 수 있다.** 관측되면 기존 describe에
`options: { signalFor: () => new AbortController().signal }`을 넘기도록 헬퍼를 하나 두어라 —
**기존 9개 `it`의 본문은 그대로 두고 `fetchers()` 헬퍼 옆에 `run()` 헬퍼를 추가**하는 편이 diff가 작다.

## 함정

1. **`AbortSignal.timeout(ms)`에 0 이하를 넘기면 즉시 abort된다.** `allocate`가 `null`을 주는
   경계(`MIN_TO_RUN`)가 그 아래를 막지만, `CAP`이나 `RESERVE_AFTER`를 나중에 고칠 때
   `usable`이 음수가 될 수 있다. `allocate`의 반환은 항상 `>= MIN_TO_RUN[step] >= 800`이다 —
   **`MIN_TO_RUN`의 값을 0으로 내리지 마라.**
2. **`next: { revalidate: CACHE_SECONDS }`와 `signal`을 같이 쓰는 것이 안전한가.**
   Next의 fetch 캐시는 `signal`이 붙으면 캐시를 우회할 수 있다. **현재 코드도 이미 `signal`을 넘기고 있으므로
   동작은 변하지 않는다.** 다만 `SUCCESS_HEADERS`의 CDN 캐시(`s-maxage=600`)가 진짜 캐시 층이고
   그건 영향받지 않는다.
3. **504를 새로 반환한다.** `components/PriorResearchSearch.tsx:29-33`의 `classifyStatus`는
   400 → input, 429 → rate-limit, **그 외 → upstream**이다. 504는 `upstream` 문구
   ("외부 학술 검색 서비스에 일시적인 문제가 있습니다")를 받는다. 틀린 말은 아니지만
   실제 원인은 "시간 초과"다. **`classifyStatus`에 `if (status === 504) return "timeout";`을 추가하라** —
   한 줄이고, 그래야 L3의 목적("한국어 오류 문구가 닿는다")이 실제로 달성된다.
4. `SUCCESS_HEADERS`는 `result.status === 200`일 때만 붙는다(`route.ts:126`). 504에는 안 붙는다. 맞다.
5. **`maxDuration`은 Vercel Hobby에서 최대 60초**다. 20은 안전하다. 로컬 `next dev`에서는 무시된다.
6. **`SEARCH_BUDGET_MS`를 `route.ts`가 아니라 `lib/searchChain.ts`에 두는 이유**: 테스트가
   `app/api/`를 import하지 않아도 되게 하기 위해서다. 이 저장소는 `app/` 테스트가 아직 얇다.

## 테스트 — `lib/__tests__/searchChain.test.ts` 추가

**`allocate` 전수 (이 항목의 실제 로직)**

```ts
describe("allocate", () => {
  it("예산이 넉넉하면 단계 상한(CAP)까지만 준다 (정상)")
  //   allocate(12000, "semanticScholar") === 6000
  //   allocate(12000, "crossref") === 5000

  it("남은 예산에서 뒤 단계 몫을 예약하고 남긴다 (핵심 계약)")
  //   allocate(8000, "semanticScholar") === 3000   (8000 - 5000)
  //   allocate(4000, "crossref") === 2000          (4000 - 2000)

  it("최소 실행 시간에 못 미치면 null — 부르지 않는다 (경계)")
  //   allocate(6000, "semanticScholar") === 1000 < 1500 → null
  //   allocate(0, "openAlex") === null
  //   allocate(-5000, "crossref") === null

  it("초록 보강은 예약분이 없고 문턱이 낮다 (선택 단계)")
  //   allocate(1000, "enrich") === 1000
  //   allocate(700, "enrich") === null

  it("반환값은 null이 아니면 항상 800 이상이다 (AbortSignal.timeout(0) 방지)")
  //   -20000..20000을 100 간격으로 훑으며 네 단계 전부 확인
});
```

**체인 레벨 — 시계를 주입해 검증**

```ts
it("앞 단계가 예산을 다 쓰면 뒤 단계를 부르지 않고 504를 준다 (L2의 핵심)")
```
- `let t = 0; const now = () => t;`
- `semanticScholar: async () => { t += 12000; throw new Error("timeout"); }`
- `crossref: never`, `openAlex: never` (호출되면 `never`가 던져 테스트가 실패한다)
- `runSearchChain("q", fetchers({...}), { totalMs: 12000, now, signalFor: () => new AbortController().signal })`
- `expect(r.status).toBe(504)`, 문구에 "제한 시간"이 들어가는지.

```ts
it("1차가 빨리 실패하면 2차가 상한(5초)까지 받는다 (예산이 회수된다)")
```
- 각 fetcher가 받은 signal이 아니라 **`signalFor`에 넘어온 ms를 기록**한다:
  `const asked: number[] = []; signalFor: (ms) => { asked.push(ms); return new AbortController().signal; }`
- S2가 200ms만 쓰고 429 → `asked` = `[6000, 5000]`.
- **이것이 "남은 예산을 계산해 나눠 준다"를 실제로 관측하는 유일한 방법이다.**

```ts
it("Crossref 성공 후 예산이 없으면 초록 보강을 건너뛴다 (선택 단계 격리)")
```
- S2가 6000ms 소진 후 429, Crossref가 5900ms 소진 후 성공(남은 100ms).
- `openAlexByDois: never` → 호출되면 실패. 결과는 200이고 `abstract`가 `null`.

```ts
it("예산 옵션 없이 부르면 기존 9개 테스트와 같게 동작한다 (하위호환)")
```
- 기존 테스트가 그대로 통과하는 것 자체가 이 단언이다. **별도 it을 만들지 말고,
  기존 9개를 손대지 않는 것으로 대신하라.**

**`components/__tests__/PriorResearchSearch.test.tsx` 추가 1건**

```ts
it("504 응답에 시간 초과 문구를 보여준다 (L3)")
```
- `fetch`를 목킹해 `{ ok: false, status: 504 }` 반환.
- `ERROR_MESSAGES.timeout`("응답이 너무 오래 걸려…")이 화면에 있는지.
- **함정 3의 `classifyStatus` 한 줄이 없으면 이 테스트가 빨개진다.** 그래서 이 테스트가 필요하다.

---

# 파트 4 — 커밋 분할

**13개 커밋.** 묶음끼리는 독립이고 묶음 안에는 순서가 있다.

### 커밋 1 — `fix: prose 토큰을 사이트 토큰에 바인딩 (O1)`
- `app/globals.css` — 레이어 밖 `.prose` 블록 신설 (`:65` 뒤)
- `app/__tests__/globalsCss.test.ts` 신설
- **이유**: 코드 파급이 CSS 한 블록뿐이고 어떤 컴포넌트도 안 만진다. 가장 먼저 넣어 다크모드 육안 검증의 기준선을 만든다.
- **게이트**: 다크로 `/articles/faq`·`/articles/statistics`·`/privacy`. **인라인 코드가 읽히는지**가 판정 기준이다(인용문이 아니다 — 파트 0-(2)).
- **주의**: `@theme inline` 블록(`:25-37`)에 넣으면 무효다.

### 커밋 2 — `fix: color-scheme 선언으로 네이티브 컨트롤을 테마에 맞춘다 (O2)`
- `app/globals.css` 3곳(`:5` 앞, `:42` 앞, `:57` 앞) + `.rail-scroll`(`:174-177`) thumb 색
- `app/__tests__/globalsCss.test.ts`에 3건 추가
- **이유**: 커밋 1과 같은 파일이지만 **다른 블록**이다. 섞으면 "prose를 고치다 스크롤바가 바뀌었다"가 된다.
- **게이트**: 다크에서 `/guide/submission`의 마감일 입력 달력 팝업, 6단계 체크박스, 단계 레일 스크롤바.

### 커밋 3 — `feat: 차트 색을 테마 변수로 · 내보내기는 라이트 고정 (O3, O4)`
- `lib/chartExport.ts` 신설
- `app/globals.css` — `:root`에 `--chart-*` 12개, 다크 두 블록에 `--chart-1..8`
- `components/SimpleChart.tsx` — `:4` import, `:24-33` COLORS, `:87` downloadSvg 한 줄, 색 속성 **14곳**
- `lib/__tests__/chartExport.test.ts` 신설, `components/__tests__/SimpleChart.test.tsx` 2건 추가
- **이유**: O3과 O4는 같은 팔레트를 만진다. 나누면 중간 상태에서 다크 차트가 라이트 계열색을 쓴다.
- **작업 순서**: `lib/chartExport.ts` + 그 테스트를 **먼저**. `CHART_EXPORT_COLORS`를 일부러 한 키 빼고 만들어
  "누락 감지" 테스트가 **빨간 것을 확인한 뒤** 채워라. 그 실패가 안전망이 실제로 작동함을 증명한다.
- **게이트 (이 배치에서 가장 중요하다)**: 다크모드에서 `SVG로 내려받기`를 눌러 받은 파일을
  **브라우저로 직접 열어** ① 배경이 흰색 ② 라벨이 검정 ③ 데이터 색이 라이트 팔레트인지 확인.
  7종 차트 유형을 **전부** — 특히 **도넛**(`:355`의 구멍)과 **원형**(범례 텍스트 `:372`).
  라이트모드에서도 같은 확인을 해서 **화면과 파일의 색이 같은지** 본다.

### 커밋 4 — `fix: sitemap lastModified를 문서·사례별 날짜로 (A2)`
- `app/sitemap.ts:8` + articles/showcases map 2곳 + 정적 10곳의 식별자
- `app/__tests__/sitemap.test.ts` 신설 (batch05 T6의 `routes.test.ts`가 있으면 거기에)
- **이유**: 파일이 하나고 다른 무엇과도 안 겹친다. 언제든 넣을 수 있다.

### 커밋 5 — `fix: 사례 정렬에 slug 2차 키 · 파일명 접두사 재부여 (M4)`
- `lib/showcase.ts:45-52`
- `git mv` 6건 (`01-`·`02-`… 재부여)
- `lib/__tests__/showcase.test.ts` 3건
- **선행 조건**: batch05 커밋 9(P6-a)가 같은 6개 파일의 frontmatter를 만진다. **그 뒤에.**
- **주의**: **`published` 값은 이 커밋에서 손대지 않는다.** T13은 운영자 결정 대기다(파트 2 T13).
- **게이트**: `npm run build` 후 `/showcase/eeg-binaural` 등 6개 URL이 그대로 생성되는지 — 파일명만 바뀌고 slug는 안 바뀐다.

### 커밋 6 — `feat: Article JSON-LD에 opengraph-image URL (A3)`
- `lib/jsonLd.ts:8-9,17-24,50` + 호출부 2곳
- `lib/__tests__/jsonLd.test.ts` 3건
- **게이트 (선행 확인 필수)**: `npm run build && npx next start` 후
  `curl -s localhost:3000/articles/faq | grep og:image`로 **실제 경로를 확인한 뒤** 값을 확정하라.
  경로를 확인하지 않고 커밋하면 리치결과 대신 404 이미지를 가리키게 된다.

### 커밋 7 — `feat: 자료실 상세 본문 하단 광고 슬롯 (A4)`
- `app/articles/[slug]/page.tsx` — import 1줄 + `2xl:hidden` 블록
- `app/__tests__/adSlots.test.ts` (batch05의 `adRails.test.ts`가 있으면 거기에)
- **선행 조건**: **batch05 커밋 7(O5)·커밋 8(O7) 뒤**여야 한다. 같은 파일이고 삽입 위치가 인접하다.
- **주의**: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 미설정(E3) 상태에서는 화면에 아무것도 안 뜨는 것이 정상이다.

### 커밋 8 — `feat: 단계 페이지 "함께 읽기" 4편 상한과 더 보기 (A5)`
- `app/guide/[stage]/page.tsx:56,82,171,189`
- `lib/__tests__/articles.test.ts` 1건, `app/__tests__/` 1건
- **판단 지점**: `:82`의 `relatedArticleCount`를 노출 수로 바꿀지. `components/StageRail.tsx`를 읽고 결정.

### 커밋 9 — `feat: 404에 자료실 문서 4편과 이동 링크 (A7)`
- `app/not-found.tsx` 전면 교체
- `app/__tests__/notFound.test.tsx` 신설
- **선행 조건**: **batch05 커밋 7(O5)이 먼저다.** 404를 머무는 페이지로 만들수록 레일 광고 위험이 커진다.
- **게이트**: `npm run build` 로그에서 `/_not-found`가 정적(`○`)인지 확인.

### 커밋 10 — `feat: 자료실 RSS 피드 (B7)`
- `app/feed.xml/route.ts` 신설, `app/layout.tsx:28` alternates
- `app/__tests__/feed.test.ts` 신설
- **게이트**: 빌드 로그에서 `/feed.xml`이 정적인지. `curl -s localhost:3000/feed.xml | head -20`으로
  선언·인코딩 확인. 가능하면 실제 리더(예: NetNewsWire)에 물려 `pubDate`가 읽히는지.
- **주의**: `[...getAllArticles()]` — 제자리 정렬은 목록 페이지를 망가뜨린다.

### 커밋 11 — `feat: PWA 매니페스트 (B8)`
- `app/manifest.ts` 신설
- `app/__tests__/manifest.test.ts` 신설
- **선행 확인**: `curl -sI localhost:3000/icon.svg`가 200인지. 404면 `public/icon.svg` 사본을 같은 커밋에 넣는다.
- **운영자 확인**: 512×512 불투명 아이콘 없이 진행할지(파트 2 B8 함정 2). 없이 가는 것을 권한다.

### 커밋 12 — `fix: featured 한도를 플래그 개수와 일치시키고 테스트로 잠근다 (P7, T1)`
- `lib/articles.ts` — `HOME_FEATURED_LIMIT` export + `:140` 기본값
- `app/page.tsx:7,60`
- `lib/__tests__/articles.test.ts:75-83` 교체
- **이유**: **T1을 같은 커밋에 넣지 않으면 P7이 재발한다**(백로그 판정 그대로).
  옛 테스트가 살아 있는 채로 한도만 고치면 다음 사람이 다시 6으로 되돌려도 초록이다.
- **운영자 확인 (선택)**: 한도 10 vs 6+플래그 4개 끄기. **권고는 10** — 근거는 파트 0-(4).
  어느 쪽이든 코드 구조는 같고 `HOME_FEATURED_LIMIT` 한 줄만 다르다.
- **게이트**: 홈에서 10행 목록의 리듬이 깨지지 않는지 375px·1280px에서 확인.

### 커밋 13 — `fix: 검색 예산을 단계별로 나누고 maxDuration을 명시한다 (L2, L3)`
- `lib/searchChain.ts` — `SEARCH_BUDGET_MS`·`allocate`·`SearchChainOptions`·시그니처·본문
- `app/api/search-papers/route.ts` — `maxDuration`, `UPSTREAM_TIMEOUT_MS` 제거, fetch 4곳
- `components/PriorResearchSearch.tsx:7,29-33`
- `lib/__tests__/searchChain.test.ts` — `allocate` 5건 + 체인 3건 추가 (**기존 9건은 손대지 않는다**)
- `components/__tests__/PriorResearchSearch.test.tsx` 1건
- **이유**: L2와 L3은 같은 예산 계산의 두 면이다. 나누면 중간 상태에서
  "예산은 12초인데 플랫폼은 10초에 끊는" 더 나쁜 상태가 생긴다.
- **작업 순서**: `allocate` + 그 5개 테스트를 **먼저** (순수 함수). 그다음 체인, 그다음 route, 마지막 클라이언트.
  각 단계에서 `npx tsc --noEmit`.
- **게이트**: `npm test`로 **기존 9개가 손대지 않고 초록**인지 — 이것이 "테스트가 안 깨진다"는 주장의 증거다.
  그다음 `next dev`에서 실제 검색 3회(정상 / 존재하지 않는 키워드 / 아주 긴 키워드).

### 병렬 가능성

**세 묶음은 서로 파일 교집합이 없다.**

- 다크모드 (1·2·3): `app/globals.css` + `components/SimpleChart.tsx` + `lib/chartExport.ts`
- SEO 소품 (4~12): `app/sitemap.ts` · `lib/showcase.ts` · `lib/jsonLd.ts` · `app/articles/[slug]/page.tsx` ·
  `app/guide/[stage]/page.tsx` · `app/not-found.tsx` · `app/feed.xml/` · `app/manifest.ts` ·
  `lib/articles.ts` + `app/page.tsx` · `app/layout.tsx`
- 검색 라우트 (13): `lib/searchChain.ts` · `app/api/search-papers/route.ts` · `components/PriorResearchSearch.tsx`

**묶음 안의 순서**: 1 → 2 → 3 (같은 CSS 파일). 4~12는 **서로 독립**이다 — 유일한 겹침은
커밋 10(B7)이 `app/layout.tsx:28`을, 커밋 7(A4)이 `app/articles/[slug]/page.tsx`를 만지는 것인데
서로 다른 파일이다. 13은 완전 독립.

**단 하나의 전역 순서**: `app/__tests__/`가 없으므로 **처음 만드는 커밋이 디렉터리를 만든다.**
batch05 커밋 4(T6)가 이미 만들었다면 그대로 쓰고, 아니라면 이 배치의 커밋 1이 만든다.

### batch05와의 관계 (재확인)

| 이 배치 | batch05 선행 | 이유 |
| --- | --- | --- |
| 커밋 5 (M4) | 커밋 9 (P6-a) | `content/showcase/*.mdx` 6개 frontmatter |
| 커밋 7 (A4) | 커밋 7 (O5), 커밋 8 (O7) | `app/articles/[slug]/page.tsx` |
| 커밋 9 (A7) | 커밋 7 (O5) | 404에 레일 광고가 남아 있으면 안 된다 |

**나머지 10개 커밋은 batch05를 기다리지 않고 시작할 수 있다.**

---

# 파트 5 — 불확실한 지점 (얼버무리지 않고 명시)

1. **A3의 opengraph-image URL 형식.** Next 16이 `<meta og:image>`에 어떤 경로를 내는지
   **빌드 산출물로 확인해야 한다.** 커밋 6의 게이트가 그 절차다. 확인 없이는 값을 확정할 수 없다.

2. **B8의 아이콘.** 현재 `app/icon.svg`는 20×20 · 투명 배경 · 선 그림이다. 설치 아이콘으로 쓰기엔
   부족하지만 512 PNG를 만들려면 **원본 아트워크가 필요하고 없다.** (가) 그대로 간다 /
   (나) 아트워크를 만든다 / (다) 보류 — **운영자 결정.** 권고는 (가) + 백로그 신규 항목.

3. **T13의 게재일.** 6편이 실제로 같은 날 올라갔다. 날짜를 흩뿌리면 검색엔진에 사실이 아닌 값을 낸다.
   `lib/jsonLd.ts:8-9`가 명시한 이 저장소의 원칙과 충돌한다. **운영자 결정.** 권고는 (가) 진실 유지 +
   M4의 tie-break만.

4. **A5의 `relatedArticleCount`.** 레일 배지가 "화면에 있는 개수"인지 "관련 문서 총수"인지에 따라
   값이 다르다. `components/StageRail.tsx`를 읽고 결정하라. 권고는 노출 수.

5. **P7의 한도 6 vs 10.** 권고는 10(파트 0-(4)의 근거). 운영자가 홈 길이를 이유로 6을 원하면
   `HOME_FEATURED_LIMIT = 6`으로 두고 4편의 `featured: true`를 끈다 — **테스트가 그 일치를 강제하므로
   플래그를 안 끄면 빨개진다.**

6. **searchChain 테스트의 타이머 누수.** 기본 `signalFor`가 만드는 `AbortSignal.timeout(12000)`이
   vitest 종료를 늦출 수 있다. **관측되면** 기존 9개 `it`의 본문을 건드리지 말고 `run()` 헬퍼를 추가해
   `signalFor`를 주입하라. 관측 안 되면 손대지 마라.

7. **범위 밖 — 라이트 차트 팔레트의 흰 배경 대비.** `#b8a020`(2.60)과 `#4ab8b0`(2.39)이
   비텍스트 최소 3:1에 미달한다. O4는 다크만 판정했고, 라이트 값을 바꾸면 **이미 학생이 내려받아
   보고서에 넣은 그림과 색이 달라진다.** 백로그 신규 항목으로 올리기를 권한다.

8. **파트 0의 사실 오류 4건.** 백로그 본문(`docs/feature-backlog.md`의 O1 `:872-883`,
   O3 `:897-911`, O4 `:912-920`, P7 `:1036-1046`)을 정정해야 한다. **이 배치의 어느 커밋에서
   할지는 운영자 판단** — 각 커밋에서 해당 항목 문단을 고치는 편이 근거를 붙이기 쉽다.
