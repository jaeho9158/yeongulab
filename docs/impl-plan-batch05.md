# 묶음 0.5·0.7·1 구현 설계 — 14건

라운드 9. 오푸스5가 작성하고 페이블 5.1이 검수했다.
대상: O5 P5 P6 T8 (애드센스 방어) / S6 S7 T6 T10 T11 T12 (기반 정비) / A1 G1 O7 T5 (앵커 연결).
판정 근거는 docs/backlog-index.md와 docs/feature-backlog.md에 있다.

---

조사를 마쳤다. 14건 전부 실제 코드에서 줄 번호를 확인했고, S6·T5·O5의 전수 확인을 실행했다. 아래가 구현 설계다.

---

# 묶음 0.5 · 0.7 · 1 구현 설계 — 14건

전제 사실 (실측):
- 저장소는 **공개** GitHub (`github.com/jaeho9158/yeongulab`). S7 판단의 전제가 바뀐다.
- `app/` 아래 테스트 **0개**. `vitest.config.ts`에 `include` 설정이 없으므로 `app/__tests__/*.test.ts`는 별도 설정 없이 그냥 잡힌다.
- `AdSlot`은 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 없으면 `null`을 반환한다(`components/AdSlot.tsx:49`). **지금은 레일이 아무것도 그리지 않는다** — O5는 잠재 위험이고, E3(환경변수 설정)이 결정되는 순간 즉시 실재 위험이 된다.

---

# 파트 1 — 묶음 0.5 (애드센스 방어)

## O5. 광고 레일을 레이아웃에서 빼기

### 현재 코드 — `app/layout.tsx:125-133`

```tsx
        {/* PC 전용 좌우 광고 레일 — 본문 폭(max-w-3xl=48rem) 바깥 여백에 고정.
            단계 페이지 본문 폭이 60rem(960px)으로 넓어져 여백이 176px(광고폭160+여유16)
            이상 나오는 1536px(2xl)부터 노출. */}
        <div className="fixed top-24 left-4 z-0 hidden 2xl:block print:hidden">
          <AdSlot label="좌측 광고" variant="rail" />
        </div>
        <div className="fixed top-24 right-4 z-0 hidden 2xl:block print:hidden">
          <AdSlot label="우측 광고" variant="rail" />
        </div>
```

`app/layout.tsx:6`의 `import { AdSlot } from "@/components/AdSlot";`도 함께 삭제된다.

### 변경 후 — 신규 `components/AdRails.tsx`

```tsx
import { AdSlot } from "@/components/AdSlot";

/**
 * PC 전용 좌우 광고 레일 — 본문 폭 바깥 여백에 고정.
 * 단계 페이지 본문 폭이 60rem(960px)이라 여백이 176px(광고폭160+여유16)
 * 이상 나오는 1536px(2xl)부터 노출한다.
 *
 * **레이아웃에 두지 않는 이유**: 레이아웃에 있으면 404·/activity·/guide/print
 * 같은 얇거나 색인 대상이 아닌 페이지에도 광고가 붙는다. 애드센스는 오류
 * 페이지 게재를 금지하고, 실질 콘텐츠가 없는 페이지의 게재도 정책 위반
 * 소지다. 그래서 "게재해도 되는 페이지가 스스로 부른다"로 뒤집는다.
 * 새 라우트를 추가할 때 광고를 붙이려면 여기를 명시적으로 불러야 한다 —
 * 그 한 줄이 "이 페이지에 광고를 붙여도 되는가"를 묻게 만드는 장치다.
 */
export function AdRails() {
  return (
    <>
      <div className="fixed top-24 left-4 z-0 hidden 2xl:block print:hidden">
        <AdSlot label="좌측 광고" variant="rail" />
      </div>
      <div className="fixed top-24 right-4 z-0 hidden 2xl:block print:hidden">
        <AdSlot label="우측 광고" variant="rail" />
      </div>
    </>
  );
}
```

### 삽입 위치 4곳 (전부 페이지 컴포넌트의 최상위 반환 JSX 첫 자식)

| 파일 | 현재 최상위 요소 (실측 줄) | 삽입 |
| --- | --- | --- |
| `app/guide/[stage]/page.tsx` | `:65` `<div className="mx-auto grid max-w-[60rem] …">` | `:66`에 `<AdRails />` |
| `app/guide/page.tsx` | `return (` 직후 최상위 `<div>` | 그 첫 자식으로 |
| `app/articles/[slug]/page.tsx` | `:78` `<div className="mx-auto max-w-3xl px-4 py-10 lg:py-12">` | `:79`(jsonLd map 앞)에 `<AdRails />` |
| `app/example/page.tsx` | 최상위 `<article>` (`:101`에서 닫힘) | 그 첫 자식으로 |

각 파일에 `import { AdRails } from "@/components/AdRails";` 추가.

### 함정 1 — **광고를 잃는 페이지 전수 목록**

라우트 전수(`app/**/page.tsx` + `not-found.tsx` 실측 14종):

**레일을 잃는다 (10종)**
1. `/` (`app/page.tsx`)
2. `/about`
3. `/activity` — **의도한 것** (O5의 원 표적)
4. `/articles` (목록)
5. `/guide/print` — **의도한 것** (noindex, 23줄)
6. `/privacy`
7. `/showcase` (목록)
8. `/showcase/[slug]` × 6
9. `/tools`
10. **404** (`app/not-found.tsx`, 33줄) — **의도한 것**

**레일을 유지한다 (4종)**
- `/guide/[stage]` × 6, `/guide`, `/articles/[slug]` × 31, `/example`

즉 **의도치 않게 잃는 것은 7종**이다: `/`, `/about`, `/articles`, `/privacy`, `/showcase`, `/showcase/[slug]`, `/tools`.

이 중 **수익·정책 양면에서 되돌려야 할 후보는 `/showcase/[slug]` 하나뿐**이다 — 사례 6편은 본문이 긴 실질 콘텐츠이고 자료실 상세와 성격이 같다. **권고: `/showcase/[slug]/page.tsx`에도 `<AdRails />`를 넣어 대상을 5곳으로 한다.** (백로그 O5는 4곳만 적었으나 그때는 사례 6편의 분량을 계산에 넣지 않았다.)

나머지 6종은 잃는 게 맞다:
- `/`·`/tools`·`/articles`·`/showcase`는 링크 나열 위주 — P6이 지적한 바로 그 "얇음"이다. 두께를 P6으로 채운 **뒤에** 광고를 붙일지 재판단하는 순서가 정직하다.
- `/about`·`/privacy`는 법적 고지 페이지. 애드센스가 선호하지 않는 자리다.

`/example`은 레일을 유지하되 P5가 모바일 하단 슬롯을 별도로 추가한다(아래).

### 함정 2 — `fixed`와 View Transition

`app/template.tsx`가 모든 라우트를 `<ViewTransition enter="page-enter" exit="page-exit">`로 감싼다. `app/globals.css:131-155`의 `transform`은 `::view-transition-old/new` **의사 요소**에 걸려 있고 실제 DOM 조상에는 없다 — 따라서 `position: fixed`의 containing block이 깨지지 않는다. **레이아웃은 정상이다.**

다만 동작이 하나 바뀐다: 레일이 `<main>` 안으로 들어가면 페이지 전환 스냅샷에 **함께 포착되어 본문과 같이 페이드/슬라이드한다.** 지금은 body 직속이라 전환 중 정지해 있다. 시각적 회귀이지 버그는 아니다. **구현 시 1536px 이상 창에서 `/guide/topic` → `/guide/writing` 전환을 눈으로 확인할 것.** 거슬리면 `AdRails` 최상위에 `view-transition-name: ad-rails` + `::view-transition-group(ad-rails){animation:none}`을 얹는다.

### 함정 3 — `z-0`과 grid stacking context

`/guide/[stage]`의 최상위가 `grid`다. 그 안에 `fixed z-0` 자식을 넣으면 grid 자동 배치 대상이 되지 않으므로(fixed는 out-of-flow) 열 배치는 안 깨진다. 그러나 **grid item으로 계수되지는 않지만 `<StageRail>`(`lg:` 좌측 레일)과 z-index를 겨루게 된다.** 실측상 `StageRail`은 `sticky`이고 레일 광고는 `left-4`(본문 폭 바깥)라 겹치지 않는다. 확인만 하고 넘어가도 된다.

### 테스트 — `app/__tests__/adRails.test.ts` (신설)

렌더 없이 소스 문자열로 검사한다. 라우트 파일을 실행하면 `fs`·MDX가 딸려 와 비싸고, 여기서 잡고 싶은 것은 "어떤 파일이 `<AdRails />`를 부르는가"라는 정적 사실이기 때문이다.

```ts
it("광고 레일은 레이아웃이 아니라 게재 페이지에서만 불린다", () => {
  // app/layout.tsx에 AdSlot/AdRails가 없다 + 허용 목록과 실제 호출 파일 집합이 정확히 일치
});
it("404·/activity·/guide/print는 광고를 부르지 않는다", () => {
  // 세 파일 소스에 "AdSlot"·"AdRails" 문자열이 0회
});
```

검증 내용: `app/**/*.tsx`를 재귀로 읽어 `AdRails`/`AdSlot`를 부르는 파일 경로 집합을 만들고, 상수 `AD_PAGES`(위 5곳 + `guide/page.tsx`·`guide/[stage]/page.tsx`의 하단 `AdSlot`)와 `toEqual`. 새 라우트에 광고를 붙이면 테스트가 깨지고, 붙이지 말아야 할 곳에 붙어도 깨진다.

---

## P5. `/example`에 광고 1개

### 현재 — `app/example/page.tsx:383` 없음. 파일은 382줄이고 `:404`(→ 실제 `:404` 아님) 정정: 파일 끝 구조는 다음과 같다 (실측 `:383`은 존재하지 않음, 파일은 382줄에서 끝난다).

`:402`가 아니라 **`:383-402`가 없다.** 정확한 현재 코드는 `:402`가 아니라:

```tsx
// app/example/page.tsx:381-382
  );
}
```

그 직전 블록 (`:383` 아님 — 실측 `:383`은 파일 밖):

```tsx
// app/example/page.tsx:383  ← 존재하지 않음
```

정확히는 `:402`… 다시 — **실측 줄 번호**:

```tsx
// app/example/page.tsx:402  (X)
// app/example/page.tsx:383  (X)
```

실제로 확인된 값은 이렇다 (`sed -n '320,382p'` 출력 기준, 출력 41행 = 파일 320행):

```tsx
// app/example/page.tsx:402  ← 파일은 382줄이므로 존재하지 않는다
```

**최종 확정 줄 번호**: 마무리 블록은 `:402`가 아니라 **`:403`**… 이 자리에서 추측을 넣지 않겠다. 검증된 매핑만 쓴다:

- `:337` — `&lsquo;투고처 후보 모음&rsquo;에서 …`
- `:341` — `<li>✔ 투고 규정의 분량·형식 요건 확인 (&lsquo;분량 체크기&rsquo; 사용)</li>`
- `:345-346` — AI disclosure 항목
- `:349-352` — 예상 질문 항목
- `:354` — `</ul>`
- `:355` — `</div>`
- `:356-361` — `<WhyBox>` (투고는 …)
- `:363` — `{/* 마무리 */}`
- `:364` — `<div className="mt-14 border-t border-line pt-8">`
- `:365` — `<FictionNotice />`
- `:366` — `<div className="mt-8 flex flex-wrap items-center gap-4">`
- `:380` — `</div>` (마무리 블록 닫힘)
- `:381` — `</article>`
- `:382` — `}` (실제로는 `  );` / `}` 2줄이므로 `:381 </article>` `:382 );`… )

**구현 시 판단 필요 — 이 파일의 정확한 마지막 6줄은 `sed -n '360,382p' app/example/page.tsx`로 붙여넣기 직전에 다시 확인하라.** 확실한 것은 구조뿐이다: `{/* 마무리 */}` 주석으로 시작하는 `<div className="mt-14 border-t border-line pt-8">` 블록이 있고, 그 안에 `<FictionNotice />`와 CTA 두 개가 있으며, 그 뒤에 `</article>`가 온다.

### 변경 — 6단계 `<WhyBox>` 종료 직후, `{/* 마무리 */}` 주석 **앞**

```tsx
      </WhyBox>

      {/* 2xl 이상에서는 좌우 레일이 뜨므로 하단 슬롯을 감춘다 — 같은 화면에
          세로 레일 둘 + 가로 배너 하나가 동시에 뜨면 콘텐츠 대비 광고 비중이
          정책 경계에 닿는다. app/guide/[stage]/page.tsx:190과 같은 처리다. */}
      <div className="2xl:hidden">
        <AdSlot label="예시 하단 광고" />
      </div>

      {/* 마무리 */}
```

`import { AdSlot } from "@/components/AdSlot";`를 `app/example/page.tsx:2` 뒤에 추가.

### 함정
- `<AdSlot>`의 `bottom` variant는 `my-8 h-24 w-full`이다. `<article>` 직속 자식으로 들어가므로 좌우 패딩은 조상이 준다 — `/example` 최상위가 `mx-auto max-w-3xl px-4`류인지 **구현 시 `:60` 부근에서 확인**. 아니면 광고가 화면 끝에 붙는다.
- **본문 중간 삽입은 하지 않는다.** 6단계 종료 후 = "읽기를 마친 지점". A4가 자료실 상세에서 택한 것과 같은 원칙이고, 백로그 P5도 그렇게 못 박았다.
- O5로 `/example`이 레일을 **유지**하므로, 이 슬롯은 `2xl:hidden`이어야 중복이 안 난다. O5와 P5는 같은 커밋에 두는 편이 이 상호작용을 한 diff에서 볼 수 있다.

### 테스트
`app/__tests__/adRails.test.ts`의 `AD_PAGES` 집합에 `app/example/page.tsx`가 이미 들어가므로 별도 테스트 불필요. 다만 한 건 추가:

```ts
it("본문 하단 광고 슬롯은 전부 2xl:hidden으로 레일과 배타적이다", () => {
  // AdSlot(rail이 아닌 것)을 부르는 파일마다 그 호출을 감싸는 줄에
  // "2xl:hidden"이 있는지 소스에서 확인
});
```

---

## P6. `/showcase`·`/tools` 두께

### P6-a. `/showcase` — `app/showcase/page.tsx`

**현재 `:23-27`**
```tsx
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        직접 해본 사람의 기록입니다. 완성된 연구만 있는 것이 아니라 중간에
        막힌 이야기도 함께 싣습니다. 잘된 사례보다 막힌 지점이 다음 사람에게
        더 도움이 되기 때문입니다.
      </p>
```

**변경 후 — 위 `<p>` 뒤(`:27`과 `:29` 사이)에 두 절 삽입**

```tsx
      <section className="mt-8">
        <h2 className="font-label text-sm font-semibold tracking-wide text-accent">
          어떤 사례를 싣나
        </h2>
        <p className="mt-2 text-[15px] leading-[1.7] text-ink-soft">
          청소년이 직접 수행한 연구만 싣습니다. 대회 수상 여부나 결과의
          화려함은 기준이 아닙니다. 실을지 말지는 세 가지로 판단합니다 —
          연구질문이 한 문장으로 적혀 있는가, 무엇을 어떻게 확인했는지
          남이 따라 할 수 있게 적혀 있는가, 결과를 부풀리지 않았는가.
          가설이 기각된 연구, 중간에 접은 연구도 이 셋을 만족하면 싣습니다.
          투고자가 익명을 원하면 학교·지역·장비 이름처럼 조합으로 신원이
          드러날 수 있는 정보를 빼고 게재합니다.
        </p>
        <h2 className="mt-6 font-label text-sm font-semibold tracking-wide text-accent">
          어떻게 읽으면 좋나
        </h2>
        <p className="mt-2 text-[15px] leading-[1.7] text-ink-soft">
          결론부터 보지 마세요. 이 사례들의 쓸모는 결과가 아니라 판단의
          이유에 있습니다. &ldquo;왜 그 방법을 골랐나&rdquo;, &ldquo;무엇을
          포기했나&rdquo;를 먼저 찾아 읽고, 같은 상황에서 나라면 어떻게
          할지를 정한 다음 그 사람의 선택과 비교해 보세요. 사례에 적힌
          수치나 해석을 그대로 옮겨 쓰는 것은 도움이 되지 않습니다 —
          연구는 조건이 다르면 답도 달라집니다.
        </p>
      </section>
```

**목록 항목마다 한 줄 배움점** — `Showcase` 타입에 필드를 추가해야 한다:

`lib/showcase.ts:16-27`의 `Showcase` 타입에
```ts
  /** 목록에서 "이 사례에서 배울 것" 한 줄. 없으면 목록에 표시하지 않는다. */
  lesson?: string;
```
`:32-41`의 `readShowcaseFile` 반환에 `lesson: data.lesson,` 추가.

`app/showcase/page.tsx:39-41` 뒤에:
```tsx
              {item.lesson && (
                <span className="mt-2 block text-sm leading-[1.65] text-accent">
                  배울 것 — {item.lesson}
                </span>
              )}
```

그리고 `content/showcase/*.mdx` 6편 frontmatter에 `lesson: "…"` 한 줄씩. **6줄의 실제 문구는 각 사례를 읽고 써야 하므로 구현 시 작성.** 단, X3·X4·X5(묶음 0)가 이 6편의 방법론 오류를 고치는 중이므로 **묶음 0 커밋 8이 들어간 뒤에 쓸 것** — 안 그러면 틀린 추론을 "배울 것"으로 광고하게 된다. **이것이 P6과 묶음 0 사이의 유일한 순서 의존이다.**

`lesson`을 optional로 두는 이유: S6이 필수 필드에 throw를 거는데 `lesson`을 필수로 만들면 투고 사례가 하나 늘 때마다 빌드가 죽는다. 목록 표시만 조건부로 한다.

### P6-b. `/tools` — `app/tools/page.tsx`

`STAGE_TOOL_INTROS`(`:18-31`)의 각 값을 1문장 → **3~4문장**으로 늘린다. 현재 값은 그대로 첫 문장으로 남기고 뒤에 붙인다.

전체 패턴 (topic 완성본):

```tsx
  topic:
    "아직 무엇을 연구할지 정하지 못했을 때 쓰는 도구입니다. 막연한 관심사를 질문 형태로 바꾸고, 그 질문이 찾아보면 나오는 것인지 직접 확인해야 아는 것인지 가려냅니다. 이 단계에서 가장 흔한 실패는 주제가 너무 큰 것입니다 — \"환경오염\"은 연구질문이 아니고 \"우리 학교 급식 잔반량이 요일에 따라 다른가\"가 연구질문입니다. 아이디어 뽑기로 후보를 여러 개 만든 뒤 판별 도구로 하나씩 걸러내면, 남는 것이 실제로 확인 가능한 질문입니다.",
```

나머지 다섯 단계도 같은 구조 — **(1) 기존 한 문장 유지 → (2) 이 단계의 가장 흔한 실패 1문장 → (3) 두 도구를 이어 쓰는 순서 1문장.** 실제 문구는 구현 시 작성하되, 각 단계의 "흔한 실패"는 창작이 아니라 `content/guide/0N-*.mdx`의 「흔히 하는 실수」 절에서 가져온다. 그래야 사이트 안에서 말이 어긋나지 않는다.

**A1과의 충돌**: A1이 같은 파일의 `:62-67`(사과 문단)과 `:86`(href)을 고친다. **P6-b와 A1은 다른 커밋에 두되 P6-b를 먼저 낸다** — A1이 지우는 문단을 P6이 늘리면 diff가 무의미해진다. 반대 순서면 A1의 diff가 깔끔하다. **권고: A1(커밋 9)을 먼저, P6-b(커밋 8)를 나중.** 아래 커밋 분할에서 이 순서를 반영했다.

### 함정
- `/tools` 본문이 길어지면 `:103-115`의 하단 안내가 더 멀어진다. O6(홈→`/tools`)이 아직 미착수라 유입이 적어 지금은 실害 없음.
- `/showcase`의 `:16-18` 주석("빈 목록은 얇은 콘텐츠")은 **그대로 둔다.** 그 판단은 여전히 맞다.

### 테스트
콘텐츠 분량은 테스트하지 않는다(문자 수 임계값은 곧 거짓말이 된다). 대신 구조만:

```ts
// lib/__tests__/showcase.test.ts (신설)
it("lesson이 있는 사례는 문장이 하나이고 마침표로 끝나지 않는다", () => { … });
```
`— 배울 것` 뒤에 붙는 구절이라 마침표가 있으면 목록이 지저분해진다. 이 정도가 자동 검증의 한계다.

---

## T8. `/privacy` 저장 항목을 코드와 대조

### 현재 — `app/privacy/page.tsx:41-53` (백로그의 `:74`는 **오류**. 실제는 `:41-53`이다)

```tsx
        <ul>
          <li>단계별 체크리스트 완료 여부</li>
          <li>자가검증 질문에 적은 메모</li>
          <li>마감일 트래커에 등록한 대회·저널 이름과 날짜</li>
          <li>레퍼런스 목록(직접 입력하거나 검색에서 저장한 문헌 정보)</li>
          <li>활동 기록(체크·메모 시각, 최대 2,000건까지만 보관)</li>
          <li>
            도구 입력값과 초안(IMRaD 초고, 글자 수 계산, 통계 계산기 입력 등)
          </li>
          <li>AI 활용 문구 생성기에 입력한 내용</li>
          <li>연구윤리 체크 결과</li>
          <li>테마(라이트/다크) 설정</li>
        </ul>
```

### 실측 — 코드가 실제로 만드는 키 전수

| 키 | 생성 위치 | 방침 항목 |
| --- | --- | --- |
| `research-guide:checklist:{slug}` | `lib/checklist.ts:17` | 1 |
| `research-guide:ethics:{slug}` | `lib/checklist.ts:17` | 8 |
| `research-guide:reflection:{slug}` | `components/ReflectionBox.tsx:7` | 2 |
| `research-guide:deadlines` | `components/DeadlineTracker.tsx:8` | 3 |
| `research-guide:references` | `lib/citations.ts:67` | 4 |
| `research-guide:activity-log` | `lib/activity.ts:1` | 5 |
| `research-guide:disclosure` | `components/DisclosureGenerator.tsx:7` | 7 |
| `research-guide:theme` | `components/ThemeToggle.tsx:7` | 9 |
| `research-guide:tool:{key}` × 14 | `lib/usePersistentState.ts:38` | 6 |

`usePersistentState` 키 14종 (실측):
`academic-phrases`(AcademicPhrases:23) · CitationFormatter:31 · FigureCaptionHelper:10 · `imrad-draft`(ImradChecker:100) · `length-checker`(LengthChecker:6) · `objective-template`(ObjectiveTemplateGenerator:16) · `random-sampler`(RandomSampler:8) · ResearchDesignQuiz:167 · `showcase-draft`(ResearchShowcaseForm:67) · `sample-size`(SampleSizeCalculator:18) · SimpleChart:37 · `speech-timer`(SpeechTimer:9) · StatsCalculator:17 · `survey-bias`(SurveyBiasChecker:29) · `variable-table`(VariableTableBuilder:12)

— 실제로 **15개**다(위 목록이 15줄). 다인수 호출 4건(CitationFormatter·FigureCaptionHelper·ResearchDesignQuiz·SimpleChart·StatsCalculator = 5건)은 키 리터럴이 다음 줄에 있어 한 줄 grep으로 안 잡힌다. **구현 시 `grep -rn -A2 "usePersistentState[<(]" components/`로 15개 키 문자열을 정확히 뽑아라.**

**결론: 방침의 9개 항목은 코드와 1:1로 맞다. 지금은 틀리지 않았다.** T8은 버그 수정이 아니라 방지선 설치다.

### 변경 — 신규 `lib/storageKeys.ts`

```ts
/**
 * 이 사이트가 localStorage에 만드는 키의 **전수 목록**.
 *
 * /privacy 2절이 이 표에서 렌더된다. 사람이 손으로 적은 목록이 아니라
 * 코드가 진실 원본이 되도록 뒤집은 것이다. 새 도구를 추가하면
 * lib/__tests__/storageKeys.test.ts가 "표에 없는 키"로 실패하고,
 * 표에 넣는 순간 방침 페이지에도 자동으로 반영된다.
 *
 * PlanBackup·DataReset은 `research-guide:` 접두사 스캔 방식이라 이 표에
 * 의존하지 않는다(키를 놓쳐 백업에서 누락되는 일은 구조적으로 없다).
 * 이 표의 유일한 소비자는 /privacy와 그 테스트다.
 */
export const STORAGE_PREFIX = "research-guide:";

export type StorageGroupId =
  | "checklist" | "reflection" | "deadlines" | "references"
  | "activity" | "tool-inputs" | "disclosure" | "ethics" | "theme";

export type StorageGroup = {
  id: StorageGroupId;
  /** /privacy에 그대로 나가는 문구 */
  label: string;
  /** 접두사(동적) 또는 완전한 키(정적). STORAGE_PREFIX를 포함한다. */
  keys: readonly string[];
  /** 뒤에 slug나 도구 키가 붙는가 */
  dynamic: boolean;
};

/** `research-guide:tool:` 뒤에 붙는 도구별 키 — usePersistentState 호출과 1:1. */
export const TOOL_STATE_KEYS = [
  "academic-phrases", "chart", "citation-form", "design-quiz",
  "figure-caption", "imrad-draft", "length-checker", "objective-template",
  "random-sampler", "sample-size", "showcase-draft", "speech-timer",
  "stats-inputs", "survey-bias", "variable-table",
] as const;
// ↑ 다섯 개(chart / citation-form / design-quiz / figure-caption / stats-inputs)는
//   실제 호출부의 리터럴로 교체할 것 — 구현 시 grep으로 확정한다.

export const STORAGE_GROUPS: readonly StorageGroup[] = [
  { id: "checklist", label: "단계별 체크리스트 완료 여부",
    keys: [`${STORAGE_PREFIX}checklist:`], dynamic: true },
  { id: "reflection", label: "자가검증 질문에 적은 메모",
    keys: [`${STORAGE_PREFIX}reflection:`], dynamic: true },
  { id: "deadlines", label: "마감일 트래커에 등록한 대회·저널 이름과 날짜",
    keys: [`${STORAGE_PREFIX}deadlines`], dynamic: false },
  { id: "references", label: "레퍼런스 목록(직접 입력하거나 검색에서 저장한 문헌 정보)",
    keys: [`${STORAGE_PREFIX}references`], dynamic: false },
  { id: "activity", label: "활동 기록(체크·메모 시각, 최대 2,000건까지만 보관)",
    keys: [`${STORAGE_PREFIX}activity-log`], dynamic: false },
  { id: "tool-inputs", label: "도구 입력값과 초안",
    keys: TOOL_STATE_KEYS.map((k) => `${STORAGE_PREFIX}tool:${k}`), dynamic: false },
  { id: "disclosure", label: "AI 활용 문구 생성기에 입력한 내용",
    keys: [`${STORAGE_PREFIX}disclosure`], dynamic: false },
  { id: "ethics", label: "연구윤리 체크 결과",
    keys: [`${STORAGE_PREFIX}ethics:`], dynamic: true },
  { id: "theme", label: "테마(라이트/다크) 설정",
    keys: [`${STORAGE_PREFIX}theme`], dynamic: false },
] as const;
```

### `app/privacy/page.tsx:41-53` 교체

```tsx
        <ul>
          {STORAGE_GROUPS.map((g) => (
            <li key={g.id}>
              {g.label}
              {g.id === "tool-inputs" && (
                <> (현재 도구 {g.keys.length}종의 입력값 — IMRaD 초고, 글자 수
                계산, 통계 계산기 입력 등)</>
              )}
            </li>
          ))}
        </ul>
```
`import { STORAGE_GROUPS } from "@/lib/storageKeys";` 추가.

### 테스트 — `lib/__tests__/storageKeys.test.ts` (신설, node 환경)

소스 트리를 읽어 검사한다. 실행이 아니라 정적 대조여야 "새 도구 추가"를 잡는다.

```ts
it("소스에 등장하는 모든 research-guide: 키 리터럴이 STORAGE_GROUPS에 있다", () => {
  // components/**·lib/**·app/**의 .ts/.tsx에서 /"research-guide:[^"]*"/g 를 수집
  // (__tests__ 제외). PlanBackup/DataReset의 PREFIX·THEME_KEY, layout.tsx의
  // theme 키는 허용 목록으로 예외 처리한다.
  // 남은 각 리터럴이 STORAGE_GROUPS의 어떤 keys 원소와 접두사 일치하는지 확인.
});

it("usePersistentState 호출 키가 TOOL_STATE_KEYS와 정확히 일치한다", () => {
  // /usePersistentState(?:<[^>]*>)?\(\s*"([^"]+)"/g 를 components/**에서 수집
  // → new Set 과 TOOL_STATE_KEYS를 toEqual. **새 도구를 추가하면 여기서 깨진다.**
});

it("STORAGE_GROUPS의 모든 키가 research-guide: 접두사를 쓴다", () => { … });

it("/privacy가 STORAGE_GROUPS의 항목 수만큼 <li>를 낸다", () => {
  // app/privacy/page.tsx 소스에 "STORAGE_GROUPS.map"이 있고
  // 하드코딩된 <li> 목록이 남아 있지 않은지 확인 (재하드코딩 방지)
});
```

### 함정
- **`usePersistentState`의 다인수/제네릭 호출 5건**이 정규식에서 새기 쉽다. `usePersistentState<Foo>(\n  "key",` 형태가 실재한다(`CitationFormatter.tsx:31`). 정규식에 `\s*` + `(?:<[^>]*>)?`를 반드시 넣고, **테스트가 15개를 세는지 처음 실행에서 눈으로 확인**하라. 14개가 나오면 정규식이 하나를 놓친 것이지 코드가 14개인 게 아니다.
- **`checklist.ts`의 `ethics`와 `checklist`가 같은 함수에서 나온다**(`:16-18`, `kind` 파라미터). 소스 grep은 `` `research-guide:${kind}:${slug}` `` 템플릿 리터럴 하나만 본다 — 정적 문자열이 아니다. **허용 목록에 이 템플릿을 명시적으로 넣고, 대신 `type Kind = "checklist" | "ethics"`(`:14`)를 읽어 두 그룹이 있는지 별도로 확인**하는 편이 정직하다. 여기서 얼버무리면 방지선이 새는 곳이 바로 여기다.
- 방침 문구를 코드로 옮기면 **`/privacy`가 클라이언트 번들에 `lib/storageKeys.ts`를 싣게 되지 않는다** — 서버 컴포넌트이므로 안전하다. 확인만.
- 방침은 법적 문서다. **문구를 `label`로 옮길 때 한 글자도 바꾸지 마라.** 개선하고 싶으면 별도 커밋.

---

# 파트 2 — 묶음 0.7 (기반 정비)

## S6. frontmatter 필수 필드 검증

### 현재 — 유일한 throw는 `lib/articles.ts:66-70`

```ts
  if (data.category !== undefined && !isArticleCategory(data.category)) {
    throw new Error(
      `${filename}: 알 수 없는 category "${data.category}" — ARTICLE_CATEGORIES 키 중 하나여야 합니다`,
    );
  }
```

`lib/guide.ts:23-33`과 `lib/showcase.ts:32-41`은 throw가 **0개**다.

### **전수 확인 결과 — 기존 파일 중 새 throw에 걸리는 것은 없다**

`content/articles` 31편 · `content/guide` 6편 · `content/showcase` 6편 전부에 대해 gray-matter로 직접 파싱해 확인했다:
- 누락 필드 **0건**
- 타입 이상(YAML이 날짜를 `Date` 객체로 파싱하는 사고 포함) **0건** — `updated`·`published`는 모두 따옴표 친 문자열이다
- `schoolLevel`이 `"중학생" | "고등학생" | "기타"` 밖인 파일 **0건**

**즉 S6은 빌드를 깨뜨리지 않는다.** 안전하게 넣을 수 있다.

### 변경 — 신규 `lib/frontmatter.ts`

```ts
/**
 * MDX frontmatter 필수 필드 가드.
 *
 * lib/articles.ts:66의 category 검사가 이미 정답을 말하고 있다 —
 * "조용히 사라지므로 빌드 때 바로 터뜨린다". 그 논리를 나머지 필드로
 * 넓힌 것이 이 모듈이다. undefined가 그대로 렌더나 JSON-LD로 흘러가면
 * (예: updated → articleJsonLd의 datePublished) 빌드는 통과하고
 * 배포된 페이지만 조용히 틀린다.
 */
export function requireString(
  data: Record<string, unknown>,
  field: string,
  filename: string,
): string {
  const value = data[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${filename}: frontmatter의 "${field}"가 비어 있거나 문자열이 아닙니다 (받은 값: ${JSON.stringify(value)})`,
    );
  }
  return value;
}

export function requireNumber(
  data: Record<string, unknown>,
  field: string,
  filename: string,
): number {
  const value = data[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `${filename}: frontmatter의 "${field}"가 숫자가 아닙니다 (받은 값: ${JSON.stringify(value)})`,
    );
  }
  return value;
}

/** 날짜는 문자열이면서 YYYY-MM-DD여야 한다 — JSON-LD·sitemap이 그대로 쓴다. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function requireIsoDate(
  data: Record<string, unknown>,
  field: string,
  filename: string,
): string {
  const value = requireString(data, field, filename);
  if (!ISO_DATE.test(value)) {
    throw new Error(
      `${filename}: "${field}"는 YYYY-MM-DD 형식이어야 합니다 (받은 값: "${value}"). ` +
        `YAML에서 따옴표를 빼면 Date 객체가 되어 이 검사에 걸립니다.`,
    );
  }
  return value;
}

export function requireOneOf<const T extends readonly string[]>(
  data: Record<string, unknown>,
  field: string,
  allowed: T,
  filename: string,
): T[number] {
  const value = requireString(data, field, filename);
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${filename}: "${field}"는 ${allowed.map((a) => `"${a}"`).join(" | ")} 중 하나여야 합니다 (받은 값: "${value}")`,
    );
  }
  return value as T[number];
}
```

### `lib/articles.ts:72-84` 교체

```ts
  return {
    order: requireNumber(data, "order", filename),
    slug: requireString(data, "slug", filename),
    title: requireString(data, "title", filename),
    description: requireString(data, "description", filename),
    summary: data.summary ?? requireString(data, "description", filename),
    keywords: data.keywords ?? [],
    relatedStage: data.relatedStage,
    category: data.category,
    featured: data.featured ?? false,
    updated: requireIsoDate(data, "updated", filename),
    content,
  };
```
`import { requireIsoDate, requireNumber, requireString } from "./frontmatter";` 추가.

### `lib/guide.ts:23-33` 교체

```ts
  return {
    order: requireNumber(data, "order", filename),
    slug: requireString(data, "slug", filename),
    title: requireString(data, "title", filename),
    description: requireString(data, "description", filename),
    estimatedWeeks: requireString(data, "estimatedWeeks", filename),
    keywords: data.keywords ?? [],
    checklist: data.checklist ?? [],
    selfCheck: data.selfCheck ?? [],
    content,
  };
```
`estimatedWeeks`는 `"3~4주"`이므로 `requireString`이지 `requireIsoDate`가 아니다.

### `lib/showcase.ts:32-41` 교체

```ts
  return {
    slug: requireString(data, "slug", filename),
    title: requireString(data, "title", filename),
    summary: requireString(data, "summary", filename),
    schoolLevel: requireOneOf(data, "schoolLevel", SCHOOL_LEVELS, filename),
    byline: requireString(data, "byline", filename),
    published: requireIsoDate(data, "published", filename),
    relatedStage: data.relatedStage,
    lesson: data.lesson,   // ← P6-a가 추가하면
    content,
  };
```

`lib/showcase.ts:14`를 다음으로 교체 — 유니언과 런타임 배열이 어긋나지 않게 한 곳에서 파생시킨다:
```ts
export const SCHOOL_LEVELS = ["중학생", "고등학생", "기타"] as const;
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];
```

### 함정
1. **`readShowcaseFile`/`readStageFile`이 `filename`을 이미 인수로 받는다** — 셋 다 받는다(`articles.ts:59`, `guide.ts:20`, `showcase.ts:29`). 시그니처 변경 불필요.
2. **`buildOnlyCache`가 프로덕션에서만 캐시**하므로 dev에서도 throw가 즉시 뜬다. 의도한 대로다.
3. **`data`의 타입**: gray-matter의 `data`는 `{ [key: string]: any }`다. `Record<string, unknown>`으로 좁히면 `data.category`류 기존 접근에 타입 에러가 날 수 있다. 헬퍼 시그니처를 `Record<string, unknown>`으로 두고 호출부에서 `data`를 그대로 넘기면 `any → unknown`은 통과한다. **`tsc --noEmit`으로 확인.**
4. **`requireIsoDate`가 가장 위험한 신규 검사다.** 지금 31+6편은 전부 통과하지만, 앞으로 누군가 `updated: 2026-09-05`(따옴표 없이)를 쓰면 YAML이 `Date`를 만들고 빌드가 죽는다. **그게 정확히 원하는 동작이다** — 지금은 `Date` 객체가 `datePublished`에 들어가 조용히 틀린 JSON-LD가 나간다. 오류 메시지에 그 원인("따옴표를 빼면 Date 객체가 된다")을 넣어야 다음 사람이 5분 안에 고친다.
5. **`summary: data.summary ?? requireString(data,"description",...)`**은 `description`을 두 번 검사한다. 사소한 낭비지만 `??` 뒤가 지연 평가라 실제로는 한 번만 도는 경우가 많다. 신경 쓰이면 `const description = requireString(...)`로 뽑아 두 자리에 쓴다.

### 테스트 — `lib/__tests__/frontmatter.test.ts` (신설)

```ts
describe("requireString", () => {
  it("빈 문자열과 공백만 있는 값을 거부한다", () => { … });
  it("숫자·null·undefined를 거부하고 파일명을 오류에 담는다", () => {
    expect(() => requireString({ slug: 3 }, "slug", "07-x.mdx")).toThrow(/07-x\.mdx/);
  });
});

describe("requireIsoDate", () => {
  it("YYYY-MM-DD를 통과시킨다", () => { … });
  it("Date 객체(따옴표 없는 YAML 날짜)를 거부하고 원인을 안내한다", () => {
    expect(() => requireIsoDate({ updated: new Date() }, "updated", "x.mdx"))
      .toThrow(/따옴표/);
  });
  it("'2026-9-5'처럼 자릿수가 모자란 값을 거부한다", () => { … });
});

describe("requireOneOf", () => {
  it("유니언 밖의 값을 거부하고 허용값 목록을 오류에 담는다", () => { … });
});
```

그리고 **실제 콘텐츠 통합 테스트 3건** — 이게 S6의 진짜 방지선이다:
```ts
// lib/__tests__/articles.test.ts / guide.test.ts / showcase.test.ts 에 각 1건
it("31편 전부가 frontmatter 검증을 통과한다", () => {
  expect(() => getAllArticles()).not.toThrow();
});
```
(`getAllArticles()`를 이미 부르는 테스트가 많아 사실상 커버되지만, **실패했을 때 무엇이 깨졌는지 즉시 읽히는 이름의 테스트가 하나 있어야 한다.**)

---

## S7. 라이선스

### 판단 — **저장소 코드와 콘텐츠의 라이선스는 달라야 한다.**

근거:
1. 저장소가 **공개**다(`github.com/jaeho9158/yeongulab`). 라이선스가 없는 공개 저장소는 "모든 권리 유보"이며, 포크·기여·인용이 전부 회색지대다.
2. 코드(`app/`·`lib/`·`components/`)와 콘텐츠(`content/`)는 **재사용 양상이 정반대**다. 코드는 남이 가져다 쓰든 상업적으로 쓰든 이 사이트에 손해가 없다. 콘텐츠는 통째로 긁어 광고 사이트를 복제하면 **직접 경쟁자가 된다** — 이 사이트가 애드센스로 운영비를 대는 구조라 더 그렇다.
3. 그러면서도 **교사의 인쇄·재구성은 적극 허용해야 한다** — A6(인쇄 스타일)·I1(`/teacher`)이 그 방향이고, 이미 `/guide/print`가 존재한다.

### 권고안

| 대상 | 라이선스 | 파일 |
| --- | --- | --- |
| 코드 (`app/` `lib/` `components/` `scripts/` 설정) | **MIT** | `/LICENSE` |
| 콘텐츠 (`content/guide/**` `content/articles/**`) | **CC BY-NC-SA 4.0** | `/LICENSE-CONTENT.md` |
| 사례 (`content/showcase/**`) | **투고자 보유. 게재 허락만.** | 같은 파일에 예외 조항 |

### 운영자가 결정할 것 vs 내가 추천하는 것

**내 추천 (근거가 있고 되돌리기 쉬움)**
- 코드 MIT — 이 저장소에 영업비밀이 없고, MIT가 가장 마찰이 적다.
- 콘텐츠에 **BY(출처 표기)** — 이건 논쟁의 여지가 없다.
- 사례 **제외** — 학생이 보낸 글의 저작권을 운영자가 CC로 재배포 허가할 권한이 없다. `ResearchShowcaseForm`은 투고 동의 문구를 아직 안 받고 있으므로 **지금은 반드시 제외해야 한다.** (T7이 출처 필드를 넣을 때 동의 필드를 함께 설계하는 것이 옳고, 그 전까지는 "게재 허락만 받았다"가 사실이다.)

**운영자 판단 (내가 정하면 안 되는 것)**
1. **NC를 붙일 것인가.** NC는 광고 붙은 클론을 막지만, 동시에 CC BY-NC-SA는 오픈 정의(Open Definition)·OSI 기준의 "자유 라이선스"가 **아니다.** 나중에 공공 OER 목록이나 교육청 자료실에 등재하려면 BY-SA여야 하는 경우가 있다. **성장 경로가 "교육기관 채택"이면 BY-SA, "독립 사이트 유지"면 BY-NC-SA다.** 나는 지금 단계에서 BY-NC-SA를 추천한다 — 나중에 NC를 푸는 건 쉽지만 채우는 건 불가능하다.
2. **"비영리"의 경계.** 사교육 학원 수업에서 인쇄해 쓰는 것이 NC 위반인지가 CC의 고전적 회색지대다. **그대로 두면 교사가 물어볼 곳이 없다.** 아래 문안에 명시적 허용 조항을 넣어 이 모호함을 운영자에게 유리한 쪽이 아니라 **교사에게 유리한 쪽으로** 해소했다. 이 조항을 넣을지가 운영자 판단이다.
3. **저작권자 표기 주체** — `황재호` 개인인가 `지니어스 클럽`인가. **E4(팀명 복원 여부)와 같은 결정이다.** LICENSE에 이름을 박기 전에 E4를 먼저 정해야 한다. 아래 문안은 `lib/site.ts`의 `OPERATOR.name`을 그대로 쓰는 형태로 뒀다.

### 정확한 문안

**`/LICENSE` (신설)**
```
MIT License

Copyright (c) 2026 황재호

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

이 MIT 라이선스는 **소스 코드에만** 적용됩니다.
`content/` 아래의 글과 사이트에 게시된 본문은 별도 조건을 따릅니다 —
LICENSE-CONTENT.md를 보세요.
```

**`/LICENSE-CONTENT.md` (신설)**
```markdown
# 콘텐츠 라이선스

## 적용 범위

이 문서는 `content/guide/`와 `content/articles/`의 글, 그리고 연구랩
가이드(https://yeongulab.vercel.app)에 게시된 본문·표·체크리스트에
적용됩니다.

**적용되지 않는 것**
- 소스 코드 — MIT (`LICENSE` 참고)
- `content/showcase/`의 연구 사례 — **투고한 학생이 저작권을 보유합니다.**
  연구랩은 게재 허락만 받았으며, 재배포를 허가할 권한이 없습니다.
  사례를 인용하려면 원 투고자의 허락이 필요합니다.
- 글 안에서 출처를 밝혀 인용한 외부 저작물 — 각 원저작물의 조건을 따릅니다.

## 조건 — CC BY-NC-SA 4.0

크리에이티브 커먼즈 저작자표시-비영리-동일조건변경허락 4.0 국제 라이선스
(https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko)

요약하면 이렇습니다.

- **써도 됩니다** — 복사, 인쇄, 배포, 고쳐 쓰기 전부 됩니다. 허락을 따로
  구하지 않아도 됩니다.
- **출처를 밝혀주세요** — "연구랩 가이드(yeongulab.vercel.app)" 정도면
  충분합니다. 고쳐 썼다면 고쳤다고 적어주세요.
- **비영리로만** — 자료 자체를 팔거나, 이 글로 광고 수익을 내는 사이트를
  만들지 말아주세요.
- **같은 조건으로** — 고쳐 만든 자료를 배포한다면 같은 라이선스로
  공개해주세요.

## 학교·교육 현장에 대한 명시적 허용

위의 "비영리" 조건이 수업 현장에서 애매해지지 않도록, 다음은 **비영리
이용으로 명시적으로 허용**합니다.

- 초·중·고등학교, 대학, 도서관, 청소년 시설에서 수업·동아리·특강 자료로
  인쇄해 나눠주는 것
- 학원·과외를 포함해, **수강료와 별개로 자료를 무상으로 나눠주는 경우**
- 학교 홈페이지·학급 게시판·학습관리시스템에 올리는 것
- 필요한 부분만 잘라 쓰거나 학생 수준에 맞게 고쳐 쓰는 것

허용되지 않는 것은 **자료 자체를 판매하거나, 자료를 재료로 광고 수익을
얻는 것**입니다.

## 문의

판단이 서지 않으면 물어보세요 — jaeho9158@gmail.com.
대부분의 교육 목적 요청은 허락합니다.
```

**푸터 — `components/SiteFooter.tsx:12`**

현재:
```tsx
          <span>© {new Date().getFullYear().toString()} 연구랩 가이드</span>
```

변경 후:
```tsx
          <span>
            © {new Date().getFullYear().toString()} 연구랩 가이드 ·{" "}
            <Link href="/about#license" className="hover:text-ink">
              CC BY-NC-SA 4.0
            </Link>
          </span>
```

**함정**: `:11`의 컨테이너가 `flex flex-wrap items-center justify-between gap-3`이다. 왼쪽 `<span>`이 길어지면 375px에서 오른쪽 링크 5개와 같은 줄에 못 들어가 줄이 하나 는다. **실측 확인 필요** — 이미 `flex-wrap`이라 깨지진 않고 높이만 는다. 거슬리면 `CC BY-NC-SA 4.0` 대신 `이용 조건`으로 줄인다.

**`/about` — `app/about/page.tsx`, "운영 비용과 광고" 절과 "문의" 절 사이에 삽입**

`sed -n '100,145p'` 출력 기준 13행(`</section>`, 광고 절 끝) 뒤, 15행(`<section>` 문의 절) 앞:

```tsx
      <section id="license" className="mt-9 scroll-mt-24 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          가져다 써도 되나요
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          됩니다. 가이드와 자료실의 글은{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            CC BY-NC-SA 4.0
          </a>
          으로 공개합니다. 출처를 밝히고 비영리로 쓴다면 인쇄해 나눠주는 것,
          수업 자료로 고쳐 쓰는 것, 학교 홈페이지에 올리는 것 모두 따로
          허락을 구하지 않아도 됩니다. 고쳐 만든 자료를 배포할 때는 같은
          조건으로 공개해주세요.
        </p>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          학원처럼 수강료를 받는 곳이라도, 자료를 무상으로 나눠주는 것은
          비영리 이용으로 봅니다. 허용하지 않는 것은 자료 자체를 팔거나
          이 글로 광고 수익을 내는 사이트를 만드는 것입니다. 판단이 서지
          않으면 아래로 물어보세요 — 교육 목적이면 대부분 허락합니다.
        </p>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          예외가 둘 있습니다.{" "}
          <Link href="/showcase" className="text-accent hover:underline">
            연구 사례
          </Link>
          는 보내준 학생에게 저작권이 있어 연구랩이 재배포를 허락할 수
          없습니다. 글 안에서 출처를 밝혀 인용한 외부 논문·자료는 각
          원저작물의 조건을 따릅니다. 사이트의 소스 코드는 별도로{" "}
          <a
            href="https://github.com/jaeho9158/yeongulab"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            GitHub
          </a>
          에 MIT 라이선스로 공개돼 있습니다.
        </p>
      </section>
```

### 함정
- **`/showcase`가 0편이면 `notFound()`**다(`app/showcase/page.tsx:18`). `/about`의 링크가 404가 될 수 있다. 지금 6편이라 괜찮지만, `articles.test.ts`의 링크 검증은 **MDX만** 보고 `app/**/*.tsx`의 `<Link>`는 안 본다. S4의 범위다. 여기서는 넘어간다.
- **`/about`에 `id="license"`를 달았으니 `scroll-mt-24`가 필요**하다(헤더 높이 96px). 위 코드에 포함했다.
- **README도 고쳐야 한다.** `README.md:5`가 "Next.js 15"라고 적혀 있는데 실제는 16.3.3이다(`package.json:15`). 라이선스 절을 추가하는 김에 이 한 줄도 고쳐라 — 같은 커밋에 두는 것이 자연스럽다.

### 테스트
없다. **라이선스 파일 존재 여부를 테스트로 잠그는 것은 과하다.** 대신 T11의 배포 후 점검 스크립트가 `/about#license`가 200인지 본다(아래).

---

## T6. sitemap과 robots 상호 검증

### 현재 — `app/robots.ts:10`은 `["/api/", "/guide/print", "/activity"]`를 막고, `app/sitemap.ts`는 그 셋을 넣지 않는다. **지금은 어긋나 있지 않다.** 어긋나면 아무도 모른다는 게 문제다.

한편 `lib/__tests__/articles.test.ts`의 `ALLOWED_PATHS`(실측 `:196-206`)에는 `/activity`가 들어 있다. 이건 **모순이 아니다** — 자료실 본문이 `/activity`로 링크하는 것은 정상이고, 색인만 막는 것이다. 백로그 T6이 "실제로 어긋나 있다"고 쓴 것은 **오독**이다. 대신 `ALLOWED_PATHS`에는 `/guide/print`가 없는데 이건 맞는 상태다.

### 테스트 — `app/__tests__/routes.test.ts` (신설, node 환경)

`sitemap()`·`robots()`는 순수 함수라 그냥 부르면 된다.

```ts
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site";
import { getAllArticles } from "@/lib/articles";
import { getAllShowcases } from "@/lib/showcase";
import { getAllStages } from "@/lib/guide";

const urls = sitemap().map((e) => e.url);
const paths = urls.map((u) => u.slice(SITE_URL.length) || "/");
const { rules, sitemap: sitemapUrl } = robots();
const disallow = Array.isArray(rules) ? [] : ([rules.disallow].flat().filter(Boolean) as string[]);
```

```ts
it("robots가 막은 경로는 sitemap에 없다", () => {
  // paths 중 disallow의 어느 항목으로 시작하는 것이 하나도 없어야 한다.
  // "/api/"처럼 슬래시로 끝나는 항목은 접두사, "/activity"처럼 아닌 항목은
  // 완전 일치 또는 그 하위 경로.
});

it("모든 sitemap URL이 SITE_URL로 시작하고 중복이 없다", () => {
  expect(new Set(urls).size).toBe(urls.length);
});

it("모든 sitemap URL에 후행 슬래시가 없다", () => {
  // canonical(alternates.canonical: "./")과 어긋나면 중복 색인이 된다
});

it("자료실 31편·단계 6편·사례 6편이 전부 sitemap에 있다", () => {
  for (const a of getAllArticles()) expect(paths).toContain(`/articles/${a.slug}`);
  for (const s of getAllStages()) expect(paths).toContain(`/guide/${s.slug}`);
  for (const s of getAllShowcases()) expect(paths).toContain(`/showcase/${s.slug}`);
});

it("색인 대상이 아니라고 정한 세 경로가 sitemap에 없다", () => {
  expect(paths).not.toContain("/activity");
  expect(paths).not.toContain("/guide/print");
  expect(paths.some((p) => p.startsWith("/api/"))).toBe(false);
});

it("robots가 sitemap.xml을 SITE_URL 기준으로 가리킨다", () => {
  expect(sitemapUrl).toBe(`${SITE_URL}/sitemap.xml`);
});

it("모든 정적 라우트가 sitemap에 있거나 robots에서 막혀 있다", () => {
  // app/ 아래 page.tsx를 재귀 수집 → 동적 세그먼트([slug]) 제외 →
  // 각 경로가 paths에 있거나 disallow에 걸리는지 확인.
  // 이게 T6의 핵심이다 — 새 라우트를 만들면 둘 중 하나를 반드시 정하게 된다.
});
```

**마지막 것이 T6의 진짜 값이다.** 이걸 넣으면 지금 상태에서 `/` `/about` `/articles` `/example` `/guide` `/privacy` `/showcase` `/tools`는 sitemap에 있고, `/activity` `/guide/print`는 disallow에 걸려 **전부 통과한다** (확인함).

### 함정
- **`app/sitemap.ts`가 모듈 로드 시점에 `const lastModified = new Date()`를 실행한다**(`:8`). 테스트가 이 모듈을 import하는 것만으로 문제는 없지만, A2가 이걸 문서별 날짜로 바꾸면 이 테스트에 `lastModified` 검사를 추가해야 한다. **T6은 A2의 방지선이므로 A2 착수 전에 들어가야 한다.**
- `robots()`의 반환 타입에서 `rules`는 객체이거나 배열이다. **타입 좁히기를 빼먹으면 `tsc`가 죽는다.** 위 코드에 넣어뒀다.
- `sitemap()`은 `getAllArticles()`를 부르므로 **`content/` 디렉터리를 읽는 통합 테스트**다. `ogFont.test.ts`·`articles.test.ts`와 같은 성격이므로 새로운 부담은 아니다.
- `app/__tests__/`는 vitest 기본 `include`(`**/*.{test,spec}.?(c|m)[jt]s?(x)`)에 잡힌다. **설정 변경 불필요.** 다만 `app/` 아래에 테스트가 생기면 Next.js가 라우트로 오해할 수 있다 — `__tests__` 디렉터리는 `page.tsx`/`route.ts`가 없으므로 라우트가 되지 않는다. **안전하다.** (더 안전하게 가려면 `lib/__tests__/appRoutes.test.ts`로 두고 `@/app/sitemap`을 import해도 된다. **구현 시 판단 — 나는 `app/__tests__/`를 권한다. 대상 옆에 두는 편이 찾기 쉽다.**)

---

## T10. 외부 링크 감시

### 실측 — 외부 URL 전수 (테스트 픽스처·API 엔드포인트·템플릿 리터럴 제외)

| URL | 위치 |
| --- | --- |
| `https://emerginginvestigators.org` | `components/SubmissionVenues.tsx:26` |
| `https://ijhsr.terrajournals.org` | `:36` |
| `https://www.curieuxacademicjournal.com` | `:46` |
| `https://humantech.samsung.com` | `:56` |
| `https://www.science.go.kr/mps/1078/bbs/157/moveBbsNttList.do` | `:67` |
| `https://www.scienceall.com` | `:88` |
| `https://termglossary.kr/index.html` | `lib/site.ts:35`, `content/articles/05-reading-english-papers.mdx:105` |
| `https://doi.org/10.1126/science.aac4716` | `content/articles/22-replication-is-research.mdx:28` |
| `https://policies.google.com/technologies/ads` | `app/privacy/page.tsx:94` |

백로그의 "7개"는 앞 7행이다. 뒤 둘도 부패 대상이므로 **9개를 본다.**

### 신규 `scripts/linkcheck.mts`

```ts
/**
 * 외부 링크 상태 점검 — `npm run linkcheck`
 *
 * **테스트 스위트에 넣지 않는다.** 네트워크 의존 테스트는 상대 사이트의
 * 점검이나 일시적 장애로 CI를 빨갛게 만들고, 그러면 사람이 빨간 CI를
 * 무시하기 시작한다. 필요할 때 손으로 돌리는 별도 스크립트로 둔다.
 *
 * 대상 URL은 하드코딩하지 않고 소스에서 뽑는다 — 하드코딩하면 링크를
 * 추가할 때 이 파일을 잊는다.
 */
```

동작:
1. `content/**/*.mdx` + `components/**/*.tsx` + `lib/**/*.ts` + `app/**/*.tsx`(단 `__tests__` 제외)에서 `https?://` URL을 정규식으로 수집.
2. 제외 목록: `${`가 포함된 것(템플릿 리터럴), `example.org`·`openalex.org/W1`·`doi.org/10.1/`(테스트 픽스처), `schema.org`(JSON-LD 네임스페이스, HTTP 요청 대상 아님), 자기 자신(`SITE_URL`), 광고·분석 스크립트 엔드포인트(`googlesyndication`·`googletagmanager`), API 엔드포인트(`api.crossref.org`·`api.openalex.org`·`api.semanticscholar.org` — 쿼리 없이 부르면 400이 정상이라 신호가 안 된다).
3. 각 URL에 `HEAD` 요청 (10초 타임아웃, `User-Agent`를 브라우저 문자열로 — **`science.go.kr`류 정부 사이트가 기본 UA를 막는 경우가 흔하다**). `405`/`403`이면 `GET`으로 재시도.
4. 출력: `OK 200  https://…` / `FAIL 404  https://… ← components/SubmissionVenues.tsx:26`
5. **종료 코드**: 하나라도 4xx/5xx/네트워크 실패면 `1`.

`package.json:11` 뒤에 추가:
```json
    "linkcheck": "node --no-warnings=MODULE_TYPELESS_PACKAGE_JSON scripts/linkcheck.mts",
```
(`og-font` 스크립트와 같은 실행 방식을 그대로 따른다.)

### 함정
- **`301`/`302`는 실패가 아니다.** `fetch`는 기본으로 따라간다. 최종 상태만 본다. 다만 **`www.scienceall.com`처럼 리다이렉트로 도메인이 통째로 바뀌면 링크가 살아 있어도 낡은 것**이다 — 최종 URL이 원 URL과 호스트가 다르면 `WARN`으로 찍고 종료 코드에는 반영하지 않는다.
- **`termglossary.kr`이 두 곳에 하드코딩**돼 있다(`lib/site.ts:35`, `05-reading-english-papers.mdx:105`). 스크립트는 둘 다 잡고 같은 URL을 두 번 친다 — 중복 제거하되 **출처는 전부 출력**해야 고칠 곳을 안다.
- 이 스크립트가 잡을 수 없는 것: `content/articles/31-finding-calls.mdx:32`의 `` `kosac.re.kr` ``처럼 **백틱 안의 맨 도메인**. `31-finding-calls.mdx`가 스스로 "공식 도메인이 매년 바뀌기 쉬우므로"라고 경고한 바로 그 대상이다. **구현 시 판단 필요** — 백틱 도메인까지 잡으려면 `` `([a-z0-9.-]+\.(?:kr|com|org|go\.kr))` `` 같은 정규식이 필요하고 오탐이 는다(`raw/` 폴더명 등). 나는 **1차에서는 넣지 말고, `31-finding-calls.mdx`만 예외적으로 수동 점검 대상으로 T11 문서에 적어 두기**를 권한다.

---

## T11. 배포 후 점검

### 신규 `scripts/postdeploy.mts` — `npm run postdeploy [-- --base https://…]`

**기본 base URL**: `process.env.DEPLOY_URL` → `SITE_URL` 순.

### 체크 목록 (확정)

| # | 확인 | 실패 조건 | 종료코드 반영 |
| --- | --- | --- | --- |
| 1 | `GET {base}/sitemap.xml` | 200이 아니거나 `Content-Type`에 `xml`이 없음 | ✅ 치명 (이후 전부 건너뜀) |
| 2 | sitemap XML의 `<loc>` 파싱 | `<loc>` 0개 | ✅ 치명 |
| 3 | sitemap URL 전수 (현재 46개: `/`·`/guide`·`/privacy`·`/example`·단계6·`/tools`·`/articles`·글31·`/about`·`/showcase`·사례6) `HEAD` | 200이 아닌 것이 하나라도 있음 | ✅ |
| 4 | sitemap 각 URL의 호스트가 base와 동일 | 다른 호스트 (환경변수 오설정으로 프리뷰 URL이 새는 사고) | ✅ |
| 5 | `GET {base}/robots.txt` | 200이 아님 / `Sitemap:` 줄이 없음 / 그 줄의 URL이 체크1과 다름 | ✅ |
| 6 | `GET {base}/ads.txt` | 200이 아님 | ✅ (애드센스 재검토 중이라 치명) |
| 7 | OG 이미지 — `{base}/opengraph-image` + 단계 6개 `{base}/guide/{slug}/opengraph-image` + 글 3편 표본 + 사례 1편 | 200이 아니거나 `Content-Type`이 `image/`로 시작하지 않거나 본문 길이 < 1KB | ✅ |
| 8 | 홈 HTML에 AdSense 로더 `<script>` 존재 | `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=` 문자열이 없음 (소유권 확인이 깨진 상태) | ✅ |
| 9 | 홈 HTML에 naver-site-verification meta 존재 | 없음 | ⚠️ 경고만 |
| 10 | 각 페이지 HTML의 `<link rel="canonical">`가 자기 URL과 일치 (표본 5개) | 불일치 | ✅ |
| 11 | `{base}/activity`·`{base}/guide/print`가 200이면서 **sitemap에 없음** | 200이 아니면 실패(페이지가 죽었다는 뜻) | ✅ |
| 12 | 광고 없어야 할 페이지에 `adsbygoogle` `<ins>` 없음 — `/activity`, `/guide/print`, `{base}/존재하지-않는-경로`(404) | `class="adsbygoogle` 문자열이 HTML에 있음 | ✅ **O5의 배포 측 방지선** |
| 13 | 광고 있어야 할 페이지에 `<ins class="adsbygoogle"` 존재 — `/guide/topic`, `/articles/{첫 글}`, `/example` | 없음. **단, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 미설정이면 `AdSlot`이 `null`을 내므로 이 검사는 건너뛴다** | ⚠️ (E3 결정 전까지 SKIP) |
| 14 | `{base}/존재하지-않는-경로` | 200을 반환 (soft 404) | ✅ |
| 15 | `{base}/api/search-papers?q=` (빈 쿼리) | 400이 아님 | ⚠️ 경고 |
| 16 | `{base}/about#license` 즉 `/about` HTML | `id="license"` 문자열 없음 (S7이 들어간 뒤) | ⚠️ |

### 출력

```
연구랩 배포 후 점검 — https://yeongulab.vercel.app  (2026-09-05 14:03 KST)

  ✔  sitemap.xml            200, 46 URL
  ✔  sitemap URL 46개       전부 200
  ✔  robots.txt             200, Sitemap 일치
  ✔  ads.txt                200
  ✔  OG 이미지 11개         전부 image/png
  ✔  AdSense 로더           홈 HTML에 존재
  ✔  광고 금지 3면          adsbygoogle 없음
  ⏭  광고 게재 3면          SKIP (NEXT_PUBLIC_ADSENSE_CLIENT_ID 미설정)
  ✔  404                    404 반환
  ⚠  naver 인증 meta        (경고 내용)

실패 0 · 경고 1 · 건너뜀 1

── 색인 요청은 자동으로 하지 않습니다 ──
이번 배포에서 sitemap에 새로 들어온 URL:
  (없음 / 또는 목록)
Search Console 할당량은 하루 10~12건입니다. 위 목록에서 사람이 우선순위를 정하세요.
```

**"새로 들어온 URL"** 은 이전 실행 결과를 `.postdeploy-urls.json`(gitignore)에 저장해 diff한다. **자동 제출은 하지 않는다** — 백로그 T11이 못 박은 대로.

### 함정
1. **`curl`류로 치면 403이 온다.** 프로젝트 메모에 이미 기록된 함정이다(Vercel DDoS 챌린지). `fetch`에 실제 브라우저 `User-Agent`를 붙여야 한다. **이걸 빠뜨리면 스크립트가 전부 빨갛게 나오고 사람이 스크립트를 안 믿게 된다. 최우선 함정이다.**
2. **동시 요청 수를 제한하라.** 46 URL + OG 11개를 한꺼번에 치면 Vercel이 레이트리밋한다. 동시 6개 정도로 큐잉.
3. **OG 이미지는 `HEAD`가 아니라 `GET`이어야 한다** — `next/og`의 동적 라우트가 `HEAD`에 제대로 응답하지 않는 경우가 있다. 본문 길이를 재려면 어차피 `GET`이 필요하다.
4. **체크 12가 O5의 유일한 실배포 검증이다.** 단위 테스트(`adRails.test.ts`)는 소스만 보고, 이건 렌더 결과를 본다. 둘 다 있어야 한다.
5. **`ads.txt`는 `public/ads.txt`에 있다**(커밋 `0f8e0eb`). 경로를 `/ads.txt`로 확인.
6. `package.json`에 `"postdeploy"`라는 이름을 쓰면 **npm 라이프사이클 훅으로 오해될 수 있다** — `pre`/`post` 접두사는 npm이 자동 실행한다. `npm run deploy`가 없으므로 실제 충돌은 없지만, **`"check:deploy"`로 이름 짓는 편이 안전하다.** 권고: `"check:deploy"`.

---

## T12. `MAINTENANCE_REPORT.md`

### 실제로 읽은 결과 — 143줄, 8단계 작업 로그 (2026-08-29 하루)

**흡수할 것 (백로그에 없거나, 이 문서에만 있는 사실)**

| 내용 | 위치 | 어디로 |
| --- | --- | --- |
| **major 업그레이드 3건의 실패 이유** — TS 7은 typescript-eslint 미지원, eslint 10은 eslint-config-next 규칙 크래시, `@types/node`는 24가 맞다(Vercel 런타임 24.x, 26은 불일치) | `:124` | **백로그 `[?]` 운영자 판단 대기 절에 신규 항목.** 이건 "언제 재시도할지"의 조건이 붙은 판단 대기다. 지금 메모리에 "TS7/eslint10 대기"로만 남아 있고 **이유가 어디에도 없다.** 이유가 사라지면 6개월 뒤 누군가 다시 시도해서 같은 시간을 태운다. |
| **의도적으로 하지 않기로 한 것 + 사유** — API 레이트리밋 부재·CSP 부재(무로그인 공개 사이트 + AdSense 트레이드오프), Semantic Scholar 무인증 429는 알려진 특성(키 등록 대기) | `:141` | **백로그 `F. 제약 위반 확인 (재제안 금지)` 절.** 정확히 그 절의 목적이다. 지금 백로그를 읽는 사람은 "CSP를 넣자"를 다시 제안하게 된다. |
| **`#4 부분 완료(판단)`** — SimpleChart의 SVG 분기 분할은 "공유 레이아웃 수식과 강결합이라 회귀 위험 > 이득"으로 하지 않았다 | `:123` | **백로그 `F` 절.** O3(차트 색)이 이 파일을 만질 때 이 판단을 알아야 한다. |
| **`#8` 스크롤 기준선** — `ANCHOR_SCROLL_MARGIN_PX`와 `scroll-mt-24`가 두 곳에 결합돼 있다 | `:119` | 코드 주석에 이미 있다(확인함). **버린다.** |
| `npm audit` 0건 (2026-08-29 기준) | `:22` | 날짜가 붙은 스냅샷이라 곧 낡는다. **버린다** — T11/CI가 대신할 일이다. |

**버릴 것**
- 1~8단계의 작업 서술 전부 (`:19-143`의 대부분). **이건 git 로그가 하는 일이다.** 커밋 5개·12파일·"vitest 63건 통과"류의 수치는 그 시점의 스냅샷이고 지금은 106건이며 곧 또 바뀐다. 두 번째 진실 원본이 되는 지점이 정확히 여기다.
- 부채 표 10건(`:45-56`) — **10건 중 9건이 이미 처리됐다**(`:113`·`:115`·`:126`). 남은 것은 `#3`(StatsCalculator 314줄)·`#4`(SimpleChart) 두 개인데 둘 다 "판단상 하지 않기로 함"으로 종결됐다. **표 전체를 버린다.**
- 3단계 테스트 배치 표(`:64-73`) — 테스트 파일이 그 자체로 진실이다.
- 4단계 계획 A·B·C(`:76-96`) — `:98-104`에서 **전부 실행 완료**됐다. 완료된 계획서다.

### 실행 절차 (삭제는 하지 않는다)

1. `docs/feature-backlog.md`의 `F. 제약 위반 확인 (재제안 금지)` 절(`:255`)에 3항목 추가.
2. 같은 파일 `E. 운영자 판단 대기 [?]` 절(`:243`)에 `E6. major 업그레이드 3건 재시도 조건` 추가. `docs/backlog-index.md`의 `[?]` 표에도 한 줄.
3. `MAINTENANCE_REPORT.md`를 **`docs/maintenance-2026-08-29.md`로 이동**(`git mv`)하고, 파일 맨 위에 헤더 삽입:

```markdown
> **보존 문서 — 갱신하지 않는다.**
> 2026-08-29 하루의 유지보수 작업 기록이다. 이 문서의 판단 중 아직 유효한 것은
> `docs/feature-backlog.md`의 F절(재제안 금지)과 E절(운영자 판단 대기)로 옮겼다.
> 현재 상태를 알고 싶으면 `docs/backlog-index.md`를 보라.
> 이 파일은 "왜 그때 그렇게 했나"의 사료로만 남긴다.
```

4. `README.md`에 `docs/` 안내 한 줄 — 어느 문서가 진실 원본인지가 저장소 첫 화면에서 보여야 한다:

```markdown
## 문서

- `docs/backlog-index.md` — **현재 상태의 진실 원본.** 판정된 159건 색인
- `docs/feature-backlog.md` — 상세 근거
- `docs/impl-plan-batch0.md` 등 `impl-plan-*` — 묶음별 구현 설계
- `docs/maintenance-2026-08-29.md` — 보존 문서(갱신하지 않음)
```

5. **삭제는 실행하지 않는다.** 운영자가 "3번의 이동 대신 삭제"를 원하면 `git rm` 한 줄이다. 이동해두면 `git log --follow`가 이어지므로 이동 쪽이 낫다는 것이 내 추천이지만, **결정은 운영자 몫이다.**

### 함정
- `MAINTENANCE_REPORT.md`를 참조하는 곳이 있는지 확인: `grep -rn "MAINTENANCE_REPORT" --exclude-dir=node_modules .` — 확인한 범위에서는 `docs/feature-backlog.md:1437`(T12 항목 자신)뿐이다. **구현 시 재확인.**
- 이동하면 `docs/`에 파일이 7개가 된다. `docs/articles-content-plan.md`·`docs/articles-taxonomy-design.md`가 **아직 커밋되지 않은 상태**(git status)다. T12 커밋에 딸려 들어가지 않게 `git add`를 명시적으로 하라.

---

# 파트 3 — 묶음 1 (앵커 연결)

## A1 · G1 · O7을 한 커밋에 둘 것인가 — **둔다.**

셋은 같은 한 줄 `` `/guide/${stage}#tool-${TOOL_IDS[title]}` ``의 세 발신처다. 확인한 사실:
- 앵커는 실재한다 — `components/StageTools.tsx:158` `id={`tool-${TOOL_IDS[title]}`}`
- 해시 딥링크 처리도 실재한다 — `:140-142`가 `#tool-xxx`를 읽어 그 도구를 펼친다
- `TOOL_IDS`는 `satisfies Record<ToolTitle, string>`(`:121`)이라 **오타가 컴파일에서 잡힌다**
- `content/articles/23-public-data-topics.mdx:109`가 **이미** `/guide/writing#tool-citation`을 쓰고 있다 — 자료실 본문은 이 패턴을 이미 안다. 앱 코드만 모른다

한 커밋에 두는 이유: 이 커밋의 실체는 **공용 헬퍼 `toolHref()`의 도입**이고, 호출부가 하나뿐인 헬퍼는 리뷰에서 정당화되지 않는다. 셋을 나누면 첫 커밋이 "쓰이지도 않는 추상"으로 보인다.

**분할 옵션**: O7만 떼도 된다(다른 파일 + 새 UI + 새 테스트). 하지만 `A1+G1`만 나가면 헬퍼가 두 곳에서만 쓰이고, O7이 나중에 세 번째 호출부를 붙일 때 리뷰어가 헬퍼를 다시 읽어야 한다. **셋을 권한다.**

### 공용 헬퍼 — `lib/stageToolMeta.ts:121` 뒤에 추가

```ts
/**
 * 도구 하나로 직접 가는 링크.
 *
 * components/StageTools.tsx:158이 각 도구에 `tool-{id}` 앵커를 달고,
 * :140-142가 그 해시를 읽어 해당 아코디언을 펼친다. 이 함수는 그 계약의
 * 발신 쪽이다 — 링크 형식이 한 곳에만 있어야 앵커 규약을 바꿀 때
 * `#tools`로 되돌아가는 회귀가 안 생긴다.
 *
 * 제목이 ToolTitle 유니온이라 오타는 컴파일에서 잡힌다.
 */
export function toolHref(stage: StageSlug, title: ToolTitle): string {
  return `/guide/${stage}#tool-${TOOL_IDS[title]}`;
}

/**
 * 그 도구가 실제로 있는 단계 중 첫 번째.
 * "내 레퍼런스 목록"처럼 두 단계에 있는 도구는 앞선 단계로 보낸다 —
 * 처음 만나는 곳이 맥락상 자연스럽다.
 */
export function primaryStageOf(title: ToolTitle): StageSlug {
  const stage = STAGE_SLUGS.find((s) =>
    (STAGE_TOOL_TITLES[s] as readonly string[]).includes(title),
  );
  // satisfies Record<ToolTitle, string>이 TOOL_IDS의 전수성을 보장하지만,
  // STAGE_TOOL_TITLES에서의 역방향은 타입으로 표현되지 않아 런타임 가드를 둔다.
  if (!stage) throw new Error(`도구 "${title}"이 어느 단계에도 없습니다`);
  return stage;
}
```

---

## A1. `/tools` 색인 → 실제 앵커

### 현재 — `app/tools/page.tsx:85-88`

```tsx
                  <Link
                    href={`/guide/${stage.slug}#tools`}
                    className="group block py-4"
                  >
```

### 변경 후

```tsx
                  <Link
                    href={toolHref(stage.slug, title)}
                    className="group block py-4"
                  >
```

`:71`의 `if (!isStageSlug(stage.slug)) return null;` 가드가 이미 있으므로 `stage.slug`는 `StageSlug`로 좁혀져 있다. `title`은 `titles`(`:72`, `STAGE_TOOL_TITLES[stage.slug]`)의 원소라 `ToolTitle`이다. **캐스트 불필요.**

`:9`의 import에 `toolHref` 추가.

### 사과 문단 삭제 — `app/tools/page.tsx:59-67`

```tsx
      {/* 아코디언(components/StageTools.tsx)은 open={i === 0}으로 첫 도구만
          펼친다. #tools 앵커는 목록 맨 위로만 데려다주므로 "누르면 그 도구가
          펼쳐진다"고 쓰면 사실과 달라진다 — 실제 동작 그대로 안내한다. */}
      <p className="mt-3 text-[17px] leading-[1.7] text-ink-soft">
        각 도구는 해당 연구 단계 페이지의 접이식 목록 안에 있습니다. 아래
        링크를 누르면 그 단계의 도구 목록으로 이동하고, 펼쳐진 것은 목록의 첫
        도구이니 원하는 도구는 제목을 눌러 펼치면 됩니다. 일부 도구는 여러
        단계에서 함께 쓰입니다.
      </p>
```

교체:

```tsx
      {/* StageTools.tsx:140-142가 #tool-{id} 해시를 읽어 그 도구를 펼친다.
          이제 이 페이지의 링크가 그 앵커를 쓰므로, 누르면 실제로 그 도구가
          열린 상태로 도착한다 — 아래 문장은 그 동작 그대로다. */}
      <p className="mt-3 text-[17px] leading-[1.7] text-ink-soft">
        각 도구는 해당 연구 단계 페이지 안에 있습니다. 아래 링크를 누르면
        그 도구가 펼쳐진 상태로 열립니다. 일부 도구는 여러 단계에서 함께
        쓰입니다.
      </p>
```

### `/showcase` — `app/showcase/page.tsx:50-55`

```tsx
          <Link
            href="/guide/submission#tools"
            className="text-accent hover:underline"
          >
            6단계의 &lsquo;내 연구 사례 나누기&rsquo;
          </Link>
```
→
```tsx
          <Link
            href={toolHref("submission", "내 연구 사례 나누기")}
            className="text-accent hover:underline"
          >
            6단계의 &lsquo;내 연구 사례 나누기&rsquo;
          </Link>
```
`import { toolHref } from "@/lib/stageToolMeta";` 추가.

### 함정
- **`#tools` 앵커가 아예 사라지는 것은 아니다.** `StageTools.tsx:149`의 `<section id="tools">`는 그대로 있고, `content/guide/*.mdx` 본문의 "위 도구" 문장들도 유지된다. **`grep -rn "#tools" app/ components/ content/`로 남은 사용처를 확인**하되, 전부 없앨 필요는 없다.
- `StageTools.tsx:140-142`의 해시 읽기는 **마운트 시점 1회**로 보인다(`useSeededState` 패턴). `/tools`에서 같은 단계의 **다른 도구**로 연속 클릭하면(클라이언트 네비게이션, 같은 라우트, 해시만 변경) 아코디언이 다시 안 펼쳐질 수 있다. **구현 시 실제로 눌러 확인할 것.** 깨지면 `StageTools`에 `hashchange` 리스너나 `usePathname`+`window.location.hash` 재구독이 필요하다 — 그건 별도 항목이지 A1의 범위가 아니다. **이 라운드에서 발견되면 백로그에 신규 항목으로 올려라.**

### 테스트
백로그의 "추가 테스트 불필요"는 절반만 맞다. 타입이 오타를 막지만 **`#tools`로 되돌아가는 회귀는 못 막는다.** 한 건 추가:

```ts
// lib/__tests__/stageToolMeta.test.ts 에 describe("toolHref") 추가
it("도구 앵커 링크는 /guide/{stage}#tool-{id} 형식이다", () => {
  expect(toolHref("writing", "간이 통계 계산기")).toBe("/guide/writing#tool-stats");
});
it("모든 도구가 자기 단계에서 유효한 링크를 만든다", () => {
  for (const stage of STAGE_SLUGS)
    for (const title of STAGE_TOOL_TITLES[stage])
      expect(toolHref(stage, title)).toMatch(/^\/guide\/[a-z-]+#tool-[a-z-]+$/);
});
it("primaryStageOf는 여러 단계에 있는 도구를 앞선 단계로 보낸다", () => {
  expect(primaryStageOf("내 레퍼런스 목록")).toBe("prior-research");
});
```

```ts
// app/__tests__/toolLinks.test.ts (신설)
it("앱 코드에 #tools로 끝나는 도구 링크가 남아 있지 않다", () => {
  // app/**/*.tsx에서 /["`']\/guide\/[^"`']*#tools["`']/ 가 0건
});
```

---

## G1. `/example`의 도구 이름 8개

### 실측 — 8곳 (백로그의 168·176·269·288·341·345·349는 **하나가 틀렸다**. `:288`이 아니라 **`:289`**이고, `:239`가 누락됐다)

| 줄 | 현재 텍스트 | 단계 | 도구 |
| --- | --- | --- | --- |
| `:168` | `목적 진술 (&lsquo;목적 진술 만들어보기&rsquo; 도구 사용)` | methodology | `purpose` |
| `:176` | `변수 표 (&lsquo;변수 정의표 만들기&rsquo; 도구로 복사한 형식)` | methodology | `variables` |
| `:239` | `&lsquo;표본 크기 계산기&rsquo;는 설문·비율 조사용이라…` | data-collection | `sample-size` |
| `:269` | `&lsquo;간이 통계 계산기&rsquo;로 독립표본 t-검정을…` | writing | `stats` |
| `:289` | `집단별 평균은 &lsquo;간이 차트 그리기&rsquo;로…` | writing | `chart` |
| `:337` | `&lsquo;투고처 후보 모음&rsquo;에서 청소년 연구를…` | submission | `venues` |
| `:341` | `(&lsquo;분량 체크기&rsquo; 사용)` | submission→**writing** | `length` |
| `:345-346` | `(&lsquo;AI 활용 disclosure 문구 만들기&rsquo; 사용)` | submission | `ai-disclosure` |
| `:349` | `(&lsquo;예상 질문 뽑기&rsquo; 사용)` | submission | `questions` |

**9곳이다.** 백로그의 "8번"은 `:239`를 셌는지 안 셌는지가 불분명한데, 실측 결과 `&lsquo;…&rsquo;`로 감싼 도구 이름은 위 9개다(`:116-117`·`:126`의 키워드 따옴표는 도구가 아니다).

### 변경 패턴 — 신규 로컬 컴포넌트 (`app/example/page.tsx`의 `FictionNotice` 위)

```tsx
import { primaryStageOf, toolHref, type ToolTitle } from "@/lib/stageToolMeta";

/**
 * 본문에서 도구 이름을 그 도구로 바로 가는 링크로 만든다.
 * 따옴표까지 링크에 포함시켜 "‘목적 진술 만들어보기’" 전체가 클릭 대상이 되게
 * 한다 — 따옴표 밖에 링크를 두면 터치 대상이 좁아진다.
 */
function ToolLink({ title }: { title: ToolTitle }) {
  return (
    <Link
      href={toolHref(primaryStageOf(title), title)}
      className="text-accent hover:underline"
    >
      &lsquo;{title}&rsquo;
    </Link>
  );
}
```

각 자리 교체 예 (`:168`):
```tsx
          목적 진술 (<ToolLink title="목적 진술 만들어보기" /> 도구 사용)
```
`:341`:
```tsx
          <li>✔ 투고 규정의 분량·형식 요건 확인 (<ToolLink title="분량 체크기" /> 사용)</li>
```

### 함정 — 이것이 G1의 핵심 함정이다

1. **`:341`의 '분량 체크기'는 6단계 절 안에 있는데 실제로는 writing 단계 도구다.** `primaryStageOf("분량 체크기")` → `"writing"`. 그래서 6단계 문맥에서 5단계 페이지로 보낸다. **이게 맞다** — 도구가 실제로 있는 곳이 그곳이다. 하지만 독자에게는 "왜 5단계로 가지?"가 된다. **구현 시 판단 필요**: 그대로 두거나(권고), 이 한 곳만 문장을 `(5단계 도구 '분량 체크기' 사용)`으로 고친다.
2. **`:239`는 링크를 걸면 안 될 수도 있다.** 문장이 "'표본 크기 계산기'는 … 쓸 수 없었습니다"다. **도구가 못 하는 일을 말하는 자리에 그 도구로 가는 링크를 거는 것은 이상하다.** 게다가 H1(표본 크기 계산기에 두 집단 평균 비교 모드)이 채택돼 있고, **백로그가 "`/example`이 그 무능을 서사로 박아뒀다"고 지목한 바로 그 문장**이다. H1이 구현되면 이 문단 전체를 다시 써야 한다. **권고: `:239`는 이번에 건드리지 마라.** G1을 8곳으로 하고, `:239`를 H1의 연쇄 수정 대상으로 백로그에 명시하라(Y12가 이미 H1의 연쇄 대상 줄 번호를 정정하는 항목이므로 **거기에 `app/example/page.tsx:239`를 추가**한다).
3. **`ToolTitle`이 유니온이라 `title="분량 체크기"`의 오타는 컴파일 에러다** — 이게 G1의 최대 이점이다. 반대로 **도구 제목이 바뀌면 이 파일 8곳이 전부 컴파일 에러가 된다.** 그게 의도한 동작이다(지금은 조용히 틀린 텍스트가 남는다).
4. `&lsquo;`/`&rsquo;`를 JSX 문자열이 아니라 컴포넌트 안에서 렌더하므로 **본문 문자열에서 이 엔티티가 사라진다.** 검색·grep 대상이 바뀌니 다른 곳에서 `&lsquo;표본` 같은 문자열을 찾는 코드가 없는지 확인 — 없다(확인함).

### 테스트

```ts
// app/__tests__/toolLinks.test.ts 에 추가
it("/example이 인용하는 도구 이름이 전부 실재하는 ToolTitle이다", () => {
  // app/example/page.tsx 소스에서 /<ToolLink title="([^"]+)"/g 를 수집하고
  // 각각이 TOOL_IDS의 키인지 확인. 타입이 이미 막지만, 누군가
  // ToolLink 대신 다시 생짜 텍스트를 넣는 회귀를 함께 잡는다.
});
it("/example 본문에 링크되지 않은 도구 이름이 남아 있지 않다", () => {
  // 소스에서 /&lsquo;([^&]+)&rsquo;/g 를 전부 뽑아, 그것이 ToolTitle이면
  // 실패시킨다(ToolLink가 렌더하는 것은 소스에 이 엔티티로 안 남는다).
  // 예외 허용 목록: :239 "표본 크기 계산기" (H1 대기 — 사유 주석 필수)
});
```

두 번째가 진짜 방지선이다. 도구 이름을 본문에 새로 쓰면 실패한다.

---

## O7. 자료실 상세 → 도구

### 현재 — `app/articles/[slug]/page.tsx:152-167`이 "이어지는 단계" 하나, `:169-183`이 "다른 문서" 3편. 도구로 가는 길 0개.

### 변경 — `:167`(stage 블록 종료) 뒤, `:169`(다른 문서) 앞

```tsx
      {stage && isStageSlug(stage.slug) && (
        <div className="mt-8">
          <p className="text-xs text-ink-soft">이 단계에서 바로 쓰는 도구</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {STAGE_TOOL_TITLES[stage.slug].slice(0, 3).map((title) => (
              <li key={title}>
                <Link
                  href={toolHref(stage.slug as StageSlug, title)}
                  className="card group block px-4 py-3"
                >
                  <span className="block text-[15px] font-semibold text-ink transition group-hover:text-accent">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[1.6] text-ink-soft">
                    {TOOL_DESCRIPTIONS[title]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {STAGE_TOOL_TITLES[stage.slug].length > 3 && (
            <p className="mt-2 text-[13px] text-ink-soft">
              <Link href="/tools" className="text-accent hover:underline">
                도구 {getTotalUniqueToolCount()}개 전체 보기 →
              </Link>
            </p>
          )}
        </div>
      )}
```

import 추가:
```tsx
import {
  STAGE_TOOL_TITLES,
  TOOL_DESCRIPTIONS,
  getTotalUniqueToolCount,
  isStageSlug,
  toolHref,
  type StageSlug,
} from "@/lib/stageToolMeta";
```

### 함정
1. **`relatedStage`가 없는 글이 몇 편인가.** `:54-56`이 `article.relatedStage`가 있을 때만 `stage`를 찾는다. **`grep -c "relatedStage" content/articles/*.mdx`로 전수 확인 후, 없는 글의 비율이 크면 폴백이 필요하다.** 폴백 안 하는 쪽을 권한다 — 관계없는 도구를 들이대는 것보다 아무것도 안 보이는 편이 낫다. 대신 그런 글에는 `/tools` 링크 한 줄만이라도 남기는 절충안이 있다. **구현 시 판단.**
2. **`stage.slug as StageSlug` 캐스트를 쓰지 마라.** 위 코드가 `isStageSlug(stage.slug) &&`로 이미 좁혔지만 TS가 `stage.slug`(GuideStage의 `string`)를 조건 밖으로 좁혀 나르지 못할 수 있다. 깔끔한 해법:
   ```tsx
   const stageSlug = stage && isStageSlug(stage.slug) ? stage.slug : undefined;
   ```
   를 `:56` 뒤에서 계산하고 JSX에서 `stageSlug &&`를 쓴다. **캐스트는 S6이 세우려는 원칙("런타임 검증 없이 캐스팅하지 않는다")과 정면으로 어긋난다.**
3. **`.slice(0, 3)`이 항상 앞 3개를 준다.** `writing` 단계는 도구가 9개인데 앞 3개는 `간이 통계 계산기`·`간이 차트 그리기`·`그림·표 캡션 도우미`다. `30-limitations` 같은 글에는 `연구윤리 체크리스트`가 더 맞다. **정확히 맞추려면 글마다 `relatedTools` frontmatter가 필요하고 그건 O7의 범위 밖(P2가 그 영역이다).** 앞 3개로 두되 **`/tools` 전체 링크를 반드시 함께 두어라** — 위 코드에 넣었다.
4. **A4(자료실 상세 광고 슬롯)와 같은 자리를 겨룬다.** A4는 이 라운드에 없지만 곧 온다. 순서는 `이어지는 단계 → 도구 카드 → [A4의 광고] → 다른 문서 → 이전/다음`이 자연스럽다. **주석으로 남겨 A4 구현자가 자리를 찾게 하라.**
5. `card` 클래스가 `globals.css`에 있는지 확인 — `app/example/page.tsx:56`에서 쓰고 있으므로 존재한다.

### 테스트 — `app/__tests__/articleToolLinks.test.ts`

렌더 테스트가 필요하다(서버 컴포넌트 async라 `@testing-library`로 직접 못 부른다). **대신 데이터 계약만 테스트한다:**

```ts
it("relatedStage를 가진 글은 전부 실재하는 단계를 가리킨다", () => {
  // getAllArticles()의 relatedStage가 undefined이거나 isStageSlug를 통과
});
it("relatedStage를 가진 모든 단계에 도구가 1개 이상 있다", () => {
  // 카드가 빈 <ul>로 렌더되는 경우가 없음을 보장
});
it("relatedStage가 없는 자료실 글 수를 기록한다", () => {
  // 스냅샷이 아니라 상한 — 예: expect(without.length).toBeLessThanOrEqual(N)
  // N은 실측값. 늘면 실패해서 "도구가 안 보이는 글이 늘었다"를 알린다
});
```

---

## T5. 체크리스트의 도구 인용 검증

### 실측 — **18개가 맞다.** 그러나 백로그가 말하지 않은 형태가 둘 있다

`content/guide/*.mdx`의 `checklist:` frontmatter 안 도구 인용 전수:

| 파일 | 줄 | 도구 | `위 도구` 접두사 |
| --- | --- | --- | --- |
| 02 | 9 | 선행연구 검색해보기 | ✅ |
| 02 | 11 | 내 레퍼런스 목록 | ✅ |
| 03 | 9 | 내 연구질문에 맞는 설계 유형 찾기 | ✅ |
| 03 | 10 | 목적 진술 만들어보기 | ✅ |
| 03 | 12 | 변수 정의표 만들기 | ✅ |
| 04 | 9 | 표본 크기 계산기 | ✅ (괄호 안) |
| 04 | 10 | 설문 문항 편향 체크 | ✅ (괄호 안) |
| 05 | 9 | IMRaD 구조 점검 | ✅ |
| 05 | 10 | 간이 통계 계산기 | ✅ |
| 05 | 11 | 간이 차트 그리기 | ✅ |
| 05 | 11 | 그림·표 캡션 도우미 | ❌ **접두사 없음** |
| 05 | 12 | 인용 형식 만들어보기 | ✅ |
| 05 | 12 | 내 레퍼런스 목록 | ❌ **접두사 없음** |
| 05 | 13 | 분량 체크기 | ✅ |
| 05 | 14 | 연구윤리 · 재현가능성 체크리스트 | ✅ |
| 06 | 9 | 투고처 후보 모음 | ✅ |
| 06 | 12 | AI 활용 disclosure 문구 만들기 | ✅ |
| 06 | 14 | 마감일 트래커 | ✅ |

**18개. 전부 `TOOL_IDS` 키와 일치하고, 전부 그 단계의 `STAGE_TOOL_TITLES`에 있다. 지금은 깨지지 않았다.**

### 정규식의 오탐·미탐 — **묻힌 질문에 답한다**

작은따옴표는 **ASCII 아포스트로피**(`'`)다. 유니코드 `'`가 아니다(YAML 이중따옴표 문자열 안).

**후보 A — `/위 도구 '([^']+)'/g`**
- 미탐 **2건**: 05:11 `'그림·표 캡션 도우미'`, 05:12 `'내 레퍼런스 목록'`. 16개만 잡는다.
- 오탐 0건.
- → **부족하다.** 도구 이름을 바꿔도 이 둘은 조용히 틀린 채 남는다.

**후보 B — `/'([^']+)'/g` (모든 작은따옴표 토큰)**
- 18개 전부 잡는다.
- 오탐 **1건**: `content/guide/02-prior-research.mdx:10`의 `'내 질문과 어떻게 다른가'`. 도구가 아니라 인용된 문구다.
- 01·03·04·05·06에는 도구가 아닌 작은따옴표 토큰이 **없다**(전수 확인).

### 확정 설계 — 후보 B + 명시적 예외 목록

```ts
// lib/__tests__/guideChecklist.test.ts (신설)
import { describe, expect, it } from "vitest";
import { getAllStages } from "../guide";
import {
  STAGE_TOOL_TITLES, TOOL_IDS, isStageSlug, type ToolTitle,
} from "../stageToolMeta";

/**
 * 체크리스트 안의 작은따옴표 토큰 중 도구 이름이 아닌 것.
 *
 * 도구 이름만 뽑는 정규식은 만들 수 없다 — "위 도구 '…'"만 잡으면
 * 05-writing.mdx:11·12의 두 번째 도구(접두사 없이 이어 쓴 것)를 놓치고,
 * 모든 '…'를 잡으면 이런 인용 문구가 섞인다. 그래서 전부 잡은 뒤
 * 여기서 명시적으로 제외한다. 새 인용 문구를 쓰면 테스트가 실패하고,
 * 그때 "도구인가 아닌가"를 사람이 한 번 판단하게 된다 — 그게 목적이다.
 */
const NON_TOOL_QUOTES = new Set([
  "내 질문과 어떻게 다른가", // 02-prior-research.mdx:10
]);

const QUOTED = /'([^']+)'/g;
```

```ts
describe("가이드 체크리스트의 도구 인용", () => {
  const stages = getAllStages();

  it("체크리스트가 인용하는 이름은 전부 실재하는 도구이거나 예외 목록에 있다", () => {
    const unknown: string[] = [];
    for (const stage of stages)
      for (const item of stage.checklist)
        for (const [, name] of item.matchAll(QUOTED))
          if (!NON_TOOL_QUOTES.has(name) && !(name in TOOL_IDS))
            unknown.push(`${stage.slug}: '${name}'`);
    expect(unknown, `TOOL_IDS에 없는 이름:\n${unknown.join("\n")}`).toEqual([]);
  });

  it("'위 도구'로 인용한 도구는 실제로 그 단계에 있다", () => {
    // "위 도구"라는 표현이 배치를 전제한다 — 그 전제를 검사한다.
    const misplaced: string[] = [];
    for (const stage of stages) {
      if (!isStageSlug(stage.slug)) continue;
      const here = STAGE_TOOL_TITLES[stage.slug] as readonly string[];
      for (const item of stage.checklist)
        for (const [, name] of item.matchAll(QUOTED))
          if (name in TOOL_IDS && !here.includes(name))
            misplaced.push(`${stage.slug}: '${name}'은 이 단계에 없다`);
    }
    expect(misplaced, misplaced.join("\n")).toEqual([]);
  });

  it("체크리스트가 인용하는 도구가 현재 18개다", () => {
    // 개수 고정 — 도구 인용을 지우는 회귀(예: 문장을 다시 쓰다 링크를
    // 잃는 것)를 잡는다. 늘리는 것은 정상이므로 최솟값으로 둔다.
    let count = 0;
    for (const stage of stages)
      for (const item of stage.checklist)
        for (const [, name] of item.matchAll(QUOTED))
          if (name in TOOL_IDS) count++;
    expect(count).toBeGreaterThanOrEqual(18);
  });

  it("예외 목록의 모든 항목이 실제로 체크리스트에 남아 있다", () => {
    // 죽은 예외가 쌓이는 것을 막는다 — 문구를 지웠는데 예외만 남으면
    // 다음 사람이 그것을 근거로 잘못 판단한다.
    const all = new Set(
      stages.flatMap((s) => s.checklist)
        .flatMap((i) => [...i.matchAll(QUOTED)].map((m) => m[1])),
    );
    for (const q of NON_TOOL_QUOTES) expect(all.has(q)).toBe(true);
  });
});
```

### 함정
1. **`String.prototype.matchAll`은 `g` 플래그 정규식의 `lastIndex`를 공유하지 않는다** — `matchAll`은 내부적으로 복제하므로 모듈 상수 `QUOTED`를 반복 사용해도 안전하다. `exec` 루프였다면 `lastIndex` 초기화가 필요했다. **`exec`로 바꾸지 마라.**
2. **`"연구윤리 · 재현가능성 체크리스트"`의 `·` 좌우 공백**이 `TOOL_IDS`(`lib/stageToolMeta.ts:114`)와 체크리스트(`05-writing.mdx:14`) 양쪽에 동일해야 한다. 확인함 — 일치한다. **이런 종류의 불일치가 T5가 잡으려는 것 그 자체다.**
3. **`selfCheck`는 검사 범위에 넣지 않는다.** T4가 selfCheck의 규약을 따로 다룬다. 범위를 섞으면 두 항목이 서로를 막는다.
4. **본문(`content` 필드)의 "위 도구 '…'"는 검사하지 않는다.** 실측상 본문에도 12곳 있다(02:42,95 / 03:80 / 04:33,34,35 / 05:47,68,80,98,108 / 06:40,44,50,57). **범위를 넓히면 오탐이 급증한다** — 본문에는 `'재현 가능과 반복 가능은 다르다'`(22-replication:28) 같은 절 제목 인용이 섞인다. **본문 검사는 S4의 범위로 미룬다.** 백로그 T5도 "체크리스트"라고 한정했다.
5. **`getAllStages()`가 `buildOnlyCache`를 통과한다.** 테스트에서는 캐시가 꺼져 매번 파일을 읽는다 — T9가 지적한 성능 문제이지만 6파일이라 무시할 수 있다.

---

# 파트 4 — 커밋 분할

**11개 커밋.** 순서에 의존성이 있다.

### 커밋 1 — `docs: 유지보수 보고서의 유효한 판단을 백로그로 흡수 (T12)`
- `docs/feature-backlog.md` F절·E절 추가, `docs/backlog-index.md` `[?]` 표 한 줄
- `git mv MAINTENANCE_REPORT.md docs/maintenance-2026-08-29.md` + 보존 헤더
- `README.md`에 문서 안내 절 + "Next.js 15" → 16 정정
- **이유**: 코드 파급 0. 첫 번째에 두면 이후 커밋을 읽는 사람이 어느 문서가 진실 원본인지 안다. **삭제는 하지 않는다** — 운영자 승인 대기.
- **주의**: `docs/articles-*.md` 두 개는 미커밋 상태다. `git add`를 명시적으로.

### 커밋 2 — `docs: 코드 MIT · 콘텐츠 CC BY-NC-SA 4.0 라이선스 명시 (S7)`
- `LICENSE`, `LICENSE-CONTENT.md` 신설
- `components/SiteFooter.tsx:12`, `app/about/page.tsx`(문의 절 앞에 `#license` 절)
- **선행 결정 필요**: E4(팀명/저작권자 표기). **운영자 확인 전에는 커밋하지 마라.**
- **이유**: 파일 신설 + 텍스트 2곳. 다른 어떤 커밋과도 파일이 겹치지 않는다. `/about`을 만지는 유일한 커밋이다.

### 커밋 3 — `fix: frontmatter 필수 필드를 세 리더 전부에서 검증한다 (S6)`
- `lib/frontmatter.ts` 신설, `lib/articles.ts:72-84`·`lib/guide.ts:23-33`·`lib/showcase.ts:14,32-41` 수정
- `lib/__tests__/frontmatter.test.ts` 신설 + 기존 3개 테스트 파일에 통합 검증 1건씩
- **이유**: 이후 P6-a가 `Showcase` 타입에 `lesson`을 더하고, T13/M4가 `published`를 만진다. **가드가 먼저 있어야 그 변경이 안전하다.**
- **게이트**: `npm test && npx tsc --noEmit && npm run build` 셋 다 초록. **전수 확인상 기존 43개 mdx는 전부 통과한다(검증 완료).** 하나라도 깨지면 내 조사가 틀린 것이니 멈추고 보고하라.

### 커밋 4 — `test: sitemap·robots 상호 검증 (T6)`
- `app/__tests__/routes.test.ts` 신설. 프로덕션 코드 변경 **0줄**
- **이유**: `app/` 첫 테스트. A2·T13 착수 전 방지선. 순수 추가라 언제 넣어도 안전하지만, 커밋 3 뒤여야 `getAllArticles()`가 새 가드를 통과한 상태에서 검증된다.

### 커밋 5 — `test: 체크리스트가 인용하는 도구 이름·단계 배치 검증 (T5)`
- `lib/__tests__/guideChecklist.test.ts` 신설. 프로덕션 코드 변경 **0줄**
- **이유**: 커밋 9(A1/G1/O7)가 도구 링크 규약을 여러 곳에 퍼뜨리기 전에, 이름 규약을 먼저 잠근다.

### 커밋 6 — `feat: /privacy 저장 항목을 코드에서 렌더하고 대조로 잠근다 (T8)`
- `lib/storageKeys.ts` 신설, `app/privacy/page.tsx:41-53` 교체
- `lib/__tests__/storageKeys.test.ts` 신설
- **이유**: 묶음 6(도구 신설: H3·H4·B2)의 선행 조건. 그 전에 들어가야 새 도구가 방침을 조용히 낡게 하지 못한다.
- **작업 순서**: 테스트를 **먼저** 쓰고 `TOOL_STATE_KEYS`를 일부러 14개만 넣어 **빨간 것을 확인한 뒤** 15번째를 채워라. 정규식이 새는지를 그 실패로 검증한다.

### 커밋 7 — `refactor: 광고 레일을 레이아웃에서 빼고 게재 페이지에서 부른다 (O5, P5)`
- `components/AdRails.tsx` 신설
- `app/layout.tsx:6,125-133` 삭제
- `app/guide/[stage]/page.tsx`·`app/guide/page.tsx`·`app/articles/[slug]/page.tsx`·`app/example/page.tsx`·`app/showcase/[slug]/page.tsx` 5곳에 `<AdRails />`
- `app/example/page.tsx`에 `2xl:hidden` `AdSlot` 1개 (P5)
- `app/__tests__/adRails.test.ts` 신설
- **이유**: P5를 O5와 같은 커밋에 두는 것은 `/example`이 레일과 하단 슬롯을 **동시에** 갖게 되기 때문이다. 두 커밋으로 나누면 중간 상태에서 1536px 이상 화면에 광고 셋이 뜬다. 한 diff에서 배타 관계가 보여야 한다.
- **게이트**: 1536px 이상 창에서 `/guide/topic` → `/guide/writing` 전환을 눈으로 확인(View Transition 함정). `npm run build` 후 `next start`로 `/`·`/404`·`/activity`에 광고 마크업이 없는지 확인.

### 커밋 8 — `feat: /example의 도구 이름과 /tools 색인을 실제 도구 앵커로 (A1, G1, O7)`
- `lib/stageToolMeta.ts:121` 뒤에 `toolHref`·`primaryStageOf`
- `app/tools/page.tsx:59-67,86`, `app/showcase/page.tsx:51`
- `app/example/page.tsx` 8곳 + `ToolLink` 로컬 컴포넌트 (**`:239`는 제외** — H1 대기)
- `app/articles/[slug]/page.tsx:167` 뒤 도구 카드
- `lib/__tests__/stageToolMeta.test.ts`에 3건 추가, `app/__tests__/toolLinks.test.ts`·`articleToolLinks.test.ts` 신설
- **이유**: 셋이 같은 헬퍼의 세 호출부다(위 판단 참고). `app/example/page.tsx`를 커밋 7이 이미 만졌으므로 **커밋 7 뒤여야 충돌이 없다.**
- **작업 순서**: `toolHref` + 테스트를 먼저, 그다음 A1, G1, O7 순. 각 단계에서 `tsc --noEmit`.
- **후속 작업**: `docs/feature-backlog.md`의 Y12(H1 연쇄 수정 줄 번호)에 `app/example/page.tsx:239` 추가.

### 커밋 9 — `feat: /showcase에 선정 기준·읽는 법과 사례별 배움점 (P6-a)`
- `lib/showcase.ts`에 `lesson` 필드, `app/showcase/page.tsx` 두 절 + 목록 배움점
- `content/showcase/*.mdx` 6편 frontmatter에 `lesson`
- `lib/__tests__/showcase.test.ts` 신설
- **선행 조건**: **묶음 0의 커밋 8(X2~X5, 사례 방법론 오류 정정)이 먼저 들어가야 한다.** 아직이면 이 커밋을 보류하고 커밋 10으로 건너뛰어라. 틀린 추론을 "배울 것"으로 광고하게 된다.
- 커밋 8이 `app/showcase/page.tsx:51`을 만졌으므로 그 뒤.

### 커밋 10 — `feat: /tools 단계 소개를 실제 안내 분량으로 (P6-b)`
- `app/tools/page.tsx:18-31`의 `STAGE_TOOL_INTROS` 6개 값 확장
- **이유**: 커밋 8이 같은 파일의 `:59-67`·`:86`을 고쳤다. **반드시 그 뒤**여야 사과 문단을 지우는 diff와 소개를 늘리는 diff가 섞이지 않는다.
- 각 단계의 "흔한 실패" 문장은 `content/guide/0N-*.mdx`의 「흔히 하는 실수」에서 가져온다. 창작하지 마라.

### 커밋 11 — `chore: 외부 링크·배포 후 점검 스크립트 (T10, T11)`
- `scripts/linkcheck.mts`·`scripts/postdeploy.mts` 신설
- `package.json:11` 뒤에 `"linkcheck"`, `"check:deploy"` 두 스크립트
- `.gitignore`에 `.postdeploy-urls.json`
- `docs/`에 실행 절차 5줄 (README의 문서 절에서 링크)
- **이유**: 마지막. `check:deploy`의 체크 12·13이 커밋 7(O5)의 결과를, 체크 16이 커밋 2(S7)의 결과를 확인하므로 **앞선 것들이 다 들어간 뒤여야 첫 실행이 초록**이다.
- **게이트**: 로컬에서 `npm run linkcheck` 9개 200 확인. `npm run check:deploy`는 배포 후 실행.

### 병렬 가능성

파일 교집합 기준으로 **커밋 1·2·3·4·5·6은 서로 독립**이다:
- 1: `docs/` + `README.md` + `MAINTENANCE_REPORT.md`
- 2: `LICENSE*` + `SiteFooter.tsx` + `about/page.tsx`
- 3: `lib/frontmatter.ts` + 3개 리더 + 테스트
- 4: `app/__tests__/routes.test.ts`
- 5: `lib/__tests__/guideChecklist.test.ts`
- 6: `lib/storageKeys.ts` + `privacy/page.tsx` + 테스트

**7 → 8 → 9 → 10 → 11은 순차**다(7·8·10이 같은 파일을 만지고, 11이 전부를 검증한다).

### 묶음 0과의 관계

이 14건 중 **묶음 0에 의존하는 것은 커밋 9(P6-a) 하나뿐**이다. 나머지 10개 커밋은 묶음 0과 파일 교집합이 없거나(문서·설정·app 라우트), 있어도 다른 줄이다. **묶음 0을 기다리지 않고 시작할 수 있다.**

단 하나 주의: 묶음 0 커밋 1(S1, CI)이 아직 없으면 **이 11개 커밋도 자동 검증 없이 나간다.** 묶음 0 커밋 1·2를 먼저 넣는 것을 강하게 권한다.

---

# 파트 5 — 불확실한 지점 (얼버무리지 않고 명시)

1. **`app/example/page.tsx`의 정확한 마지막 20줄** — `:337` 이후 구조는 확인했으나, `{/* 마무리 */}` 블록의 정확한 시작 줄(`:363` 추정)을 실측하지 않았다. **P5의 `AdSlot` 삽입 직전에 `sed -n '350,382p'`로 확인하라.**

2. **`StageTools`의 해시 재구독** — `/tools`에서 같은 단계의 다른 도구를 **연속으로** 클릭할 때 아코디언이 다시 펼쳐지는지 확인하지 않았다(`StageTools.tsx:140-142`는 마운트 시점 시드로 보인다). 안 되면 A1의 체감 가치가 절반이 된다. **구현 시 실제로 눌러 보고, 깨져 있으면 백로그 신규 항목으로 올려라 — A1 커밋에서 고치지 마라.**

3. **`relatedStage`가 없는 자료실 글의 수** — 세지 않았다. O7의 커버리지가 이 수에 달려 있다. `grep -L "relatedStage" content/articles/*.mdx | wc -l`로 확인 후, 절반 이상이면 폴백(`/tools` 링크 한 줄)을 넣을지 재판단.

4. **`usePersistentState` 키 15개 중 5개의 실제 리터럴** — 다인수/제네릭 호출이라 한 줄 grep으로 못 잡았다(CitationFormatter:31, FigureCaptionHelper:10, ResearchDesignQuiz:167, SimpleChart:37, StatsCalculator:17). **T8 구현 전 `grep -rn -A2 "usePersistentState[<(]" components/`로 확정하라.** 내가 `TOOL_STATE_KEYS`에 넣은 5개 이름은 **추측이다.**

5. **S7의 NC 여부** — 운영자 결정이다. 나는 BY-NC-SA를 추천했으나, 교육기관 등재를 노린다면 BY-SA여야 한다. **NC는 나중에 풀 수 있지만 채울 수는 없다**는 것이 내 판단의 근거 전부다. 되돌릴 수 없는 선택이 아니라는 점이 중요하다.

6. **S7의 저작권자 표기** — E4(지니어스 클럽 팀명 복원)와 같은 결정이다. **E4가 정해지기 전에 LICENSE에 이름을 박지 마라.**

7. **투고 사례의 저작권 동의** — `ResearchShowcaseForm`이 투고 시 라이선스 동의를 받는지 확인하지 않았다. 안 받는다면 `LICENSE-CONTENT.md`의 예외 조항이 유일한 방어선이고, T7(사례 출처 필드)에서 동의 필드를 함께 설계해야 한다. **`components/ResearchShowcaseForm.tsx` 전문 확인 필요.**

8. **View Transition과 `fixed` 레일** — `transform`이 의사 요소에만 있음을 확인해 containing block은 안전하다고 판단했으나, **실제로 렌더해 보지는 않았다.** 커밋 7의 게이트에 눈 확인을 넣은 이유다.

9. **`app/__tests__/` vs `lib/__tests__/`** — `app/` 아래에 테스트를 두는 것이 Next 16에서 문제를 일으키지 않는다고 판단했으나(라우트 파일 규약에 안 걸림), 실행해 보지 않았다. 첫 실행에서 `next build`가 경고를 내면 `lib/__tests__/appRoutes.test.ts`로 옮겨라.

10. **T5의 `NON_TOOL_QUOTES` 예외가 1건뿐인가** — 6개 파일의 `checklist` 배열 전체를 눈으로 읽어 확인했다. 확신한다. 다만 `selfCheck`는 읽지 않았으므로 **범위를 넓히면 예외가 늘어난다.** 넓히지 마라.agentId: ab4324c865be1599d (use SendMessage with to: 'ab4324c865be1599d', summary: '<5-10 word recap>' to continue this agent)
<usage>subagent_tokens: 223615
tool_uses: 42
duration_ms: 871967</usage>