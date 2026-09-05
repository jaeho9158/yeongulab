# 구현 설계 — 묶음 3·4·4.5 (15건)

대상: **묶음 3(모바일)** H6 G6 G7 H7 A6 Y4 · **묶음 4(/activity + AI 대응)** G3 G4 G5 L4 W1 ·
**묶음 4.5(접근성 배선)** L5 M1 M2 M3

이 문서의 모든 줄 번호는 `main`(6a156b5) 기준으로 **실제 파일에서 재확인**했다.

---

## 0. 백로그 판정 정정 — 착수 전에 읽을 것

라운드 2~7이 남긴 서술 중 **코드와 어긋나는 것 7건**을 찾았다. 그중 셋은 설계를 바꾼다.

| # | 백로그가 말한 것 | 실제 | 영향 |
| --- | --- | --- | --- |
| **정정 1** | H6 — "헤더가 이미 sticky다. `top` 값 실측 필요" | **헤더는 sticky가 아니다.** `SiteHeader.tsx:7`은 `<header className="border-b border-line">`뿐이고, 저장소 전체에서 `sticky`는 `StageRail.tsx:137` 한 곳뿐이다 | **설계가 바뀐다.** 점프 바는 `top-0`이면 된다. 헤더 높이(h-14=56px) 상쇄가 필요 없다 |
| **정정 2** | A6 — "`globals.css`의 `@media print`가 체크리스트용만 있다" | **`@media print`가 하나도 없다.** `app/globals.css`는 186줄이고 `print` 문자열이 0회다. 인쇄 스타일은 전부 컴포넌트의 Tailwind `print:` 유틸리티(`PrintableChecklist.tsx`, `app/layout.tsx:117·121·128·131`)로만 존재한다. 색인(`backlog-index.md:108`)이 맞고 본문(`feature-backlog.md:71-77`)이 틀렸다 | 새 블록을 **처음부터** 쓴다. 기존 규칙과 충돌할 걱정이 없다 |
| **정정 3** | Y4 — "`위 도구 '…'` 표현이 **17개**" | **체크리스트 frontmatter 안에는 16개**다 (02:2, 03:3, 04:2, 05:6, 06:3). `selfCheck`에는 0개. 게다가 05-writing:11은 `'그림·표 캡션 도우미'`를 **"위 도구" 없이 홑따옴표로만** 부른다 | **치환 규칙이 두 개 필요하다** (아래 Y4) |
| 정정 4 | L5 — "`ProgressOverview.tsx:68`에 링크" | 링크는 **:70**. `aria-hidden`은 :59가 맞다 | 없음 |
| 정정 5 | M1 — "`PresentationQuestionBank.tsx:71`" | 조건부 렌더는 **:72** (`{drawn.length > 0 && (`) | 없음 |
| 정정 6 | M3 — "`GuideBlock.tsx:97-100`의 검정 추천 결과" | **:97-110**. 버튼 :29-36은 정확 | 없음 |
| **정정 7** | W1 — "체크리스트 완료 시점을 한 장으로" | **체크리스트에 시점이 저장돼 있지 않다.** `lib/checklist.ts:31-33`은 `{ v: 2, done: string[] }`만 쓴다 | **W1 설계를 바꾼다.** 아래 W1의 "데이터 실사" 참조 |

추가 실사 — `ActivityType`의 `"NOTE"`와 `"STAGE_COMPLETE"`는 **어디에서도 기록되지 않는다.**
`logActivity` 호출부는 정확히 셋이다:

- `ChecklistCard.tsx:29` → `{ type: "STAGE_ITEM_DONE", refId: "{slug}:{index}" }`
- `EthicsChecklist.tsx:112` → `{ type: "STAGE_ITEM_DONE", refId: "{slug}:ethics:{index}" }`
- `ReflectionBox.tsx:55` → `{ type: "REFLECTION", refId: slug }` (입력 멈춘 뒤 3초 디바운스)

---

# 묶음 3 — 모바일

## H6. 모바일 단계 점프 바 `M`

### 위치

`components/StageRail.tsx:137`

```tsx
<aside className="rail-scroll sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto pr-1 lg:block">
```

`app/guide/[stage]/page.tsx:65`가 그리드를 잡는다:

```tsx
<div className="mx-auto grid max-w-[60rem] items-start gap-12 px-4 py-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
```

`:71-83`이 `StageRail`에 `toolCount={getToolCount(stage.slug)}` `selfCheckCount={stage.selfCheck.length}`
`relatedArticleCount={relatedArticles.length}`를 이미 넘긴다 — 백로그 서술("`:80-82`가 이미 계산해 넘긴다") 정확.

### 판단 1 — `StageRail` 재사용 vs 새 컴포넌트

**새 컴포넌트(`StageJumpBar`)를 만든다.** 근거 셋:

1. `StageRail`은 `sections` 안에 **본문 H2 전부**(`headings.map`)를 넣는다. 12개짜리 단계가 있고,
   가로 한 줄 바에 12개 제목을 넣으면 목적(도구까지 두 번 탭)을 잃는다. H6이 요구하는 건 앵커 3~4개다.
2. `StageRail`은 `activeId` 스크롤 추적 `useEffect`(`:111-133`)를 돌린다.
   `lg:hidden`으로 같은 컴포넌트를 두 번 마운트하면 **같은 계산을 하는 스크롤 리스너가 두 개** 붙는다.
   (Tailwind의 `hidden`은 DOM에서 지우지 않는다.)
3. 레일은 `<ol>` + `<ul>` 두 목록이라 가로 바로 재활용할 수 있는 마크업이 아니다.

**단, 상수는 공유한다.** 필요하면 `ANCHOR_SCROLL_MARGIN_PX`(`StageRail.tsx:13`)를 import한다.

### 판단 2 — `top` 값

**정정 1**에 따라 헤더는 sticky가 아니므로 `sticky top-0`으로 충분하다.
`app/layout.tsx:120`의 `<main className="flex-1">`에 `overflow` 계열 클래스가 없으므로
sticky 컨테이닝 블록은 뷰포트다 — 정상 동작한다.

바 자체 높이는 `h-11`(44px)로 잡는다. 앵커의 `scroll-mt-24`(96px)가 44px보다 크므로
**바가 앵커 제목을 가리지 않는다.** `scroll-mt`를 건드릴 필요가 없다는 뜻이다.

### 변경 후 코드

**새 파일 `components/StageJumpBar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { countDone, subscribeChecklist } from "@/lib/checklist";

type JumpTarget = { href: string; label: string; meta: string | null };

/**
 * 모바일(lg 미만) 전용 단계 내 점프 바.
 *
 * StageRail은 lg:block이라 375px에서 도구·체크리스트·자가검증의 존재 자체가
 * 안 보인다. 본문 H2까지 넣는 레일과 달리 여기서는 "본문 아래에 무엇이 더
 * 있는가"만 3~4개 칩으로 알린다.
 *
 * sticky top-0인 이유: SiteHeader는 sticky가 아니다(header에 sticky 클래스가
 * 없다). 헤더 높이를 상쇄할 필요가 없다. 바 높이 44px < 앵커 scroll-mt-24(96px)
 * 이므로 점프한 제목을 이 바가 가리지 않는다.
 */
export function StageJumpBar({
  slug,
  checklist,
  toolCount,
  selfCheckCount,
  relatedArticleCount,
}: {
  slug: string;
  checklist: string[];
  toolCount: number;
  selfCheckCount: number;
  relatedArticleCount: number;
}) {
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const load = () => setDone(countDone(slug, checklist));
    load();
    return subscribeChecklist(load);
    // checklist는 서버에서 온 고정 배열이라 slug만 보면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const targets: JumpTarget[] = [
    ...(toolCount > 0
      ? [{ href: "#tools", label: "도구", meta: String(toolCount) }]
      : []),
    {
      href: "#checklist",
      label: "체크리스트",
      // 시드 전(null)에는 서버 렌더와 같게 개수만 보여준다
      meta: done === null ? String(checklist.length) : `${done}/${checklist.length}`,
    },
    ...(selfCheckCount > 0
      ? [{ href: "#self-check", label: "자가검증", meta: null }]
      : []),
    ...(relatedArticleCount > 0
      ? [
          {
            href: "#related-articles",
            label: "함께 읽기",
            meta: String(relatedArticleCount),
          },
        ]
      : []),
  ];

  if (targets.length === 0) return null;

  return (
    <nav
      aria-label="이 단계 안에서 이동"
      // -mx-4는 article의 px-4를 상쇄해 바를 화면 폭 끝까지 붙인다.
      // bg-bg가 없으면 sticky 상태에서 본문이 비쳐 보인다.
      className="nav-scroll sticky top-0 z-10 -mx-4 mt-6 flex h-11 items-center gap-1.5 overflow-x-auto border-b border-line bg-bg px-4 lg:hidden print:hidden"
    >
      {targets.map((t) => (
        <a
          key={t.href}
          href={t.href}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium whitespace-nowrap text-ink-soft transition focus-visible:outline-offset-[-2px] hover:border-accent hover:text-ink"
        >
          {t.label}
          {t.meta && (
            <span
              className="font-label text-[11px] text-ink-soft"
              // 체크 진행도는 마운트 후에만 채워진다
              suppressHydrationWarning
            >
              {t.meta}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
```

**`app/guide/[stage]/page.tsx`** — import 추가와 삽입 지점.

```tsx
// :11-13 부근에 추가
import { StageJumpBar } from "@/components/StageJumpBar";
```

`:86-91`의 "← 전체 가이드" 링크 **바로 아래**, `:93`의 제목 블록 **위**에 넣는다.
제목 위에 두는 이유: 제목 아래에 두면 점프 바가 sticky로 붙는 순간
**바가 제목을 덮으며 나타나** 화면이 튄다.

```tsx
        <Link
          href="/guide"
          className="-my-3 -ml-1 flex w-fit items-center py-3 pr-2 pl-1 text-sm text-ink-soft hover:text-ink lg:hidden"
        >
          ← 전체 가이드
        </Link>

        <StageJumpBar
          slug={stage.slug}
          checklist={stage.checklist}
          toolCount={getToolCount(stage.slug)}
          selfCheckCount={stage.selfCheck.length}
          relatedArticleCount={relatedArticles.length}
        />

        <div className="mt-6 flex items-center gap-4 lg:mt-0">
```

### 함정

- **`article`이 `min-w-0`이다**(`:85`). `-mx-4`로 폭을 넓히면 그리드 셀을 넘친다.
  `lg:hidden`이라 lg에서는 애초에 렌더되지 않고, lg 미만은 1열 그리드라 셀 폭 = 컨테이너 폭이므로
  `px-4`를 정확히 상쇄한다. **lg 미만에서만 성립하는 계산이다** — `lg:hidden`을 빼면 깨진다.
- `sticky`에 `z-10`이 필요하다. 없으면 뒤따르는 `.card`(도구 아코디언)가 스크롤 시 바 위로 올라온다.
- `#tools` 앵커는 `StageTools.tsx:149`(`<section id="tools">`)에 이미 있다. `page.tsx`에서 다시 감싸면
  같은 id가 두 번 생긴다 — `:147-148` 주석이 그 함정을 이미 경고한다. **감싸지 마라.**
- `toolCount === 0`인 단계는 없지만(`STAGE_TOOL_TITLES` 6개 전부 비어 있지 않음) 방어는 남겨둔다.
  `relatedArticleCount === 0`은 실제로 가능하다.
- **`suppressHydrationWarning`이 필요한 이유**: `done`은 마운트 후에 채워지므로 서버 문자열
  (`"6"`)과 클라이언트 문자열(`"2/6"`)이 다르다.

### 테스트 — `components/__tests__/StageJumpBar.test.tsx` (신규, `// @vitest-environment jsdom`)

| `it()` 제목 | 검증 |
| --- | --- |
| `"도구·체크리스트·자가검증·함께읽기 앵커를 모두 그린다"` | 각 링크의 `href`가 `#tools` `#checklist` `#self-check` `#related-articles` |
| `"relatedArticleCount가 0이면 '함께 읽기' 칩을 그리지 않는다"` | `queryByText("함께 읽기")`가 null |
| `"체크리스트 진행도가 마운트 후 저장값을 반영한다"` | `writeChecklist("topic", ["가","나"], [true,false])` 후 렌더 → `findByText("1/2")` |
| `"lg 미만 전용 클래스를 유지한다 (회귀선)"` | `nav`의 className이 `lg:hidden`과 `sticky`를 포함. **빠지면 데스크톱에 레일과 바가 둘 다 뜬다** |
| `"nav에 접근 가능한 이름이 있다"` | `getByRole("navigation", { name: "이 단계 안에서 이동" })` |

---

## G6. 넓은 표에 가로 스크롤 단서 `S`

### 위치 (셋)

**(a) `app/guide/[stage]/page.tsx:134-142`** — 백로그 줄 번호 정확.

```tsx
              table: (props) => (
                <div className="overflow-x-auto">
                  {/* prose의 기본 table 스타일이 width:100%라 ... */}
                  <table {...props} className="min-w-max" />
                </div>
              ),
```

**(b) `app/example/page.tsx:178-183`** — 변수 표.

**(c) `app/articles/[slug]/page.tsx:143-147`** — **백로그가 빠뜨린 셋째 곳.**
자료실이 검색 유입 최대 표면이므로 같이 고친다.

### 판단 — 페이드 마스크 vs 텍스트 한 줄

**둘 다 아니고, CSS 스크롤 그림자를 쓴다.** 근거:

- 텍스트 한 줄("→ 옆으로 밀어서 보세요")은 **표가 안 넘칠 때도 항상 뜬다.**
  6열 표와 2열 표가 같은 렌더러를 지나므로, 안 넘치는 표에 거짓 안내가 붙는다.
- 순수 페이드 마스크(`mask-image`)도 같은 문제 + 다크모드에서 배경색을 하드코딩해야 한다.
- `background-attachment: local, scroll` 조합의 스크롤 그림자는 **넘칠 때만 나타나고
  끝까지 밀면 사라진다.** JS 0줄, 다크모드는 `var(--bg)`로 따라온다.

### 변경 후 코드

**`app/globals.css`** 끝(`:186` 뒤)에 추가:

```css
/* 넓은 표의 가로 스크롤 단서 — 넘칠 때만 양끝에 그림자가 생기고, 끝까지
   밀면 사라진다. background-attachment의 local/scroll 조합이 하는 일:
   흰 덮개(local) 두 장은 콘텐츠와 함께 움직이고, 그림자(scroll) 두 장은
   컨테이너에 붙어 있다. 스크롤이 끝에 닿으면 덮개가 그림자를 정확히 가린다.
   넘치지 않는 표는 양끝이 동시에 끝이라 그림자가 처음부터 둘 다 가려진다.
   텍스트 안내와 달리 "실제로 넘칠 때만" 나온다는 게 이 방식의 이유다.

   .scroll-hint는 overflow-x-auto와 함께 쓴다(둘 중 하나만으로는 동작 안 함). */
.scroll-hint {
  background-image:
    linear-gradient(to right, var(--bg), transparent 12px),
    linear-gradient(to left, var(--bg), transparent 12px),
    linear-gradient(to right, rgb(0 0 0 / 0.14), transparent 10px),
    linear-gradient(to left, rgb(0 0 0 / 0.14), transparent 10px);
  background-position: left center, right center, left center, right center;
  background-repeat: no-repeat;
  background-size: 24px 100%, 24px 100%, 12px 100%, 12px 100%;
  background-attachment: local, local, scroll, scroll;
}

/* 다크에서 검정 그림자는 안 보인다 — 흰 쪽으로 뒤집는다 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .scroll-hint {
    background-image:
      linear-gradient(to right, var(--bg), transparent 12px),
      linear-gradient(to left, var(--bg), transparent 12px),
      linear-gradient(to right, rgb(255 255 255 / 0.16), transparent 10px),
      linear-gradient(to left, rgb(255 255 255 / 0.16), transparent 10px);
  }
}
:root[data-theme="dark"] .scroll-hint {
  background-image:
    linear-gradient(to right, var(--bg), transparent 12px),
    linear-gradient(to left, var(--bg), transparent 12px),
    linear-gradient(to right, rgb(255 255 255 / 0.16), transparent 10px),
    linear-gradient(to left, rgb(255 255 255 / 0.16), transparent 10px);
}
```

**세 호출부** — `overflow-x-auto`에 `scroll-hint`를 붙이기만 한다.

```tsx
// app/guide/[stage]/page.tsx:135
                <div className="scroll-hint overflow-x-auto">
// app/example/page.tsx:178
        <div className="scroll-hint mt-2 overflow-x-auto">
// app/articles/[slug]/page.tsx:144
              <div className="scroll-hint overflow-x-auto">
```

### 함정

- **`background-attachment: local`은 `overflow`가 `auto`/`scroll`인 요소에서만 의미가 있다.**
  `overflow-x-auto`를 빼면 그림자가 그냥 항상 붙는다.
- 표가 `bg-surface` 같은 배경을 갖는 순간 그림자가 표 밑에 깔려 안 보인다.
  현재 세 곳 모두 표에 배경이 없다 — **표에 배경을 주는 변경이 오면 이게 조용히 죽는다.**
- O3(다크 차트)이 아직 안 됐지만 이 규칙은 `--bg` 토큰만 쓰므로 O3과 충돌하지 않는다.
- 인쇄에서는 그림자가 잉크를 먹는다. A6의 `@media print` 블록에서 끈다(아래 A6에 포함).

### 테스트 — `app/__tests__/table-scroll-hint.test.ts` (신규, node)

CSS는 단위 테스트로 못 잡는다. **클래스가 호출부 세 곳에 붙어 있는지**를 소스 문자열로 지킨다.

| `it()` 제목 | 검증 |
| --- | --- |
| `"표를 감싸는 세 곳이 모두 scroll-hint를 붙인다"` | 세 파일을 읽어, `overflow-x-auto`가 나오는 모든 줄이 `scroll-hint`도 포함. **overflow-x-auto가 새로 추가되면 실패해서 알려준다** |
| `"globals.css가 .scroll-hint를 정의한다"` | `.scroll-hint {`와 `background-attachment`가 있다 |

(주의: 헤더의 `.nav-scroll`(`SiteHeader.tsx:40`)과 `StageJumpBar`도 `overflow-x-auto`를 쓴다.
테스트는 **위 세 파일만** 읽는다.)

---

## G7. 변수 정의표 행의 모바일 레이아웃 `S`

### 위치

`components/VariableTableBuilder.tsx:57-98`. 백로그 `:59` 정확 —
`<div key={i} className="flex flex-wrap items-start gap-2">`가 :59다.

### 변경 후 코드 (`:57-98` 통째 교체)

```tsx
      <div className="mt-4 space-y-3 sm:space-y-2">
        {rows.map((row, i) => (
          // sm 미만: 카드 한 장(테두리 + 헤더 줄). sm 이상: 지금까지의 한 줄 배치.
          // 좁은 폭에서 flex-wrap만 쓰면 랩된 삭제 버튼이 어느 행 것인지
          // 알 수 없고 행 사이에 경계도 없어 4~5행이 한 덩어리로 보인다.
          <div
            key={i}
            className="rounded-lg border border-line p-3 sm:flex sm:flex-wrap sm:items-start sm:gap-2 sm:rounded-none sm:border-0 sm:p-0"
          >
            {/* 행 머리 — sm 이상에서는 한 줄 배치가 이미 순서를 말해주므로 감춘다 */}
            <div className="mb-2 flex items-center justify-between sm:hidden">
              <span className="font-label text-xs font-medium text-ink-soft">
                변수 {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                // 최소 터치 타겟 44px — 음수 마진으로 카드 여백을 먹어
                // 시각적 행 높이는 그대로 두면서 히트 영역만 넓힌다
                className="-my-2 -mr-1 flex min-h-11 items-center px-2 text-xs text-ink-soft hover:text-ink"
                aria-label={`변수 ${i + 1} 행 삭제`}
              >
                삭제
              </button>
            </div>

            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="변수명 (예: 조명 세기)"
              aria-label={`${i + 1}번째 변수 이름`}
              className="w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent sm:flex-1"
            />
            <select
              value={row.role}
              onChange={(e) => update(i, { role: e.target.value as Row["role"] })}
              aria-label={`${i + 1}번째 변수 구분`}
              className="mt-2 w-full rounded-lg border border-line bg-bg px-2 py-2 text-sm text-ink focus:border-accent sm:mt-0 sm:w-auto"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              value={row.note}
              onChange={(e) => update(i, { note: e.target.value })}
              placeholder="설명/측정 방법"
              aria-label={`${i + 1}번째 변수 설명/측정 방법`}
              className="mt-2 w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent sm:mt-0 sm:flex-1"
            />
            {/* sm 이상 전용 삭제 버튼 — 카드 머리의 것과 둘 중 하나만 보인다 */}
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="hidden rounded-lg px-2 py-2 text-xs text-ink-soft hover:text-ink sm:block"
              aria-label={`변수 ${i + 1} 행 삭제`}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
```

### 함정

- **삭제 버튼이 DOM에 두 개가 된다.** 시각적으로는 항상 하나지만 `getAllByLabelText`는 둘을 본다.
  그래서 `aria-label`을 `"행 삭제"`(현행, 전 행 동일)에서 **`"변수 N 행 삭제"`로 바꿨다.**
  - 부수 효과: 지금은 4행일 때 낭독기가 "행 삭제" 버튼 넷을 구분 못 한다. 이게 고쳐진다.
  - **`getByLabelText`를 쓰면 테스트가 실패한다.** `getAllByLabelText(...)[0]`을 써야 한다.
  - `sm:block` 쪽에 `aria-hidden`을 걸 수는 **없다** — 탭 가능한 요소를 aria-hidden 안에 두는 건
    L5가 지금 고치는 바로 그 위반이다.
  - **대안(구현 시 판단 필요)**: 버튼 하나 + `sm:order-last`. 다만 카드 머리의 "변수 N"과 같은 줄에
    놓으려면 그 줄이 flex 컨테이너여야 하는데, 버튼이 그 줄 밖으로 나가야 sm 배치가 성립해서
    결국 DOM 하나로는 안 된다. **이 문서는 "버튼 두 개 + 구분되는 라벨"을 권한다.**
- `usePersistentState`가 키 입력마다 직렬화한다(L7). 이 변경은 악화시키지 않는다 — 입력 개수 동일.
- `sm:rounded-none sm:border-0 sm:p-0`을 빠뜨리면 데스크톱에 테두리 상자가 생겨 회귀다.

### 테스트 — `components/__tests__/VariableTableBuilder.test.tsx` (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"행마다 구분되는 삭제 라벨을 붙인다"` | 2행에서 `getAllByLabelText("변수 2 행 삭제")`가 길이 2(모바일/데스크톱 쌍) |
| `"삭제하면 그 행만 사라진다"` | 3행 채우고 `getAllByLabelText("변수 2 행 삭제")[0]` 클릭 → 남은 값이 1·3번째 |
| `"삭제 후 라벨 번호가 다시 매겨진다"` | 3행 중 2번을 지우면 `"변수 2 행 삭제"`가 여전히 존재(원 3번이 2번이 됨) |
| `"표로 복사하기가 채워진 행만 담는다 (기존 동작 회귀선)"` | `navigator.clipboard.writeText` 스텁으로 마크다운 검증 |

---

## H7. `/example` 상단 단계 앵커 칩 `S`

### 위치

`app/example/page.tsx` (382줄). `StageHeading`은 `:30-53`.
호출 6회: `:85`(topic) `:113`(prior-research) `:165`(methodology) `:235`(data-collection)
`:266`(writing) `:334`(submission). **slug가 6개 단계 slug와 정확히 일치**하므로 앵커 id로 그대로 쓴다.

`FictionNotice` 블록은 `:80-82`, 본문 시작은 `:84`.

### 변경 후 코드

**(1) `StageHeading`에 id·scroll-mt 추가 (`:39-40` 교체)**

```tsx
    <div
      id={`stage-${slug}`}
      // 칩에서 점프했을 때 제목이 화면 맨 위에 붙지 않게 띄운다.
      // 가이드 본문 앵커와 같은 96px.
      className="mt-14 scroll-mt-24 flex items-center gap-4"
    >
```

**(2) 상수 (`:16` 근처, `FictionNotice` 위)**

```tsx
// 아래 StageHeading 호출 6개와 같은 순서·같은 slug다. 하나를 고치면 둘 다 고칠 것.
// (page.tsx 안에서만 쓰는 목록이라 lib/guide를 부르지 않는다 — 여기 6개는
//  본문에 하드코딩된 서사이지 데이터가 아니다.)
const STAGE_CHIPS = [
  { slug: "topic", order: 1, title: "주제 선정" },
  { slug: "prior-research", order: 2, title: "선행연구 조사" },
  { slug: "methodology", order: 3, title: "방법론 설계" },
  { slug: "data-collection", order: 4, title: "데이터 수집" },
  { slug: "writing", order: 5, title: "논문화" },
  { slug: "submission", order: 6, title: "저널 투고" },
] as const;
```

**(3) 칩 줄을 `FictionNotice` 아래(`:83` 뒤)에 삽입**

```tsx
      <div className="mt-8">
        <FictionNotice />
      </div>

      {/* 382줄 단일 스크롤이라 "내 단계 하나만 보러" 재방문한 사람이 갈 곳이
          없다. StageRail은 lg:block이라 모바일에 아예 없다.
          헤더 메뉴와 같은 nav-scroll + G6의 scroll-hint를 재사용한다. */}
      <nav
        aria-label="단계로 바로 가기"
        className="nav-scroll scroll-hint mt-8 flex gap-1.5 overflow-x-auto border-y border-line py-3"
      >
        {STAGE_CHIPS.map((s) => (
          <a
            key={s.slug}
            href={`#stage-${s.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium whitespace-nowrap text-ink-soft transition focus-visible:outline-offset-[-2px] hover:border-accent hover:text-ink"
          >
            <span className="font-label">{String(s.order).padStart(2, "0")}</span>
            {s.title}
          </a>
        ))}
      </nav>
```

### 함정

- **`STAGE_CHIPS`가 `StageHeading` 호출 6개와 어긋날 수 있다.** 이게 이 항목의 유일한 리스크다. 테스트로 잠근다.
- `nav-scroll`은 스크롤바를 감춘다(`globals.css:181-185`). 6개 칩이 375px에서 넘치는데
  스크롤바가 없으면 밀 수 있는 줄 모른다 → **`scroll-hint`가 필요하다. 그래서 H7은 G6 뒤 커밋이다.**
- H6의 `StageJumpBar`와 마크업이 닮았지만 **공용화하지 마라.** 하나는 클라이언트 컴포넌트
  (체크리스트 구독)이고 하나는 서버 컴포넌트다. 공용화하면 `/example`이 `"use client"`가 된다.

### 테스트 — `app/__tests__/example-anchors.test.ts` (신규, node)

| `it()` 제목 | 검증 |
| --- | --- |
| `"칩 목록과 StageHeading 호출의 slug가 정확히 일치한다"` | 소스에서 `STAGE_CHIPS`의 slug 6개와 `/<StageHeading[^>]*slug="([a-z-]+)"/g` 매치 6개가 **순서까지** 같음 |
| `"칩 slug가 전부 실제 단계 slug다"` | `getAllStages().map(s => s.slug)`와 집합이 같음. **단계 slug가 바뀌면 `/guide/{slug}` 링크가 404가 되므로 여기서 잡는다** |
| `"StageHeading이 id와 scroll-mt-24를 붙인다"` | 소스에 `id={\`stage-${slug}\`}`와 `scroll-mt-24`가 있음 |

---

## A6 + Y4. 자료실 인쇄 스타일 + 인쇄물의 "위 도구" `S` + `M`

**백로그 지시대로 한 커밋으로 묶는다.**

### A6 — 위치

`app/globals.css` 186줄에 **`print` 문자열이 0회다** (정정 2).
인쇄 대상 마크업 (`app/articles/[slug]/page.tsx`):

- "← 자료실" 되돌아가기: `:87-93`
- 목차 nav: `:104-123` (`<nav aria-label="이 문서의 목차">`)
- "자료실의 다른 문서": `:169-183`
- 이전/다음: `:185-206`
- 헤더/푸터/레일 광고: `app/layout.tsx:117·121·128·131`이 **이미 `print:hidden`** — 건드리지 않는다

### A6 — 변경 후 코드

`app/globals.css` 끝에 추가:

```css
/* ── 인쇄 ────────────────────────────────────────────────────────────
   학교 현장은 종이다. 자료실 한 편을 그대로 뽑아 나눠 주는 것이 실제 용법이라
   화면 전용 요소(목차·다른 문서·이전다음)를 빼고, 화면에서만 유효한 내부
   링크에는 URL을 적어 준다.

   헤더·푸터·레일 광고는 app/layout.tsx가 print:hidden으로 이미 처리한다. */
@media print {
  @page {
    margin: 15mm;
  }

  /* 클래스가 아니라 data 속성을 쓴 이유: Tailwind print:hidden을 마크업 네 곳에
     흩는 것보다 "인쇄에서 뺄 것"이라는 의도를 한 곳에 모으는 편이 낫고,
     새 섹션이 생겼을 때 붙일 자리가 분명해진다. */
  [data-print="hide"] {
    display: none !important;
  }

  /* 표·코드블록이 페이지 경계에서 반으로 잘리지 않게 */
  .prose table,
  .prose pre,
  .prose blockquote,
  .prose figure {
    break-inside: avoid;
  }
  /* 제목만 페이지 끝에 남고 본문이 다음 장으로 넘어가는 고아 제목 방지.
     .prose 밖(ProcessRecord 등)에도 걸려야 하므로 전역으로 둔다. */
  h2,
  h3 {
    break-after: avoid;
  }

  /* 내부 링크는 종이에서 죽는다 — 주소를 적어 준다.
     외부 링크(href^="http")는 본문에 출처가 적힌 경우가 많고 주소가 길어 줄을
     망가뜨리므로 제외한다. 앵커(#)와 mailto도 제외 — 같은 종이 안이거나
     눌러야 의미가 있다.
     도메인은 lib/site.ts의 SITE_URL과 짝이다. 하나를 바꾸면 둘 다 바꿀 것
     (CSS에서 TS 상수를 읽을 방법이 없어 여기만 하드코딩이다). */
  .prose a[href^="/"]::after {
    content: " (yeongulab.com" attr(href) ")";
    font-size: 0.85em;
    color: #555;
    word-break: break-all;
  }

  /* G6의 스크롤 그림자는 종이에서 잉크만 먹는다.
     화면에서 스크롤되던 표는 종이에서 잘리면 안 되므로 폭에 맞춰 접는다. */
  .scroll-hint {
    background-image: none !important;
    overflow: visible !important;
  }
  .scroll-hint > table {
    min-width: 0 !important;
    width: 100% !important;
    font-size: 0.8em;
  }

  /* 잉크 절약 + 흑백 프린터 대비 */
  body {
    background: #fff !important;
    color: #000 !important;
  }
}
```

**`app/articles/[slug]/page.tsx`** — 네 곳에 `data-print="hide"`:

```tsx
// :87  되돌아가기
      <Link
        data-print="hide"
        href={article.category ? `/articles#${article.category}` : "/articles"}
// :105 목차
        <nav
          data-print="hide"
          aria-label="이 문서의 목차"
// :169 다른 문서
      <div data-print="hide" className="mt-10 border-t border-line pt-5">
// :186 이전/다음
        <div data-print="hide" className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-8">
```

`{stage && ...}`(`:152-167`, "이어지는 단계")는 **남긴다** — 종이에서도 다음에 볼 것을
알려주는 정보이고, `::after` 규칙이 URL을 붙여 준다.

### A6 — 함정

- **`yeongulab.com`을 CSS에 하드코딩한다.** `lib/site.ts`의 `SITE_URL`과 두 번째 진실 원본이 된다.
  CSS에서 TS 상수를 읽을 방법이 없으므로 **주석으로 짝을 명시**하고 테스트로 잠근다.
- `attr(href)`는 **CSS `content`에서만 문자열로 쓸 수 있다.** `url()` 안에는 못 넣는다 — 지금 안 쓴다.
- `color: #555`는 토큰이 아니다. 인쇄는 항상 흰 종이라 `--ink-soft`를 쓰면 다크 테마에서 뽑을 때
  회색 글씨가 된다. **인쇄 블록 안에서만 고정색이 옳다.**
- `.prose a[href^="/"]`는 자료실 본문만 잡는다. 내비게이션은 이미 `display:none`이라 무관.
- `h2, h3 { break-after: avoid }`를 전역으로 둔 것은 W1의 `ProcessRecord`가 `.prose` 밖이기 때문이다.

### Y4 — 위치와 실측

**정정 3** 재확인. `content/guide/*.mdx`의 **frontmatter `checklist` 배열** 안 `위 도구 '…'`:

| 파일 | 줄 | 개수 |
| --- | --- | --- |
| `01-topic.mdx` | — | 0 |
| `02-prior-research.mdx` | 9, 11 | 2 |
| `03-methodology.mdx` | 9, 10, 12 | 3 |
| `04-data-collection.mdx` | 9, 10 | 2 |
| `05-writing.mdx` | 9, 10, 11, 12, 13, 14 | 6 |
| `06-submission.mdx` | 9, 12, 14 | 3 |
| **합계** | | **16** |

`selfCheck`에는 0개. 백로그의 "17"은 본문(content) 것을 하나 섞은 수로 보인다.

**추가로 발견한 패턴 하나** — `05-writing.mdx:11`:

```yaml
  - "그림·표 만들기 — 위 도구 '간이 차트 그리기'로 그리고, '그림·표 캡션 도우미'로 본문 없이도 읽히는 캡션을 답니다."
```

`'그림·표 캡션 도우미'`는 **"위 도구"가 앞에 없다.** 같은 줄의 두 번째 도구라 생략됐다.

→ **치환은 "위 도구 'X'" 패턴만으로는 부족하다. 홑따옴표 안 문자열이 `TOOL_IDS`의 키면 전부 대상이다.**

### Y4 — 판단: 어디서 갈라내는가

백로그가 "MDX가 아니라 렌더러에서 갈라야 한다"고 판정했다. **동의한다.**
단계 페이지에서는 본문 → 도구 → 체크리스트 순이라 "위 도구"가 맞다.

**`PrintableChecklist`가 치환한다.** 그리고 **화면·종이 두 버전을 만들지 않는다.**
`/guide/print`는 `:47` 제목이 "인쇄용 진행 노트", `:49-51`이 "아래 버튼으로 인쇄하거나
PDF로 저장하세요"다 — **이 페이지는 화면에서도 인쇄 미리보기다.** 한 번만 렌더한다.

### Y4 — 변경 후 코드

**새 파일 `lib/toolReferences.ts`**

```ts
import { TOOL_IDS, STAGE_SLUGS, STAGE_TOOL_TITLES } from "@/lib/stageToolMeta";

/** 도구 제목 → 그 도구가 사는 단계 slug (첫 등장 기준). */
const TOOL_STAGE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const stage of STAGE_SLUGS) {
    for (const title of STAGE_TOOL_TITLES[stage]) {
      // "내 레퍼런스 목록"처럼 두 단계에 있는 도구는 먼저 나오는 단계로 보낸다
      if (!(title in map)) map[title] = stage;
    }
  }
  return map;
})();

/** 도구 제목 → 절대 경로 앵커. 모르는 제목이면 null. */
export function toolUrl(title: string): string | null {
  const id = (TOOL_IDS as Record<string, string>)[title];
  const stage = TOOL_STAGE[title];
  if (!id || !stage) return null;
  return `/guide/${stage}#tool-${id}`;
}

/**
 * 체크리스트 문구를 종이용으로 고친다.
 *
 * 단계 페이지는 본문 → 도구 → 체크리스트 순서라 "위 도구 'X'"가 맞지만,
 * /guide/print는 checklist·selfCheck만 뽑으므로 종이에는 도구가 한 개도 없다.
 * MDX를 고치면 화면 쪽이 어색해지므로 렌더러에서 갈라낸다(백로그 Y4).
 *
 * 두 패턴을 처리한다:
 *   1) "위 도구 'X'"  → "'X' 도구(주소)"
 *   2) 앞에 '위 도구'가 없는 홑따옴표 도구 이름 'X' → "'X' 도구(주소)"
 * 2번이 필요한 이유: 05-writing 체크리스트 3번째 줄이 한 줄에 도구 둘을
 * 부르면서 두 번째('그림·표 캡션 도우미')에는 '위 도구'를 생략했다.
 *
 * 홑따옴표 안이 TOOL_IDS에 없는 문자열이면 건드리지 않는다 —
 * 체크리스트에는 도구가 아닌 인용부호도 들어올 수 있다.
 *
 * 도메인은 app/globals.css의 @media print 규칙, lib/site.ts의 SITE_URL과 짝이다.
 */
export function printableChecklistText(text: string): string {
  // ‘’: 타이포그래피 홑따옴표도 함께 받는다(MDX에 섞일 수 있다)
  const QUOTED = /(위 도구\s*)?['‘]([^'’]+)['’]/g;
  return text.replace(QUOTED, (whole, _prefix: string | undefined, title: string) => {
    const url = toolUrl(title);
    if (!url) return whole; // 도구 이름이 아니면 원문 그대로
    return `'${title}' 도구(yeongulab.com${url})`;
  });
}
```

**`components/PrintableChecklist.tsx`** — `:85-100`의 체크리스트 항목 렌더에 적용:

```tsx
import { printableChecklistText } from "@/lib/toolReferences";
```

```tsx
                  {stage.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span aria-hidden className="mt-0.5 shrink-0">
                        {checked[i] ? "☑" : "☐"}
                      </span>
                      <span
                        className={
                          checked[i] ? "text-ink-soft line-through" : "text-ink"
                        }
                      >
                        {/* 종이에는 "위" 도구가 없다 — 주소로 바꿔 준다 (Y4) */}
                        {printableChecklistText(item)}
                      </span>
                    </li>
                  ))}
```

### Y4 — 함정

- **`lib/toolReferences.ts`가 `stageToolMeta`를 import한다.** `stageToolMeta.ts`는 `fs`를 쓰지 않는
  순수 상수 모듈이라 클라이언트 컴포넌트에서 안전하다(`StageTools.tsx:7`이 이미 그렇게 쓴다).
  **`lib/guide`를 부르면 안 된다** — `fs`를 탄다.
- **`"내 레퍼런스 목록"`은 `prior-research`와 `writing` 두 단계에 있다**(`STAGE_TOOL_TITLES:22,40`).
  `TOOL_STAGE`가 첫 등장인 `prior-research`를 고른다. 05-writing 체크리스트에서 이 도구를 부르면
  **2단계 URL이 붙는다.** 도구 자체는 같은 컴포넌트라 잘못된 안내는 아니지만
  "5단계 체크리스트인데 2단계 주소"가 어색할 수 있다 — **구현 시 판단 필요.**
  (대안: `printableChecklistText(text, stageSlug)`로 현재 단계를 우선.)
- 도구 이름에 `·`이 들어간다(`"연구윤리 · 재현가능성 체크리스트"`, `"그림·표 캡션 도우미"`).
  `[^'']+`가 그대로 받으므로 문제없다.
- **05-writing:12는 한 줄에 도구가 둘**(`'인용 형식 만들어보기'`, `'내 레퍼런스 목록'`).
  둘 다 치환되어 줄이 길어진다. 종이에서 두 줄이 되지만 정보가 맞는 게 우선이다.

### 테스트 — `lib/__tests__/toolReferences.test.ts` (신규, node)

| `it()` 제목 | 검증 |
| --- | --- |
| `"'위 도구 X'를 주소가 붙은 표현으로 바꾼다"` | `"… 위 도구 '표본 크기 계산기'를 …"` → `"'표본 크기 계산기' 도구(yeongulab.com/guide/data-collection#tool-sample-size)"` 포함 |
| `"'위 도구'가 없는 홑따옴표 도구 이름도 바꾼다"` | `"'그림·표 캡션 도우미'로"` → 주소 포함. **05-writing:11 회귀선** |
| `"도구 이름이 아닌 홑따옴표는 건드리지 않는다"` | `"'열심히 했다' 류의 서술"`이 그대로 |
| `"실제 6단계 체크리스트에 '위 도구'가 한 개도 남지 않는다"` | `getAllStages()`를 돌며 `checklist.map(printableChecklistText)`에 `"위 도구"`가 0회. **이게 Y4의 완료 판정이다** |
| `"모든 도구 24개가 URL을 갖는다"` | `Object.keys(TOOL_IDS).every(t => toolUrl(t) !== null)` |
| `"인쇄에 쓰는 도메인이 SITE_URL과 같다"` | `SITE_URL`이 `"yeongulab.com"`을 포함하고, `app/globals.css`와 `lib/toolReferences.ts` 소스에 같은 문자열이 있다 |

### 커밋 분할 (묶음 3)

| # | 커밋 | 내용 |
| --- | --- | --- |
| 1 | `fix: 넓은 표에 가로 스크롤 단서 (G6)` | globals.css `.scroll-hint` + 호출부 3곳 + `app/__tests__/table-scroll-hint.test.ts` |
| 2 | `feat: /example 단계 앵커 칩 (H7)` | `STAGE_CHIPS`, `StageHeading` id, 칩 nav, `example-anchors.test.ts`. **G6 뒤** (`.scroll-hint` 의존) |
| 3 | `feat: 모바일 단계 점프 바 (H6)` | `StageJumpBar.tsx` 신규 + `guide/[stage]/page.tsx` 배선 + 테스트 |
| 4 | `fix: 변수 정의표 행을 모바일에서 카드로 (G7)` | `VariableTableBuilder.tsx` + 테스트 |
| 5 | `feat: 자료실 인쇄 스타일과 인쇄물 도구 주소 (A6·Y4)` | globals.css `@media print` + `data-print` 4곳 + `lib/toolReferences.ts` + `PrintableChecklist` + 테스트 |

---

# 묶음 4 — /activity + AI 대응

G3·G4·G5·L4는 파일 셋(`lib/activity.ts`, `ActivityHeatmap.tsx`, `StageDurations.tsx`)에 몰려 있다.
W1은 그 위에 얹는다.

## G5 (먼저) — `lib/activity.ts`에 `getLastActivity`

W1과 G5가 같은 함수를 쓰므로 **이걸 먼저 짓는다.**

### 위치

`lib/activity.ts:108` (파일 끝). `getStageDurations`가 `:81-107`, `countCalendarDays`가 `:73-78`(비export).

### 변경 후 코드 — `lib/activity.ts` 끝에 추가

```ts
export type LastActivity = {
  /** ISO(UTC) 문자열. 날짜로 표시할 때는 toLocalDateKey(new Date(...))를 쓸 것 */
  occurredAt: string;
  /** 오늘까지의 달력 일수. 오늘이면 0 */
  daysAgo: number;
  /**
   * 그 기록이 속한 단계 slug. refId 앞 조각이 아는 slug가 아니면 null
   * (모르는 값을 링크로 만들면 404가 된다).
   */
  stageSlug: string | null;
};

/**
 * 가장 최근 활동 하나. 기록이 없으면 null.
 *
 * "지금 어디까지 왔나"가 아니라 "얼마나 오래 손을 놓았나"를 알려주기 위한 값이다.
 * 한 학기 연구의 가장 흔한 실패가 중단인데 /activity는 회고 재료만 주고
 * 판단 재료를 안 준다(백로그 G5).
 *
 * knownStageSlugs를 인자로 받는 이유: 이 모듈이 lib/guide(fs)를 import하면
 * 클라이언트에서 깨진다. 호출부가 이미 getAllStages() 결과를 갖고 있다.
 */
export function getLastActivity(
  knownStageSlugs: readonly string[] = [],
): LastActivity | null {
  const log = getActivityLog();
  if (log.length === 0) return null;

  let latest = log[0];
  for (const e of log) {
    if (new Date(e.occurredAt).getTime() > new Date(latest.occurredAt).getTime()) {
      latest = e;
    }
  }

  const then = new Date(latest.occurredAt);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // 시간 차가 아니라 달력 날짜 차 — getStageDurations의 countCalendarDays와 같은 이유.
  // Math.max(0, ...)은 기기 시계가 뒤로 갔을 때 음수를 막는다.
  const daysAgo = Math.max(
    0,
    Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000),
  );

  // refId는 "slug", "slug:3", "slug:ethics:2" 셋 중 하나다(logActivity 호출부 3곳).
  const head = latest.refId.split(":")[0];
  const stageSlug = knownStageSlugs.includes(head) ? head : null;

  return { occurredAt: latest.occurredAt, daysAgo, stageSlug };
}

export type ActivitySpan = {
  firstAt: string;
  lastAt: string;
  /** 첫 기록일과 마지막 기록일을 모두 포함한 달력 일수 */
  spanDays: number;
  /** 실제로 기록이 하나라도 있었던 날의 수 */
  activeDays: number;
  totalEntries: number;
};

/** 기록 전체의 기간 요약. 기록이 없으면 null. (W1) */
export function getActivitySpan(): ActivitySpan | null {
  const log = getActivityLog();
  if (log.length === 0) return null;
  const times = log
    .map((e) => new Date(e.occurredAt).getTime())
    .sort((a, b) => a - b);
  const first = new Date(times[0]);
  const last = new Date(times[times.length - 1]);
  const activeDays = new Set(
    log.map((e) => toLocalDateKey(new Date(e.occurredAt))),
  ).size;
  return {
    firstAt: first.toISOString(),
    lastAt: last.toISOString(),
    spanDays: countCalendarDays(first, last),
    activeDays,
    totalEntries: log.length,
  };
}

/**
 * 월별 활동 일수 — 히트맵의 텍스트판. 종이에는 격자를 그릴 수 없으므로
 * "몇 월에 며칠 손댔나"로 분포를 대신 보여준다(W1). 오래된 달부터.
 */
export function getMonthlyActiveDays(): { month: string; days: number }[] {
  const byDay = getActivityByDay();
  const byMonth = new Map<string, number>();
  for (const day of Object.keys(byDay)) {
    const month = day.slice(0, 7); // "2026-06"
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, days]) => ({ month, days }));
}
```

`countCalendarDays`는 지금 비export다 — **export로 바꾸지 말고 같은 파일 안에서 쓴다**(위 코드가 그렇다).

### 함정

- **`knownStageSlugs` 기본값이 `[]`라 넘기는 걸 잊으면 `stageSlug`가 항상 null이다.**
  조용히 링크가 사라진다. 테스트로 문서화한다.
- `daysAgo`에 `Math.max(0, ...)`이 필요하다. 다른 탭에서 방금 기록해도 음수가 날 수 있다.
- `getActivityLog`는 모듈 내부 함수(비export)다. 같은 파일 안이라 그대로 쓴다.

## G3 + L4 — `ActivityHeatmap` 빈 상태 + 낭독기

### 위치

`components/ActivityHeatmap.tsx`. 백로그 줄 번호 전부 정확:
`:65` 주석, `:76-83` 칸, `:52-54` totalCount.

```tsx
                  <div
                    key={di}
                    title={`${key}: ${count}건`}
                    aria-label={count > 0 ? label : undefined}
                    aria-hidden={count === 0 ? true : undefined}
                    className={`h-3 w-3 rounded-sm ${levelFor(count)}`}
                  />
```

**L4 진단 확인**: `role`이 없는 `<div>`는 `role=generic`이고, ARIA에서 generic은
"name from author" 금지 대상이라 `aria-label`이 무시된다. 백로그 판정이 맞다.

### 판단 — 칸에 `role="img"` vs `sr-only` 요약

**`sr-only` 요약 목록을 쓴다.** 근거:

- 칸마다 `role="img"`를 주면 84칸 중 활동일이 30일일 때 낭독기 사용자가
  **이미지 30개를 하나씩 지나야 한다.** 시각 사용자가 한눈에 보는 것을 낭독기 사용자만
  30번 탐색하게 만드는 건 등가가 아니다.
- 격자는 본질적으로 "분포"를 보여준다. 낭독기에 필요한 건 분포의 **요약**이다.
- 요약 목록은 G3(빈 상태)과 같은 데이터를 쓴다 — 한 번의 계산으로 둘 다 해결된다.

격자 자체는 `aria-hidden`으로 완전히 숨긴다. 지금의 `role="group"` + 칸별 라벨은
**아무것도 안 읽힌다**(칸 라벨이 버려져 group 이름 "총 N건"만 남는다).

### 변경 후 코드 — `components/ActivityHeatmap.tsx` (전체 교체)

```tsx
"use client";

import Link from "next/link";
import { getActivityByDay, toLocalDateKey } from "@/lib/activity";
import { useSeededState } from "@/lib/useSeededState";
import { SectionHead } from "@/components/SectionHead";

const WEEKS = 12;
const DAYS_PER_WEEK = 7;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 범례 스와치 — levelFor의 4단계와 같은 순서
const LEGEND_LEVELS = ["bg-surface", "bg-accent/30", "bg-accent/60", "bg-accent"];

function levelFor(count: number): string {
  if (count <= 0) return "bg-surface";
  if (count === 1) return "bg-accent/30";
  if (count <= 3) return "bg-accent/60";
  return "bg-accent";
}

export function ActivityHeatmap() {
  const [byDay] = useSeededState(getActivityByDay);

  if (byDay === null) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = WEEKS * DAYS_PER_WEEK;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= today.getTime()) {
    const week: Date[] = [];
    for (let d = 0; d < DAYS_PER_WEEK && cursor.getTime() <= today.getTime(); d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const days = weeks.flat();
  const totalCount = days.reduce(
    (sum, date) => sum + (byDay[toLocalDateKey(date)] ?? 0),
    0,
  );
  // 낭독기 요약용 — 활동이 있었던 날만 (L4)
  const activeDays = days
    .map((date) => ({ date, count: byDay[toLocalDateKey(date)] ?? 0 }))
    .filter((d) => d.count > 0);

  // ── G3. 첫 방문자에게 회색 격자 84칸은 "고장난 페이지"다.
  //     기록을 만드는 주체가 어디에도 안 적혀 있어서 뭘 해야 할지도 모른다.
  if (totalCount === 0) {
    return (
      <section className="mt-10">
        <SectionHead title="최근 12주간 활동" meta="아직 기록 없음" />
        <div className="border-b border-line py-5">
          <p className="text-[15px] leading-[1.7] text-ink-soft">
            아직 기록이 없습니다. 가이드에서{" "}
            <strong className="font-semibold text-ink">체크리스트를 체크</strong>
            하거나{" "}
            <strong className="font-semibold text-ink">자가검증 질문에 답</strong>
            을 적으면 그날 날짜로 여기에 쌓입니다. 5단계의 연구윤리 체크리스트도
            같이 기록됩니다.
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
            기록은 이 기기의 브라우저에만 저장되고 어디로도 전송되지 않습니다.
          </p>
          <Link
            href="/guide"
            className="mt-4 inline-flex w-fit rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink transition hover:border-accent"
          >
            가이드에서 시작하기 →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <SectionHead title="최근 12주간 활동" meta={`총 ${totalCount}건`} />
      <div className="border-b border-line py-5">
        {/* L4. 격자는 장식으로 완전히 숨기고 요약을 따로 읽힌다.
            칸(role 없는 div)에 aria-label을 달아도 ARIA는 generic 역할에
            author name을 허용하지 않아 브라우저가 버린다. 칸마다 role="img"를
            주면 이번엔 활동일 수만큼 이미지를 하나씩 지나야 해서, 시각
            사용자가 한눈에 보는 분포를 낭독기 사용자만 수십 번 탐색하게 된다.
            분포는 요약으로 전하는 것이 등가다.

            주의: 이 aria-hidden 안에 포커스 가능한 요소를 넣으면 안 된다
            (axe aria-hidden-focus — L5가 고친 바로 그 위반). */}
        <div className="overflow-x-auto" aria-hidden>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) => {
                  const count = byDay[toLocalDateKey(date)] ?? 0;
                  return (
                    <div
                      key={di}
                      title={`${toLocalDateKey(date)}: ${count}건`}
                      className={`h-3 w-3 rounded-sm ${levelFor(count)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="sr-only">
          <p>
            최근 12주간 활동 요약. 총 {totalCount}건, 활동한 날{" "}
            {activeDays.length}일.
          </p>
          <ul>
            {activeDays.map(({ date, count }) => (
              <li key={toLocalDateKey(date)}>
                {date.getMonth() + 1}월 {date.getDate()}일: {count}건
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
          <p>
            {WEEKDAY_LABELS[0]}부터 {WEEKDAY_LABELS[6]}까지 · 왼쪽이 과거,
            오른쪽이 최근
          </p>
          {/* "적음 [][][][] 많음"은 낭독기에 의미 없는 소리다 */}
          <div aria-hidden className="flex items-center gap-1.5">
            <span>적음</span>
            {LEGEND_LEVELS.map((cls) => (
              <span key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
            ))}
            <span>많음</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 함정

- **`aria-hidden` 안에 포커스 가능한 요소가 없어야 한다** — L5가 고치는 바로 그 위반.
  격자 칸은 `<div>`뿐이고 범례도 `<span>`뿐이다. **툴팁 버튼 같은 걸 넣으면 위반이 된다.**
- `activeDays`가 84개 전부일 수 있다(매일 활동). `sr-only` 목록 84줄은 길지만
  **건너뛸 수 있는 목록**이라 칸 84개를 지나는 것과 다르다.
- G3 분기가 `useSeededState`의 `null` 반환 **뒤에** 있어야 한다(`:24`). 순서를 바꾸면
  서버 렌더에 빈 상태가 그려졌다가 hydration 뒤 격자로 바뀐다.

### 테스트 — `components/__tests__/ActivityHeatmap.test.tsx` (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"기록이 0건이면 격자 대신 안내 문단과 /guide 링크를 그린다"` | `findByRole("link", { name: /가이드에서 시작하기/ })`, 격자 칸(`h-3 w-3`) 0개 |
| `"빈 상태 안내가 기록을 만드는 주체 셋을 밝힌다"` | 텍스트에 `"체크리스트"`, `"자가검증"`, `"연구윤리"`가 모두 포함 |
| `"기록이 있으면 격자를 그리고 sr-only 요약을 붙인다"` | 활동 2건 심고 → `.sr-only li` 개수 == 활동일 수 |
| `"격자가 aria-hidden이고 그 안에 포커스 가능한 요소가 없다"` | `[aria-hidden="true"] a, ... button, ... input` 길이 0. **회귀선** |
| `"sr-only 요약이 총 건수와 활동일 수를 말한다"` | `"총 3건"`, `"활동한 날 2일"` 포함 |

## G4 — `StageDurations`에 단계 링크

### 위치

`components/StageDurations.tsx:7-12`(타입), `:53-55`(제목 렌더).

```tsx
type StageInfo = {
  order: number;
  slug: string;
  title: string;
  /** 더 이상 쓰지 않음 — 호출부 호환용 */
};
```

주석이 "더 이상 쓰지 않음"이라 적혀 있지만 `slug`는 `:25`의 `getStageDurations(stages)`와
`:43`의 `durations[stage.slug]`에서 실제로 쓰인다. **주석이 가리키는 대상이 불명확하다.**

### 변경 후 코드

```tsx
type StageInfo = {
  order: number;
  slug: string;
  title: string;
};
```

`:53-55` 교체 (파일 상단에 `import Link from "next/link";` 추가):

```tsx
                {/* "3단계가 12일 걸렸네"를 본 다음 갈 곳이 있어야 한다 (G4).
                    이 페이지의 나가는 링크는 /guide/print 하나뿐이었다.
                    행 전체가 아니라 제목만 링크로 둔다 — 오른쪽 열(날짜·일수)까지
                    링크가 되면 "12일"을 읽으려다 이동한다. */}
                <Link
                  href={`/guide/${stage.slug}`}
                  className="-my-1 inline-block py-1 text-[15px] font-semibold text-ink transition hover:text-accent"
                >
                  {stage.title}
                </Link>
```

### 함정

- **`<li>`가 `grid`다**(`:48`, `items-baseline`). `<span>`을 `<a>`로 바꿔도 그리드 아이템 그대로다.
  `-my-1 py-1 inline-block`으로 터치 타겟만 살짝 넓히고 행 높이는 유지한다.
  **`items-baseline` + `inline-block` 조합은 실브라우저 확인 항목이다.**
- 44px 완전 충족(`-my-3.5 py-3.5`)은 그리드 행 높이를 바꾼다 — **구현 시 판단 필요.**

## `/activity` 페이지 — G5 표시 배선

### 위치

`app/activity/page.tsx:14-57`. 설명 문단이 `:23-27`, `<ActivityHeatmap />`가 `:29`.

### 변경 후 코드 — 새 컴포넌트 `components/LastActivityNote.tsx`

```tsx
"use client";

import Link from "next/link";
import { getLastActivity, toLocalDateKey } from "@/lib/activity";
import { useSeededState } from "@/lib/useSeededState";

type StageInfo = { slug: string; order: number; title: string };

export function LastActivityNote({ stages }: { stages: StageInfo[] }) {
  const slugs = stages.map((s) => s.slug);
  const [last] = useSeededState(() => getLastActivity(slugs));

  // null이 두 가지를 뜻한다: 시드 전이거나, 기록이 0건이거나.
  // 둘 다 "안 그린다"가 정답이라 구분할 필요가 없다.
  // 빈 상태 안내는 ActivityHeatmap(G3)이 맡는다.
  if (last === null) return null;

  const [, m, d] = toLocalDateKey(new Date(last.occurredAt)).split("-");
  const stage = stages.find((s) => s.slug === last.stageSlug);

  const when =
    last.daysAgo === 0 ? "오늘" : last.daysAgo === 1 ? "어제" : `${last.daysAgo}일 전`;

  return (
    // 겁주지 않는다 — guide/page.tsx의 "건너뛰거나 보류해도 괜찮습니다" 기조.
    // 숫자만 담백하게 적고 판단은 학생에게 맡긴다.
    // text-danger 금지, 경고 아이콘 금지, daysAgo에 따른 조건부 문구 금지.
    <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
      마지막 기록: {Number(m)}월 {Number(d)}일 ({when})
      {stage && (
        <>
          {" · 마지막으로 손댄 단계: "}
          <Link
            href={`/guide/${stage.slug}`}
            className="font-medium text-ink hover:text-accent"
          >
            {stage.order}단계 {stage.title}
          </Link>
        </>
      )}
      <span className="mt-1 block">
        오래 쉬었어도 괜찮습니다. 이어서 하면 됩니다.
      </span>
    </p>
  );
}
```

**`app/activity/page.tsx`** — `:27` 뒤(설명 문단 아래), `<ActivityHeatmap />` 앞에 삽입:

```tsx
      <LastActivityNote
        stages={stages.map((s) => ({
          slug: s.slug,
          order: s.order,
          title: s.title,
        }))}
      />

      <ActivityHeatmap />
```

### 함정

- **"오래 쉬었어도 괜찮습니다"를 `daysAgo`로 조건부 표시하지 마라.**
  30일 넘으면 나타나는 위로 문장은 "너는 늦었다"는 신호다. 항상 같은 문장을 둔다.
  이게 백로그가 말한 "겁주는 톤 금지"의 구현이다.
- 색으로 경고하지 않는다 — `text-danger` 금지. `bg-surface` 중립 상자다.

### 테스트 — `components/__tests__/LastActivityNote.test.tsx` (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"기록이 없으면 아무것도 그리지 않는다"` | `container.textContent === ""` |
| `"마지막 기록일과 경과일을 담백하게 적는다"` | 3일 전 기록 → `"3일 전"` 포함 |
| `"오늘·어제는 숫자가 아니라 말로 적는다"` | 각각 `"오늘"`, `"어제"` |
| `"마지막으로 손댄 단계를 /guide/{slug}로 링크한다"` | `refId: "methodology:2"` → `getByRole("link", { name: /3단계/ }).href`가 `/guide/methodology` |
| `"모르는 slug면 단계 링크를 그리지 않는다"` | `refId: "nope:1"` → `queryByRole("link")`가 null, 날짜 줄은 남음 |
| `"오래 쉬어도 톤이 바뀌지 않는다 (회귀선)"` | 3일 전과 90일 전 두 경우 모두 `"오래 쉬었어도 괜찮습니다"`가 나오고, `"늦"`·`"위험"`·`"경고"` 같은 단어가 없다. **겁주는 톤 금지의 잠금** |

---

## W1. 연구 과정 기록 인쇄 출력 `M` — 이번 라운드의 중심

### 판단 근거 (라운드 6 판정 재확인)

> "ChatGPT로 하룻밤에 만든 보고서에는 과정 기록이 없다."

이 항목은 새 기능이 아니라 **이미 있는 데이터에 이름을 붙이는 일**이다.
따라서 설계의 대부분이 "실제로 어떤 데이터가 있는가"의 실사다.

### 데이터 실사 — 무엇을 인쇄할 수 있는가

`localStorage`에 실제로 있는 것을 전부 열거한다.

| 키 | 내용 | 시각 있나 | 인쇄 가능? |
| --- | --- | --- | --- |
| `research-guide:activity-log` | `{type, refId, occurredAt}[]`, 최대 2000건 | **있다** (ISO) | **핵심 재료** |
| `research-guide:checklist:{slug}` | `{v:2, done: string[]}` | **없다** | 완료 여부만 |
| `research-guide:ethics:{slug}` | 위와 같음 | **없다** | 완료 여부만 |
| `research-guide:reflection:{slug}` | 자가검증 답 **문자열 하나** | 없다 | 전문 인쇄 가능 |
| `research-guide:deadlines` | `{id,name,date}[]` | 마감일만 | 부수 — 인쇄 안 함 |
| 그 외 도구 상태 (`variable-table`, `sample-size` 등) | `usePersistentState` | 없다 | 인쇄 안 함 |

**결론 넷:**

1. **"체크리스트 완료 시점"은 직접 저장돼 있지 않다.** (정정 7)
   유일한 시각 출처는 `activity-log`의 `STAGE_ITEM_DONE`이고 `refId`는 `"{slug}:{index}"`다.
   `index`는 **MDX 체크리스트 배열의 순서**라, MDX 항목을 하나 끼워 넣으면 과거 기록이
   엉뚱한 항목을 가리킨다. `lib/checklist.ts`는 **문구를 id로 쓰는 v2**로 이 문제를 이미
   해결했는데 활동 로그만 index에 남아 있다. 게다가 로그는 **체크 해제를 기록하지 않는다**
   (`ChecklistCard.tsx:28-30`, `if (!wasChecked)`).
   → **항목별 완료 시점은 인쇄하지 않는다.** 대신 **단계별 최초·최종 활동일**을 쓴다
   (`getStageDurations`가 이미 준다). 이건 index에 의존하지 않는다.
   → 백로그 W1의 "체크리스트 완료 시점을 한 장으로"는 **현재 데이터로 정확히는 불가능하다.**
2. **`STAGE_COMPLETE`와 `NOTE`는 한 번도 기록되지 않는다.** 설계에서 제외한다.
3. **자가검증 응답은 단계당 텍스트 하나**다. 질문별 응답이 아니다(`ReflectionBox`가 textarea 하나).
   → 전문을 찍을 수 있다. 단, **질문과 답이 1:1이 아니라는 걸 종이에 표시해야** 한다.
4. **"도구 사용 흔적"은 기록되지 않는다.** 도구는 `usePersistentState`로 결과만 남기고
   `logActivity`를 부르지 않는다. → **인쇄하지 않는다.**
   (백로그가 물은 "도구 사용 흔적"의 답: **데이터가 없다.** 만들려면 도구마다 `logActivity`를
   추가해야 하고, 그건 W1이 아니라 별건이다.)

### 그래서 무엇을 인쇄하는가 — 확정 목록

A4 1~2매 구성:

| 절 | 내용 | 출처 | 상태 |
| --- | --- | --- | --- |
| 머리 | 문서 제목, 인쇄일, **성격 고지문** | `toLocalDateKey(new Date())` | 확정 |
| 1. 기간 요약 | 첫 기록일 ~ 마지막 기록일, 걸친 기간, 기록이 있는 날, 총 건수 | `getActivitySpan` | 확정 |
| 2. 단계별 진행 | 단계마다 [최초 활동일 · 최종 활동일 · 달력 일수 · 체크리스트 n/N] | `getStageDurations` + `countDone` | 확정 |
| 3. 자가검증 응답 | 단계별 질문 목록 + 학생이 쓴 텍스트 전문 | `reflection:{slug}` | 확정 |
| 4. 활동 분포 | 월별 활동 일수 (히트맵의 텍스트판) | `getMonthlyActiveDays` | 확정 |
| — | 항목별 체크 시점 | — | **제외** (근거 1) |
| — | 도구 사용 이력 | — | **제외** (근거 4) |

### 위조 가능성 — 문구

이 사이트가 가르치는 정직성과 모순되면 안 된다. **과장 금지.** 정확히 무엇인지 쓴다.

문서 머리에 들어갈 확정 문안:

> **이 문서는 증명서가 아닙니다.**
> 여기 적힌 날짜는 이 브라우저에 저장된 기록에서 그대로 옮긴 것입니다. 서버에 보관된
> 사본이 없고, 저장된 값은 이 기기를 쓰는 사람이 직접 고칠 수 있습니다. 따라서 이
> 문서는 "이 학생이 직접 했다"를 **증명하지 못합니다.**
>
> 대신 이 문서가 보여주는 것은 **작업이 여러 날에 걸쳐 흩어져 있었는가**입니다.
> 여러 주에 걸쳐 조금씩 쌓인 기록과 하루에 몰아서 만든 기록은 모양이 다릅니다.
> 대화를 함께 읽을 때 참고 자료로 쓰시고, 이 종이 한 장으로 판단하지 마세요.

**금지 표현** (구현 시 이 단어들이 들어가면 안 된다):
`증명`(단, "증명하지 못합니다"는 허용), `인증`, `검증됨`, `무결성`, `위변조 방지`,
`AI 사용 여부`, `직접 작성 확인`.

### 라우트 판단 — `/activity/record`인가 `/guide/print`인가

**새 라우트 `/activity/record`를 만든다.** 근거:

- `/guide/print`는 **체크리스트 작업지**다. 미완료 항목이 `☐`로 나와 종이에 손으로 체크하라는
  용도다(`PrintableChecklist.tsx:88`). 대상 독자가 **학생 자신**이다.
- W1의 산출물은 **끝난 뒤 남기는 기록**이고 대상 독자가 **교사·심사자**다.
  둘을 한 페이지에 합치면 "지금 할 일"과 "지금까지 한 일"이 섞여 둘 다 흐려진다.
- `/activity` 아래에 두면 URL이 성격을 말한다. `/activity`가 `robots: { index: false }`
  (`app/activity/page.tsx:11`)이므로 하위도 같은 정책을 **명시적으로 반복**한다.

### 변경 후 코드

**새 파일 `app/activity/record/page.tsx`** (서버 컴포넌트)

```tsx
import type { Metadata } from "next";
import { getAllStages } from "@/lib/guide";
import { ProcessRecord } from "@/components/ProcessRecord";

export const metadata: Metadata = {
  title: "연구 과정 기록",
  description: "단계별 활동 기간과 자가검증 응답을 한 장으로 정리한 인쇄용 기록입니다.",
  // 개인 기록 화면 — /activity와 같은 정책. 빼면 빈 페이지가 색인된다.
  robots: { index: false },
};

export default function ActivityRecordPage() {
  const stages = getAllStages();
  return (
    <ProcessRecord
      stages={stages.map((s) => ({
        order: s.order,
        slug: s.slug,
        title: s.title,
        checklist: s.checklist,
        selfCheck: s.selfCheck,
      }))}
    />
  );
}
```

**새 파일 `components/ProcessRecord.tsx`**

```tsx
"use client";

import { useSeededState } from "@/lib/useSeededState";
import {
  getActivitySpan,
  getMonthlyActiveDays,
  getStageDurations,
  toLocalDateKey,
  type ActivitySpan,
} from "@/lib/activity";
import { countDone } from "@/lib/checklist";

type StageForRecord = {
  order: number;
  slug: string;
  title: string;
  checklist: string[];
  selfCheck: string[];
};

type Duration = { firstAt: string | null; lastAt: string | null; days: number | null };

type Loaded = {
  span: ActivitySpan | null;
  durations: Record<string, Duration>;
  doneByStage: Record<string, number>;
  reflectionByStage: Record<string, string>;
  monthly: { month: string; days: number }[];
  printedOn: string;
};

function readReflection(slug: string): string {
  try {
    return window.localStorage.getItem(`research-guide:reflection:${slug}`) ?? "";
  } catch {
    return "";
  }
}

// 2026-06-02 → 2026년 6월 2일
function formatFull(iso: string): string {
  const [y, m, d] = toLocalDateKey(new Date(iso)).split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export function ProcessRecord({ stages }: { stages: StageForRecord[] }) {
  // 인쇄일과 저장값은 서버에서 알 수 없다 — 마운트 뒤에 채운다.
  // countDone·readReflection이 window.localStorage를 부르므로
  // 반드시 이 load 콜백 안에서만 불러야 한다(렌더 본문에서 부르면 SSR이 터진다).
  const [seeded] = useSeededState<Loaded>(() => {
    const doneByStage: Record<string, number> = {};
    const reflectionByStage: Record<string, string> = {};
    for (const s of stages) {
      doneByStage[s.slug] = countDone(s.slug, s.checklist);
      reflectionByStage[s.slug] = readReflection(s.slug);
    }
    return {
      span: getActivitySpan(),
      durations: getStageDurations(stages),
      doneByStage,
      reflectionByStage,
      monthly: getMonthlyActiveDays(),
      printedOn: toLocalDateKey(new Date()),
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 print:max-w-none print:px-0 print:py-0">
      {/* 화면 전용 머리 */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-ink">연구 과정 기록</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
            단계별 활동 기간과 자가검증 응답을 한 장으로 모았습니다. 아래 버튼으로
            인쇄하거나 PDF로 저장하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="shrink-0 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          인쇄하기
        </button>
      </div>

      {/* 인쇄 머리 */}
      <div className="mt-8 hidden print:mt-0 print:block">
        <h1 className="text-xl font-bold">연구 과정 기록</h1>
        {seeded && <p className="mt-1 text-xs">인쇄일: {seeded.printedOn}</p>}
      </div>

      {/* ── 성격 고지 — 화면과 종이 둘 다에 나온다. 이 문단이 이 문서의 전제다.
             과장하면 이 사이트가 가르치는 정직성과 모순된다.
             금지어: 인증 / 검증됨 / 무결성 / 위변조 방지 / AI 사용 여부 /
             직접 작성 확인. 이 문단을 "증명"으로 고치지 말 것. */}
      <section className="mt-6 rounded-lg border border-line bg-surface px-5 py-4 text-[13px] leading-relaxed text-ink-soft print:mt-3 print:rounded-none print:bg-transparent print:px-3 print:py-2 print:text-[11px]">
        <p className="font-semibold text-ink">이 문서는 증명서가 아닙니다.</p>
        <p className="mt-1.5">
          여기 적힌 날짜는 이 브라우저에 저장된 기록에서 그대로 옮긴 것입니다.
          서버에 보관된 사본이 없고, 저장된 값은 이 기기를 쓰는 사람이 직접 고칠
          수 있습니다. 저장 한도(2,000건)를 넘으면 오래된 기록부터 지워집니다.
          따라서 이 문서는 &ldquo;이 학생이 직접 했다&rdquo;를 증명하지 못합니다.
        </p>
        <p className="mt-1.5">
          대신 이 문서가 보여주는 것은{" "}
          <strong className="font-semibold text-ink">
            작업이 여러 날에 걸쳐 흩어져 있었는가
          </strong>
          입니다. 여러 주에 걸쳐 조금씩 쌓인 기록과 하루에 몰아서 만든 기록은
          모양이 다릅니다. 대화를 함께 읽을 때 참고 자료로 쓰시고, 이 종이 한
          장으로 판단하지 마세요.
        </p>
      </section>

      {/* 시드 전에는 아래를 그리지 않는다 — 서버와 첫 렌더가 같아야 한다 */}
      {seeded === null ? null : seeded.span === null ? (
        <p className="mt-8 text-[15px] leading-[1.7] text-ink-soft">
          아직 기록이 없습니다. 가이드에서 체크리스트를 체크하거나 자가검증
          질문에 답을 적으면 그날 날짜로 쌓입니다. 기록이 하나라도 생긴 뒤에
          다시 오세요.
        </p>
      ) : (
        <>
          {/* 1. 기간 요약 */}
          <section className="mt-8 break-inside-avoid print:mt-4">
            <h2 className="text-lg font-bold text-ink print:text-base">1. 기간 요약</h2>
            <dl className="mt-2 grid grid-cols-[8rem_minmax(0,1fr)] gap-y-1.5 text-sm print:text-xs">
              <dt className="text-ink-soft">첫 기록</dt>
              <dd className="text-ink">{formatFull(seeded.span.firstAt)}</dd>
              <dt className="text-ink-soft">마지막 기록</dt>
              <dd className="text-ink">{formatFull(seeded.span.lastAt)}</dd>
              <dt className="text-ink-soft">걸친 기간</dt>
              <dd className="text-ink">{seeded.span.spanDays}일</dd>
              <dt className="text-ink-soft">기록이 있는 날</dt>
              <dd className="text-ink">{seeded.span.activeDays}일</dd>
              <dt className="text-ink-soft">총 기록 건수</dt>
              <dd className="text-ink">{seeded.span.totalEntries}건</dd>
            </dl>
          </section>

          {/* 2. 단계별 진행 */}
          <section className="mt-8 break-inside-avoid print:mt-4">
            <h2 className="text-lg font-bold text-ink print:text-base">2. 단계별 진행</h2>
            <table className="mt-2 w-full text-sm print:text-xs">
              <thead>
                <tr className="border-b border-line text-left text-ink">
                  <th className="py-1.5 pr-3 font-semibold">단계</th>
                  <th className="py-1.5 pr-3 font-semibold">첫 활동</th>
                  <th className="py-1.5 pr-3 font-semibold">마지막 활동</th>
                  <th className="py-1.5 pr-3 font-semibold">일수</th>
                  <th className="py-1.5 font-semibold">체크리스트</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => {
                  const d = seeded.durations[s.slug];
                  const done = seeded.doneByStage[s.slug] ?? 0;
                  return (
                    <tr key={s.slug} className="border-b border-line">
                      <td className="py-1.5 pr-3 text-ink">
                        {s.order}. {s.title}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-soft">
                        {d?.firstAt ? formatFull(d.firstAt) : "—"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-soft">
                        {d?.lastAt ? formatFull(d.lastAt) : "—"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-soft">
                        {d?.days != null ? `${d.days}일` : "—"}
                      </td>
                      <td className="py-1.5 text-ink-soft">
                        {done} / {s.checklist.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* 정정 7의 정직성 표시 — 없는 데이터를 있는 척하지 않는다 */}
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              체크리스트는 완료 여부만 저장되고 각 항목을 언제 체크했는지는
              저장되지 않습니다. 위의 첫 활동·마지막 활동은 그 단계에서 무언가를
              기록한 날짜입니다.
            </p>
          </section>

          {/* 3. 자가검증 응답 */}
          <section className="mt-8 print:mt-4">
            <h2 className="text-lg font-bold text-ink print:text-base">3. 자가검증 응답</h2>
            <p className="mt-1 text-[11px] text-ink-soft">
              단계마다 답을 한 칸에 적는 형식이라, 아래 글은 그 단계의 질문
              전체에 대한 답입니다. 질문 하나에 답 하나가 대응하지 않습니다.
            </p>
            <div className="mt-3 space-y-4 print:space-y-3">
              {stages.map((s) => {
                const text = (seeded.reflectionByStage[s.slug] ?? "").trim();
                if (!text) return null;
                return (
                  <div key={s.slug} className="break-inside-avoid">
                    <h3 className="text-[15px] font-semibold text-ink print:text-sm">
                      {s.order}. {s.title}
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-ink-soft">
                      {s.selfCheck.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                    <p className="mt-1.5 border-l-2 border-line pl-3 text-sm leading-relaxed whitespace-pre-wrap text-ink print:text-xs">
                      {text}
                    </p>
                  </div>
                );
              })}
              {stages.every((s) => !(seeded.reflectionByStage[s.slug] ?? "").trim()) && (
                <p className="text-sm text-ink-soft">
                  적어 둔 자가검증 응답이 없습니다.
                </p>
              )}
            </div>
          </section>

          {/* 4. 활동 분포 */}
          <section className="mt-8 break-inside-avoid print:mt-4">
            <h2 className="text-lg font-bold text-ink print:text-base">
              4. 월별 활동 일수
            </h2>
            <ul className="mt-2 space-y-1 text-sm print:text-xs">
              {seeded.monthly.map(({ month, days }) => {
                const [y, m] = month.split("-");
                return (
                  <li key={month} className="flex items-baseline gap-3">
                    <span className="w-24 shrink-0 text-ink-soft">
                      {y}년 {Number(m)}월
                    </span>
                    {/* 종이에서도 보이도록 CSS 막대가 아니라 글자를 쓴다.
                        상한 31은 손상된 저장값 방어(한 달 최대 31일). */}
                    <span aria-hidden className="font-label text-ink">
                      {"■".repeat(Math.min(days, 31))}
                    </span>
                    <span className="text-ink-soft">{days}일</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

**`app/activity/page.tsx`의 아카이브 섹션(`:39-55`)** — 링크 두 개로:

```tsx
      <section className="mt-10 grid items-center gap-4 border-t border-ink border-b border-b-line py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">인쇄해서 남기기</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            <strong className="font-medium text-ink">진행 노트</strong>는 아직 할
            일을 종이에 체크하려고,{" "}
            <strong className="font-medium text-ink">과정 기록</strong>은 지금까지의
            날짜와 자가검증 응답을 한 장으로 정리하려고 씁니다.
          </p>
        </div>
        <div className="flex w-fit shrink-0 gap-2">
          <Link
            href="/guide/print"
            className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink transition hover:border-accent"
          >
            진행 노트
          </Link>
          <Link
            href="/activity/record"
            className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-bg transition hover:opacity-85"
          >
            과정 기록
          </Link>
        </div>
      </section>
```

### 인쇄 스타일 · 페이지 나눔

`ProcessRecord`는 `.prose`가 아니므로 A6의 `.prose table { break-inside: avoid }`가 안 걸린다.
그래서 **Tailwind `break-inside-avoid` 유틸리티를 각 `<section>`과 자가검증 항목에 직접 붙였다**(위 코드).
A6 블록의 `@page { margin: 15mm }`와 전역 `h2, h3 { break-after: avoid }`가 나머지를 맡는다.
**→ A6이 W1보다 먼저 들어가야 하는 이유다.**

### 데이터 없을 때 — 세 층

1. **시드 전** (`seeded === null`) → 고지 문단까지만 그리고 본문은 안 그림. SSR과 일치.
2. **기록 0건** (`seeded.span === null`) → "아직 기록이 없습니다" 한 문단 + 어디서 생기는지 안내.
   인쇄 버튼은 그대로 둔다 — **구현 시 판단 필요**(0건일 때 `disabled`로 할지).
3. **부분 기록** → 표에 `—`, 자가검증 절은 빈 단계를 건너뜀. 전부 비면 안내 한 줄.

### 함정

- **`getStageDurations(stages)`가 받는 타입은 `{slug: string}[]`이다**(`lib/activity.ts:82`).
  `StageForRecord[]`를 그대로 넘겨도 구조적 타이핑으로 통과한다.
- **`countDone`은 `window.localStorage`를 부른다.** `useSeededState`의 `load` 안에서만
  불러야 한다. 렌더 본문에서 부르면 SSR에서 `window is not defined`로 터진다.
- **활동 로그는 `MAX_ENTRIES = 2000`에서 잘린다**(`lib/activity.ts:2,32-33`).
  넘기면 오래된 것부터 사라져 `firstAt`이 실제보다 늦어진다. **고지문에 이미 넣었다**(정직성).
- 성격 고지문에 **금지어 목록을 코드 주석으로 박아 뒀다.** 나중에 누가 "인증"으로 고치는 걸 막는다.
- `robots: { index: false }`를 빠뜨리면 학생 기록 페이지 URL이 색인된다.
  개인 데이터는 로컬이라 유출은 없지만, **빈 페이지가 색인되면 애드센스 "가치 없는 콘텐츠"에 걸린다.**

### 테스트

**`lib/__tests__/activity-span.test.ts`** (신규, jsdom — localStorage 필요)

| `it()` 제목 | 검증 |
| --- | --- |
| `"기록이 없으면 getActivitySpan이 null"` | `localStorage.clear()` 후 null |
| `"첫·마지막 기록일과 걸친 일수를 센다"` | 6/1·6/12 두 건 → `spanDays === 12`, `activeDays === 2`, `totalEntries === 2` |
| `"같은 날 여러 건이면 activeDays는 1이다"` | 같은 날 3건 → `activeDays === 1`, `totalEntries === 3` |
| `"손상된 항목은 집계에서 빠진다"` | `[{bad:1}, 정상1건]` → `totalEntries === 1` |
| `"getLastActivity가 가장 최근 항목을 고른다"` | 순서가 뒤섞인 3건 → 가장 늦은 것 |
| `"getLastActivity의 daysAgo는 달력 일수다"` | 어제 23:50 기록 + 오늘 00:10 조회 → `daysAgo === 1` (시간 차는 20분) |
| `"모르는 slug면 stageSlug가 null"` | `refId: "nope:1"` + `["topic"]` → null |
| `"knownStageSlugs를 안 넘기면 stageSlug가 항상 null (경계)"` | 기본 인자 동작 문서화 |
| `"getMonthlyActiveDays가 오래된 달부터 준다"` | 7월·6월 순으로 저장 → 결과가 6월, 7월 |

**`components/__tests__/ProcessRecord.test.tsx`** (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"기록이 없으면 '아직 기록이 없습니다'를 보여준다"` | `findByText(/아직 기록이 없습니다/)` |
| `"성격 고지문은 기록 유무와 무관하게 항상 나온다"` | 0건·N건 두 경우 모두 `getByText("이 문서는 증명서가 아닙니다.")` |
| `"고지문이 '증명'을 약속하지 않는다 (회귀선)"` | `document.body.textContent`에 `"증명하지 못합니다"`가 있고, `"인증"`·`"검증됨"`·`"무결성"`·`"위변조"`가 **없다**. **이 사이트가 가르치는 정직성과 문서가 모순되지 않게 잠근다** |
| `"단계별 표에 첫·마지막 활동일과 체크리스트 개수가 나온다"` | 활동 로그와 체크리스트를 심고 `"2 / 5"` 같은 셀 검증 |
| `"기록이 없는 단계는 표에 —로 나온다"` | `getAllByText("—").length >= 3` |
| `"자가검증 응답 전문이 줄바꿈까지 그대로 나온다"` | `reflection:topic`에 `"가\n나"` 저장 → 그대로 렌더 |
| `"자가검증이 하나도 없으면 안내 문장을 보여준다"` | `getByText("적어 둔 자가검증 응답이 없습니다.")` |
| `"체크 시점이 저장되지 않는다는 사실을 표 아래에 밝힌다"` | 해당 문장 존재. **정정 7의 정직성 잠금** |
| `"저장 한도 초과 시 오래된 기록이 지워진다는 사실을 밝힌다"` | 고지문에 `"2,000건"` 포함 |
| `"인쇄 버튼이 window.print를 부른다"` | `window.print` 스텁 |

**`app/__tests__/activity-record-route.test.ts`** (신규, node)

| `it()` 제목 | 검증 |
| --- | --- |
| `"/activity/record가 색인을 막는다"` | `metadata.robots.index === false` |
| `"sitemap이 /activity/record를 넣지 않는다"` | `app/sitemap.ts` 결과에 없음 |

### 커밋 분할 (묶음 4)

| # | 커밋 | 내용 |
| --- | --- | --- |
| 6 | `feat: lib/activity에 기간·최근활동 조회 (G5 선행)` | `getLastActivity` `getActivitySpan` `getMonthlyActiveDays` + `activity-span.test.ts`. **컴포넌트 변경 없음** |
| 7 | `fix: /activity 빈 상태와 히트맵 낭독기 요약 (G3·L4)` | `ActivityHeatmap.tsx` 전면 + 테스트 |
| 8 | `feat: /activity에서 단계로 돌아가는 길 (G4·G5)` | `StageDurations` 링크 + `LastActivityNote.tsx` + `activity/page.tsx`. **6 이후** |
| 9 | `feat: 연구 과정 기록 인쇄 출력 (W1)` | `app/activity/record/page.tsx` + `ProcessRecord.tsx` + 아카이브 섹션 개편 + 테스트 3종. **5, 6 이후** |

---

# 묶음 4.5 — 접근성 배선

## L5. `aria-hidden` 안의 탭 가능한 링크 `S`

### 위치

`components/ProgressOverview.tsx:56-60`

```tsx
    <section
      className="card px-5 py-4.5 sm:px-6"
      aria-hidden={!hydrated || undefined}
    >
```

그 안 **:70-75**(백로그 `:68`은 정정 4) — `<Link href="/guide/print">`.
`:76-90`의 "이어서 하기" `<Link>`는 `hydrated`일 때만 렌더되므로 `aria-hidden`이 걸린 상태에는 없다.
**즉 위반 대상은 "인쇄용으로 보기" 링크 하나다.**

의도(`:54-55` 주석)는 "같은 높이의 빈 셸을 그려 레이아웃 이동을 막는다"이고,
그건 **링크를 숨길 필요가 없다.** 숨겨야 할 건 아직 값을 모르는 진행도 텍스트와 게이지다.

### 판단 — `visibility: hidden` vs `inert` vs 범위 축소

**범위 축소가 맞다.** `aria-hidden`을 section에서 떼고, 실제로 모르는 값만 감춘다.

- `inert`는 React 19에서 지원되지만 **링크를 못 누르게 만든다.**
  "인쇄용으로 보기"는 hydration 전에도 유효한 링크다 — 못 누르게 할 이유가 없다.
- `visibility: hidden`을 section에 걸면 카드 전체가 사라져 레이아웃 목적을 잃는다.
- 지금 `hydrated` 분기(`:65`, `:76-90`, `:97`)가 이미 "모르는 값"을 각각 처리하고 있다.
  `aria-hidden`은 **중복 방어**였고, 그 중복이 위반을 만들었다.

### 변경 후 코드

`:56-60`:

```tsx
    // 서버 렌더/첫 페인트에는 저장된 값을 알 수 없으므로 같은 높이의 빈 셸을 그린다
    // (null을 돌려주면 hydration 뒤 카드가 끼어들며 아래 내용이 밀린다).
    //
    // section 전체에 aria-hidden을 걸면 안 된다 — 안에 포커스 가능한 링크가
    // 있어서 키보드 사용자가 "보조기술에 없는" 영역으로 탭 이동한다
    // (axe aria-hidden-focus). 모르는 값은 아래에서 개별로 감춘다.
    <section className="card px-5 py-4.5 sm:px-6">
```

`:64-67` 진행도 문장 — 시드 전에는 낭독기가 "이 기기 기준"만 읽는다. 라이브 영역으로:

```tsx
          <p className="mt-1 text-xs text-ink-soft" aria-live="polite">
            {hydrated ? `${doneItems} / ${totalItems} 항목 완료 · ` : ""}이 기기
            기준
          </p>
```

`:94-99` 게이지 — 값이 없는 막대는 낭독기에 의미가 없고, 바로 위 문단이 같은 숫자를 이미 말한다:

```tsx
      <div
        aria-hidden
        className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${hydrated ? percent : 0}%` }}
        />
      </div>
```

`:86-89`의 자리 잡기용 `<span className="invisible ...">`는 **그대로 둔다** —
`invisible`(`visibility: hidden`)은 접근성 트리에서도 빠지고 포커스도 못 받으므로 정상이다.

### 함정

- `aria-live="polite"`를 진행도 문단에 걸면 hydration 시 한 번 읽힌다. 이건 의도다
  (`ChecklistCard.tsx:43-49`가 같은 패턴을 이미 쓴다).
- **`suppressHydrationWarning`은 필요 없다.** `hydrated ? ... : ""`가 서버/클라이언트 첫 렌더에서
  모두 `""`이다(`hydrated`는 첫 렌더에 false). 붙이지 마라.
- 게이지를 `role="progressbar"`로 올리지 마라 — 위 문단과 중복이다.

### 테스트 — `components/__tests__/ProgressOverview.test.tsx` (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"aria-hidden 영역 안에 포커스 가능한 요소가 없다 (axe aria-hidden-focus)"` | `document.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] input').length === 0`. **범용 회귀선 — 다른 컴포넌트 테스트에도 복제할 수 있다** |
| `"인쇄용으로 보기 링크는 시드 전에도 접근 가능하다"` | 첫 렌더에서 `getByRole("link", { name: "인쇄용으로 보기" })`가 존재 |
| `"진행도가 aria-live 영역에서 갱신된다"` | 체크 심고 렌더 → `findByText(/1 \/ 2 항목 완료/)`가 `[aria-live]` 안 |
| `"시드 전에는 진행도 숫자를 말하지 않는다"` | 첫 동기 렌더의 텍스트가 `"항목 완료"`를 포함하지 않음 |

---

## M1. 결과를 뽑는 도구 둘이 낭독기에 말이 없다 `S`

### 위치

**(a) `components/TopicIdeaGenerator.tsx:66`** — 백로그 정확. `{ideas.length > 0 && (` + `<ul>`.
`:89-91`의 `aria-live`는 `copyFailed` 전용이며 **조건부 밖에 있다**(좋음).

**(b) `components/PresentationQuestionBank.tsx:72`** — 백로그 `:71`은 정정 5.
`{drawn.length > 0 && (` + `<>` + `<ul>` + 복사 버튼 + `<p aria-live>`(`:91-93`).
**여기서는 `copyFailed`용 `aria-live`가 조건부 안에 있다.**

**참조 패턴**: `RandomSampler.tsx:101` — `<div aria-live="polite" className="mt-4 ...">`

### 판단 — `<ul>`을 감쌀 것인가, 별도 `sr-only` 알림인가

**`<ul>`을 라이브 영역으로 감싼다.** 근거:

- 목록 전체를 읽히는 게 이 도구의 목적이다("아이디어 뽑기" → 아이디어 N개).
- 별도 `sr-only`("아이디어 3개를 뽑았습니다")는 **한 번 더 탐색해야** 내용에 닿는다.
- **단, 영역이 항상 DOM에 있어야 한다.** `{ideas.length > 0 && <div aria-live>...}`는
  라이브 영역 자체가 나중에 삽입되는 형태라 브라우저가 변경을 놓칠 수 있다.
  `RandomSampler.tsx:100`이 이 함정을 갖고 있다 — 여기서는 고쳐 쓴다.

### 변경 후 코드

**`TopicIdeaGenerator.tsx:66-88`** (조건부를 안쪽으로 옮긴다):

```tsx
      {/* 라이브 영역은 항상 DOM에 두고 안쪽만 바뀌게 한다 — 영역 자체가
          나중에 삽입되면 브라우저가 변경을 못 잡는 경우가 있다.
          (RandomSampler.tsx:100은 조건부 안에 있어 같은 위험이 남아 있다) */}
      <div aria-live="polite">
        {ideas.length > 0 && (
          <ul className="mt-4 space-y-2">
            {ideas.map((idea, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-ink"
              >
                <span>{idea}</span>
                <button
                  type="button"
                  onClick={() => copy(idea, i)}
                  className="relative shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition before:absolute before:-inset-2.5 before:content-[''] hover:border-accent"
                >
                  {copiedIndex === i ? "복사됨" : "복사"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
```

**`PresentationQuestionBank.tsx:72-95`** — `<>` 프래그먼트를 `<div aria-live="polite">`로 바꾸고,
**`copyFailed`용 `<p aria-live>`는 조건부 밖으로 뺀다**(라이브 영역 중첩 금지):

```tsx
      <div aria-live="polite">
        {drawn.length > 0 && (
          <>
            <ul className="mt-4 space-y-2">
              {drawn.map((q, i) => (
                <li key={i} className="rounded-lg bg-surface px-4 py-2.5 text-sm text-ink">
                  {q}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={copyDrawn}
              className="mt-3 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent"
            >
              {copied ? "복사됨" : "질문 복사"}
            </button>
          </>
        )}
      </div>
      {/* 복사 실패 알림 — 새 라이브 영역 밖으로 뺐다. 중첩되면 안쪽 변경이
          두 번 읽히거나 아예 안 읽힌다. TopicIdeaGenerator:89는 이미 밖에 있다. */}
      <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
      </p>
```

### 함정

- **라이브 영역 중첩 금지.** 위 참조. `PresentationQuestionBank`가 실제로 그 위험을 갖고 있었다.
- 복사 버튼이 라이브 영역 **안**에 있으면 버튼 글자가 "복사"→"복사됨"으로 바뀔 때
  목록 전체가 다시 읽힐 수 있다(`TopicIdeaGenerator`의 `copiedIndex`).
  - `aria-atomic`을 쓰지 않으면 대부분의 브라우저가 바뀐 노드만 읽는다 — 실제로는 "복사됨"만 읽힌다.
  - **구현 시 판단 필요**: 문제가 되면 복사 상태를 별도 `sr-only` 영역으로 옮긴다.
- **`LiveRegions.test.tsx`가 이미 있다**(`components/__tests__/LiveRegions.test.tsx`, `:17-19`의
  `liveRegions()` 헬퍼가 `[aria-live="polite"]`를 전부 모은다).
  **새 파일을 만들지 말고 그 파일에 추가한다.**

### 테스트 — `components/__tests__/LiveRegions.test.tsx`에 추가

기존 파일 `:8-10`의 import에 두 컴포넌트 추가.

| `it()` 제목 | 검증 |
| --- | --- |
| `"TopicIdeaGenerator: 뽑은 아이디어가 aria-live 영역 안에 나타난다"` | "아이디어 뽑기" 클릭 → `liveRegions()` 중 `querySelector("ul")`이 있는 것이 존재하고 `<li>` 개수 > 0 |
| `"TopicIdeaGenerator: 뽑기 전에도 aria-live 영역이 존재한다 (경계)"` | 렌더 직후 `liveRegions().length >= 2` (결과 영역 + 복사실패 영역) |
| `"PresentationQuestionBank: 뽑은 질문이 aria-live 영역 안에 나타난다"` | "질문 3개 뽑기" 클릭 → 라이브 영역 안 `<li>` 3개 |
| `"라이브 영역이 중첩되지 않는다"` | `document.querySelectorAll('[aria-live] [aria-live]').length === 0`. **회귀선** |

---

## M2. `aria-describedby` · `aria-invalid` 배선 `S`

### 실측

저장소 전체에서 `aria-describedby` **0회**, `aria-invalid` **0회**, `useId` **0회**.
백로그 판정 정확.

### 대상 4개와 각각의 현재 오류 표시

| 컴포넌트 | 오류 마크업 | 연결할 입력 |
| --- | --- | --- |
| `DeadlineTracker` | `:149-153` `<p role="alert" className="mt-2 text-xs text-danger">` | `#deadline-name`(`:110`), `#deadline-date`(`:131`) |
| `StatsCalculator` | `:314` `{error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}` (라이브 영역 `:307` 안) | `#stats-values-a`(`:265`), `#stats-values-b`(`:282`) |
| `PriorResearchSearch` | `:155-158` `<p className="mt-4 text-sm text-ink-soft" role="alert">` | 검색 입력(`:108`, **id 없음**, `aria-label`만) |
| `SampleSizeCalculator` | `:141-169` 라이브 영역. 오류 문구는 `:142-145`(모집단)와 `:167`(오차·비율) | `#sample-size-population`(`:129`), `#sample-size-margin`(`:95`), `#sample-size-proportion`(`:112`) |

### 판단 — `useId()`를 쓸 것인가

**쓰지 않는다.** 근거 셋:

1. **네 컴포넌트 전부 이미 하드코딩 id를 쓴다** — `deadline-name`, `stats-values-a`,
   `sample-size-margin` 등. `htmlFor`가 그 id를 가리킨다. `useId()`를 섞으면
   한 컴포넌트 안에 두 가지 id 규약이 생긴다.
2. **이 도구들은 한 페이지에 두 번 나오지 않는다.** `StageTools.tsx`가 단계별로
   `STAGE_TOOL_TITLES`를 순회하며 각 도구를 **한 번씩** 렌더한다. `"내 레퍼런스 목록"`이
   2·5단계에 있지만 서로 다른 페이지다. → **id 충돌이 구조적으로 불가능하다.**
3. **"React 19에서 서버/클라이언트 id 일치 문제가 있나"의 답: 없다.**
   `useId()`는 React 18부터 SSR-안전하게 설계됐고(트리 위치 기반) React 19에서도
   서버와 클라이언트가 같은 값을 낸다. 게다가 이 도구들은 전부 `"use client"`이고
   `usePersistentState`/`useSeededState`로 "서버 렌더 = 기본값" 규약을 이미 지킨다.
   **문제가 없지만, 쓸 이유도 없다.**

**따라서 하드코딩 id로 간다.** 새 id는 기존 규약(`{tool}-{field}-error`)을 따른다.

### 변경 후 코드

**(1) `DeadlineTracker.tsx`** — `:149-153`:

```tsx
      {error && (
        <p id="deadline-error" role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
```

`:109-121`(이름)과 `:130-139`(날짜) 각각에:

```tsx
            /* 오류가 뜬 상태로 칸에 돌아왔을 때 무엇이 잘못됐는지 다시 읽히게
               한다. role="alert"는 뜨는 순간 한 번만 읽고 끝이라 부족하다.
               오류가 없을 때는 속성 자체를 붙이지 않는다 — aria-invalid="false"를
               실제로 렌더하면 일부 낭독기가 매 포커스마다 "유효함"을 말한다. */
            aria-describedby={error ? "deadline-error" : undefined}
            aria-invalid={error ? true : undefined}
```

**(2) `StatsCalculator.tsx`** — `:314`:

```tsx
        {error && (
          <p id="stats-error" className="mt-3 text-sm text-ink-soft">
            {error}
          </p>
        )}
```

`:264-276`, `:281-293`의 두 `<textarea>`에:

```tsx
            aria-describedby={error ? "stats-error" : undefined}
            aria-invalid={error ? true : undefined}
```

**(3) `PriorResearchSearch.tsx`** — `:155-158`:

```tsx
      {status === "error" && (
        <p id="paper-search-error" className="mt-4 text-sm text-ink-soft" role="alert">
          {ERROR_MESSAGES[errorKind]}
        </p>
      )}
```

`:108-116`의 입력에 **id를 새로 준다**(지금 없다):

```tsx
        <input
          id="paper-search-query"
          type="text"
          aria-label="검색 키워드 (영어)"
          aria-describedby={status === "error" ? "paper-search-error" : undefined}
          aria-invalid={status === "error" ? true : undefined}
          required
          maxLength={200}
          ...
        />
```

**(4) `SampleSizeCalculator.tsx`** — 오류가 두 종류라 id도 둘.

`:141-169`의 두 오류 문단에 id 추가:

```tsx
        {populationInvalid ? (
          <p id="sample-size-population-error" className="text-ink-soft">
            모집단 크기를 숫자로 입력해주세요. 모르면 비워두시면 됩니다.
          </p>
        ) : result !== null ? (
          ...
        ) : (
          <p id="sample-size-inputs-error" className="text-ink-soft">
            오차범위와 예상 비율을 확인해주세요.
          </p>
        )}
```

컴포넌트 안 `:51` 근처에 파생값 하나:

```tsx
  // "오차범위와 예상 비율을 확인해주세요"가 뜨는 조건과 정확히 같아야 한다.
  // 어긋나면 aria-describedby가 없는 id를 가리키는 죽은 참조가 된다.
  // L6(오차범위 상한)이 이 조건을 바꾸면 여기도 같이 바꿀 것.
  const inputsInvalid = !populationInvalid && result === null;
```

세 입력에:

```tsx
            id="sample-size-population"
            aria-describedby={populationInvalid ? "sample-size-population-error" : undefined}
            aria-invalid={populationInvalid ? true : undefined}
```
```tsx
            id="sample-size-margin"
            aria-describedby={inputsInvalid ? "sample-size-inputs-error" : undefined}
            aria-invalid={inputsInvalid ? true : undefined}
```
```tsx
            id="sample-size-proportion"
            aria-describedby={inputsInvalid ? "sample-size-inputs-error" : undefined}
            aria-invalid={inputsInvalid ? true : undefined}
```

### 함정

- **`aria-invalid={false}`를 넣지 마라.** React가 `aria-invalid="false"`를 실제로 렌더하고,
  일부 낭독기가 매 포커스마다 "유효함"을 말한다. `undefined`로 속성을 없앤다.
- **`aria-describedby`가 가리키는 id가 DOM에 없으면 조용히 무시된다.** 오류 문단이
  조건부 렌더이므로 조건을 정확히 같게 써야 한다. `inputsInvalid`가 그 이유로 존재한다.
- `StatsCalculator`의 `error`는 라이브 영역(`:307`) 안에 있다. `aria-describedby`로 또 가리키면
  **뜰 때 한 번(라이브), 포커스할 때 한 번(describedby)** 읽힌다. **이건 의도한 동작이다.**
- `PriorResearchSearch`의 입력은 `aria-label`을 갖는다. 라벨은 이름, describedby는 설명이므로 충돌하지 않는다.
- **`L6`(오차범위 상한)이 `SampleSizeCalculator`를 고친다.** `inputsInvalid` 조건이 바뀌면
  여기도 같이 바꿔야 한다. 주석으로 짝을 명시했다.

### 테스트 — `components/__tests__/ErrorWiring.test.tsx` (신규, jsdom)

네 컴포넌트를 한 파일에 모은다(`LiveRegions.test.tsx`와 같은 성격).

| `describe` › `it()` | 검증 |
| --- | --- |
| DeadlineTracker › `"오류가 뜨면 두 입력이 그 문단을 가리킨다"` | 빈 폼 제출 → 이름·날짜 입력의 `aria-describedby === "deadline-error"`, `getElementById("deadline-error")` 존재 |
| DeadlineTracker › `"오류가 없으면 aria-invalid 속성 자체가 없다"` | 첫 렌더에서 `input.hasAttribute("aria-invalid") === false` |
| DeadlineTracker › `"입력을 고치면 연결이 끊긴다"` | 이름 입력 후 `aria-describedby`가 null |
| StatsCalculator › `"계산 오류가 두 textarea에 연결된다"` | 값 1개만 넣고 계산 → 둘 다 `"stats-error"` |
| PriorResearchSearch › `"검색 실패가 입력에 연결된다"` | `fetch` 스텁 500 → 입력의 `aria-describedby === "paper-search-error"` |
| SampleSizeCalculator › `"모집단 오류는 모집단 칸에만 붙는다"` | `population: "abc"` → 모집단 칸만 `aria-invalid`, 오차 칸은 없음 |
| SampleSizeCalculator › `"오차·비율 오류는 그 두 칸에 붙는다"` | `proportion: "0"` → 두 칸이 `"sample-size-inputs-error"` |
| **전 컴포넌트** › `"aria-describedby가 가리키는 id가 실제로 존재한다"` | 각 오류 상태에서 `[aria-describedby]`를 모두 모아 `document.getElementById(id)`가 non-null. **죽은 참조 회귀선 — 이게 이 항목의 핵심 테스트다** |

---

## M3. 아코디언 `aria-expanded` + 검정 추천 라이브 영역 `S`

### 위치

`components/stats/GuideBlock.tsx:29-36` (백로그 정확) — 손수 만든 펼침 버튼.
`:38` `{open && (`가 펼침 영역을 감싼다.
`:97-110` (백로그 `:97-100`은 정정 6) — `{recommended && (` 검정 추천 결과 + "이 방식으로 계산하기" 버튼.

### 변경 후 코드

`:27-36`:

```tsx
    <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        // 저장소에서 유일하게 <details>가 아닌 손수 만든 펼침이라
        // 상태를 aria로 직접 알려야 한다. "접기 ▲/펼치기 ▼" 글자만으로는
        // 낭독기가 이 버튼이 무엇을 여는지, 지금 열려 있는지 알 수 없다.
        //
        // aria-controls를 open일 때만 붙이는 이유: 패널이 조건부 렌더라
        // 닫혀 있을 때는 #stats-guide-panel이 DOM에 없다. ARIA 명세상
        // 허용되지만 axe의 aria-valid-attr-value가 죽은 참조로 잡는다.
        // 닫힌 상태에 필요한 정보는 aria-expanded=false가 다 말한다.
        aria-expanded={open}
        aria-controls={open ? "stats-guide-panel" : undefined}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-ink"
      >
        <span>어떤 분석이 맞을지 모르겠다면?</span>
        {/* aria-expanded가 상태를 말하므로 화살표까지 읽히면 중복이다 */}
        <span aria-hidden className="text-ink-soft">
          {open ? "접기 ▲" : "펼치기 ▼"}
        </span>
      </button>
```

`:38`:

```tsx
      {open && (
        <div id="stats-guide-panel" className="mt-3 space-y-3 text-sm">
```

`:97-110` — 라이브 영역을 조건부 **밖**에 둔다:

```tsx
          {/* 어떤 검정을 쓰라는 것이 이 블록의 핵심 산출물인데 조용히 나타났다.
              영역 자체는 항상 두고 안쪽만 바뀌게 한다 — 라디오를 고른 순간
              추천이 읽혀야 한다. */}
          <div aria-live="polite">
            {recommended && (
              <div className="rounded-lg bg-bg px-3 py-2.5">
                <p className="text-ink-soft">
                  추천 분석:{" "}
                  <span className="font-medium text-ink">{recommendedLabel}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onPick(recommended)}
                  className="mt-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-bg transition hover:opacity-85"
                >
                  이 방식으로 계산하기
                </button>
              </div>
            )}
          </div>
```

### 함정

- **`aria-controls`를 조건부로 붙였다.** 항상 붙이면 닫힌 상태에서 죽은 참조가 된다(위 주석 참조).
- 화살표 글자에 `aria-hidden`을 새로 붙였다.
- `onPick`이 부모(`StatsCalculator`)의 `mode`를 바꾼다. 라이브 영역 안 버튼을 눌러도
  영역이 사라지지 않고 남는다(`recommended`가 계속 참) — 기존 동작 유지.
- `GuideBlock`은 `components/stats/` 아래지만, 저장소에 `components/stats/__tests__`가 없다.
  **테스트는 기존 관례대로 `components/__tests__/`에 둔다.**

### 테스트 — `components/__tests__/GuideBlock.test.tsx` (신규, jsdom)

| `it()` 제목 | 검증 |
| --- | --- |
| `"펼침 버튼이 aria-expanded로 상태를 알린다"` | 초기 `"false"` → 클릭 후 `"true"` → 다시 클릭 `"false"` |
| `"열렸을 때 aria-controls가 실제 패널을 가리킨다"` | 클릭 후 `getElementById(button.getAttribute("aria-controls"))`가 non-null |
| `"닫혔을 때는 aria-controls를 붙이지 않는다 (죽은 참조 방지)"` | 초기 상태에서 `hasAttribute("aria-controls") === false` |
| `"검정 추천 결과가 aria-live 영역 안에 나타난다"` | 펼치고 "두 그룹의 평균 차이" 클릭 → 라이브 영역에 `"두 그룹 평균 비교 (t-검정)"` |
| `"두 단계를 거치는 회귀 추천도 읽힌다"` | "두 변수 사이의 관계" → "예, 예측/설명하고 싶어요" → 라이브 영역에 `"회귀분석"` |
| `"추천 전에도 라이브 영역이 존재한다 (경계)"` | 펼친 직후 패널 안에 `[aria-live="polite"]`가 존재 |
| `"'이 방식으로 계산하기'가 onPick에 모드를 넘긴다"` | `vi.fn()` 스파이가 `"ttest"`로 호출됨 |

### 커밋 분할 (묶음 4.5)

| # | 커밋 | 내용 |
| --- | --- | --- |
| 10 | `fix: aria-hidden 안의 탭 가능한 링크 (L5)` | `ProgressOverview.tsx` + 테스트 |
| 11 | `fix: 결과를 뽑는 도구 둘에 라이브 영역 (M1)` | `TopicIdeaGenerator` `PresentationQuestionBank` + `LiveRegions.test.tsx` 확장 |
| 12 | `fix: 오류 문구를 입력 칸에 연결 (M2)` | 4개 컴포넌트 + `ErrorWiring.test.tsx` |
| 13 | `fix: 통계 도우미 아코디언 상태·추천 알림 (M3)` | `stats/GuideBlock.tsx` + 테스트 |

---

# 전체 커밋 순서 (13개)

```
 1  fix: 넓은 표에 가로 스크롤 단서 (G6)
 2  feat: /example 단계 앵커 칩 (H7)                ← 1 이후 (.scroll-hint 의존)
 3  feat: 모바일 단계 점프 바 (H6)
 4  fix: 변수 정의표 행을 모바일에서 카드로 (G7)
 5  feat: 자료실 인쇄 스타일과 인쇄물 도구 주소 (A6·Y4)
 6  feat: lib/activity에 기간·최근활동 조회 (G5 선행)
 7  fix: /activity 빈 상태와 히트맵 낭독기 요약 (G3·L4)
 8  feat: /activity에서 단계로 돌아가는 길 (G4·G5)   ← 6 이후
 9  feat: 연구 과정 기록 인쇄 출력 (W1)              ← 5·6 이후 (@media print, activity 함수)
10  fix: aria-hidden 안의 탭 가능한 링크 (L5)
11  fix: 결과를 뽑는 도구 둘에 라이브 영역 (M1)
12  fix: 오류 문구를 입력 칸에 연결 (M2)
13  fix: 통계 도우미 아코디언 상태·추천 알림 (M3)
```

10~13은 서로 독립이라 순서를 바꿔도 된다. 1~9는 위 순서를 지킨다.

## 다른 백로그 항목과의 충돌

| 이번 항목 | 충돌하는 미완료 항목 | 관계 |
| --- | --- | --- |
| M2 (`SampleSizeCalculator`) | **L6**(오차범위 상한), **H1**(두 집단 평균 모드) | 같은 파일. L6이 `inputsInvalid` 조건을 바꾼다 |
| G6 (`.scroll-hint`) | **O3**(다크 차트) | 무관 — `--bg` 토큰만 쓴다 |
| G7 (`VariableTableBuilder`) | **L7**(디바운스), **C4**(saveError) | 같은 훅(`usePersistentState`). 이번 변경은 입력 개수를 안 늘린다 |
| A6 (`@media print`) | **S7**(라이선스), **I1**(`/teacher`) | 둘 다 인쇄 배포를 전제한다. A6이 선행 |
| Y4 (`lib/toolReferences`) | **T5**(체크리스트 도구 이름 검증) | T5의 검증 대상과 같은 문자열. `toolUrl`을 T5가 재사용할 수 있다 |
| M1 (`RandomSampler` 패턴) | — | `RandomSampler.tsx:100`의 조건부-안-라이브영역은 **이번 범위 밖**이지만 같은 결함이다. 별도 항목으로 올릴 만하다 |

---

# 구현 시 판단이 필요한 지점 — 9건

이 문서가 결정하지 않고 남긴 것들이다.

1. **G7** — 삭제 버튼을 DOM에 둘(모바일/데스크톱) 둘지, `order` 유틸로 하나만 둘지.
   문서는 "둘 + 구분되는 `aria-label`"을 권한다.
2. **G4** — 단계 제목 링크의 터치 타겟을 44px까지 넓힐지(그리드 행 높이가 바뀐다).
   `items-baseline` + `inline-block` 조합도 실브라우저 확인 필요.
3. **Y4** — `"내 레퍼런스 목록"`처럼 두 단계에 있는 도구의 URL을 첫 등장 단계로 고정할지,
   체크리스트가 속한 단계를 우선할지.
4. **W1** — 기록 0건일 때 인쇄 버튼을 `disabled`로 할지.
5. **M1** — 복사 버튼을 라이브 영역 안에 둘지(목록 재낭독 위험) 밖으로 뺄지.
6. **M3** — `aria-controls`를 항상 붙일지 `open`일 때만 붙일지. 문서는 조건부를 권한다.
7. **H6** — `StageJumpBar`의 진행도를 `suppressHydrationWarning`으로 처리할지
   `useSeededState`로 처리할지.
8. **G4** — `StageDurations`의 `StageInfo` 주석 `/** 더 이상 쓰지 않음 — 호출부 호환용 */`이
   무엇을 가리키는지 불명확하다. 지우기 전에 `git log -p`로 확인할 것.
9. **W1** — `getStageDurations`가 `refId.startsWith("{slug}:")`로 거르는데, 자가검증
   기록의 `refId`는 `slug` 그대로다(`ReflectionBox.tsx:55`). `lib/activity.ts:92`가
   `|| e.refId === stage.slug`로 이미 받고 있으므로 동작한다 — **바꾸지 말 것.**
   (실사 결과 문제없음. 손대려는 유혹을 막기 위해 적어 둔다.)

---

# 실행 전 확인 사항 (실브라우저)

CSS와 sticky는 단위 테스트로 못 잡는다. 아래 다섯은 실제로 열어 봐야 한다.

- **H6** — 375px에서 점프 바가 sticky로 붙는가. `#tools`로 점프했을 때 바가 "도구" 제목을 가리는가.
  1536px(2xl)에서 레일과 바가 **둘 다** 뜨지 않는가.
- **G6** — 6열 표에서 그림자가 보이는가. 2열 표에서 **안** 보이는가. 다크에서 흰 그림자로 뒤집히는가.
  끝까지 밀면 그쪽 그림자가 사라지는가.
- **G7** — 375px에서 카드가 되고 640px에서 한 줄로 돌아오는가. 데스크톱에 테두리 상자가 안 생기는가.
- **A6** — 자료실 한 편을 인쇄 미리보기로 열어 목차·다른 문서·이전다음이 빠지고,
  본문 내부 링크 뒤에 `(yeongulab.com/...)`가 붙는가. 표가 페이지 경계에서 안 잘리는가.
- **W1** — `/activity/record`를 A4 인쇄 미리보기로 열어 절 넷이 경계에서 안 잘리는가.
  기록 0건 / 부분 기록 / 전체 기록 세 상태를 각각 볼 것.
