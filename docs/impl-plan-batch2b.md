# 라운드 17·18 잔여 구현 설계 — 성능 PF · Next 규약 NX · 메타데이터 SE · 보안 SC5 SC6 (26건)

라운드 19. 대상: **PF1~PF12** / **NX1~NX8** / **SE1~SE3** / **SC5 SC6**.
Next **16.3.3**, React **19.2.8**. 근거 문서는 전부 `node_modules/next/dist/docs/`에서 직접 읽었다
(아래 인용의 `docs/…` 경로는 그 디렉터리 기준).

모든 줄 번호는 이 라운드에서 **파일을 열어 재확인**했다. 이 배치는 batch05(A1·G1·O7), batch06(L2·L3),
batch7(L7)이 **같은 줄을 먼저 만진다.** 그 세 문서가 확정한 형태를 기준으로 쓰고, 어긋나는 곳은
아래 「다른 배치와의 충돌」 절에서 판정했다.

---

## 파트 0 — 판정 정정 (이 라운드에서 새로 잡은 것 6건, 누적 47)

| # | 항목 | 백로그 주장 | 실측 | 영향 |
| --- | --- | --- | --- | --- |
| 42 | **SE2·SE3** | `<title>` 40/51이 **60자** 초과, 최장 142자 / description 40/51이 **160자** 초과 | **바이트를 글자로 읽었다.** `aria-deep-learning` 전체 제목은 **58자 = 142바이트**(한글 3바이트). 문자 기준으로 51/51 전부 60자 이하, description은 자료실 77~116자·사례 40~50자·가이드 50~99자. 계산은 `Buffer.byteLength`로 재현됨 | SE2·SE3의 처방 근거가 사라진다. 진짜 기준은 픽셀 폭(한글 제목 ~30자·설명 ~85자)이고 그 기준으로는 **초과가 "잘림"일 뿐 결함이 아니다**. §SE2·SE3에서 재판정 |
| 43 | **PF9** | 스크롤마다 강제 레이아웃 **최대 16회** | `StageRail.tsx:117-121`의 `getBoundingClientRect()`는 루프 안이지만, 스크롤은 레이아웃을 더럽히지 않고 첫 호출 뒤엔 레이아웃이 깨끗하다. **프레임당 강제 레이아웃은 최대 1회**(직전 `setActiveId` 리렌더로 클래스가 바뀐 프레임만). 게다가 `:121`의 `else break`로 보통 2~3개만 잰다 | **조치 없음.** 백로그를 정정한다 |
| 44 | **PF2** | "`?tool=` 쿼리면 서버가 처음부터 옳은 항목을 편다" | 맞지만 대가가 빠졌다. 서버에서 `searchParams`를 읽는 순간 `guide/[stage]` 6페이지가 **동적 렌더**가 되어 정적 프리렌더·CDN 캐시를 잃고(`docs/…/fetch.md:52` "Request-time APIs가 감지되면 매 요청"), **PF10·NX6이 닫으려는 "요청 = 함수 실행"이 그대로 열린다**. 클라이언트 `useSearchParams`로 하면 정적 라우트에서 그 서브트리가 CSR 전용이 되어 도구 섹션이 초기 HTML에서 통째로 빠진다 | 해시 유지로 판정. §PF2 |
| 45 | **PF1** | 예약 높이 96px가 "실제와 다르다" | 원인이 높이 값이 아니다. `AdSlot.tsx:58-59`의 `data-ad-format="auto"` + `data-full-width-responsive="true"`는 **정의상 높이를 광고가 정한다**. 어떤 예약 높이를 써도 맞을 수 없다. 처방은 고정 크기 단위(미디어쿼리 CSS)로의 전환이지 값 조정이 아니다 | §PF1 |
| 46 | **PF6 ↔ L7** | PF6은 "L7보다 먼저"라고만 적었다 | batch7의 L7 확정 코드(`impl-plan-batch7.md:94-104`)가 **업데이터 안에서 `pendingRef` 쓰기**를 "유일한 부수효과"로 남긴다 — PF6이 금지하는 바로 그 위치다. batch7 「구현 시 판단 1」이 이 선택을 열어 뒀다. PF6이 그 판단을 닫는다: **커밋 뒤 `useEffect`에서 쓴다**. §PF6에 L7까지 흡수한 전문을 둔다 | batch7 L7 절은 이 문서로 대체 |
| 47 | **NX4** | `PageProps` 헬퍼 "미사용" | 사용하려면 `.next/types`가 있어야 한다(`docs/…/page.md:140` "After type generation"). **S1(CI)이 `typecheck` 스크립트를 넣을 때 `next typegen`을 선행해야** CI에서 `tsc`가 통과한다(`docs/…/03-layouts-and-pages.md:337`). 이 전제 없이 NX4를 넣으면 CI가 빨개진다 | NX4는 S1 커밋 01 뒤 |

---

# 파트 1 — 메타데이터 (NX1 + SE1, SE2, SE3)

## NX1 + SE1. 51개 페이지의 og:title·description이 동일 — `sharedOpenGraph`

### 원인 재확인 (코드 + 런타임)

- `app/layout.tsx:29-36`이 `openGraph: { type, locale, siteName, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "./" }`.
- 세 `generateMetadata`는 `openGraph`를 반환하지 않는다:
  `app/articles/[slug]/page.tsx:27-31` (`title, description, keywords`),
  `app/guide/[stage]/page.tsx:28-32` (같음), `app/showcase/[slug]/page.tsx:26` (`{ title, description: item.summary }`).
- 정적 페이지 7곳(`guide`, `articles`, `showcase`, `about`, `privacy`, `example`, `tools`)도 `openGraph` 0회.
- 문서 근거 `docs/01-app/03-api-reference/04-functions/generate-metadata.md:1346-1348`:
  > Metadata objects … are **shallowly** merged … metadata with nested fields such as `openGraph` … defined in an earlier segment are **overwritten** by the last segment to define them.
  그리고 `:1410-1436` "Inheriting fields": 하위가 `openGraph`를 안 쓰면 루트 것이 **통째로 상속**된다.
- 런타임 `node_modules/next/dist/lib/metadata/resolve-metadata.js:603-611` `inheritFromMetadata`는
  `!hasTitle(target)`일 때만 페이지 `title`을 넣는다. 루트가 이미 채웠으니 안 걸린다. 백로그의 `:656` 인용이 맞다.
- **추가로 확인한 것**: `:628-633`이 `twitter.title`을 `openGraph.title`에서 채운다. 따라서 **twitter:title도 51개 동일**이다.
  SE1이 재지 않았지만 같은 한 줄이 고친다.

### 두 가지 해법 — 어느 쪽인가

**(가) 루트에서 `title`·`description` 두 줄만 지운다.** `resolve-metadata.js:658`의 `inheritFromMetadata(openGraph, metadata)`가
페이지 `title`을 그대로 넣는다. 코드 변경 2줄. **단, 그때 들어가는 `metadata.title`은 템플릿이 적용된 절대 제목**이므로
og:title이 `"PubMed 5분 사용법 — MeSH로… | 연구랩 가이드"`가 된다. 카톡 카드는 이미 `og:site_name`을 따로 보여주므로 접미사가 중복된다.

**(나) `lib/site.ts`에 공유 필드를 두고 세 곳에서 펼친다.** 문서가 권하는 형태(`generate-metadata.md:1382-1408` "pull them out into a separate variable").
og:title이 접미사 없는 순수 제목이 된다. 사례 6편처럼 제목이 긴 곳에서 카드가 한 줄 덜 잘린다.

**(나)를 채택한다.** 근거: SE1이 지적한 "그림과 글이 다른 말을 한다"의 해결은 og:title = OG 이미지에 그려진 제목(`opengraph-image.tsx:23`의 `article.title`)이어야 완결되는데, (가)는 접미사가 붙어 그림과 또 달라진다.
(가)는 **(나)를 넣은 뒤에도 루트에 남는 안전망**으로 함께 적용한다 — 루트 `openGraph`에서 `title`·`description`을 빼면 `openGraph`를 안 쓴 정적 페이지 7곳도 자동으로 자기 `title`을 받는다(접미사 포함이지만 "전부 동일"보다 낫다).

### 변경 1 — `lib/site.ts` (`:18` `SITE_NAME` 뒤에 추가, `app/layout.tsx:16-18`에서 이동)

```ts
import type { Metadata } from "next";

// "청소년 연구 6단계 가이드"를 앞에 두는 이유 — "연구랩"은 흔한 일반명사라
// 그 단어만으로는 검색에 안 걸린다. 실제로 사람들이 찾을 법한 구절을 타이틀
// 맨 앞에 그대로 넣어야 그 검색어와 일치해 노출 확률이 올라간다.
// (app/layout.tsx에 있던 상수를 여기로 옮겼다 — openGraph 공유 필드와 한 곳에 둔다.)
export const SITE_TITLE = "청소년 연구 6단계 가이드 — 연구랩";
export const SITE_DESCRIPTION =
  "청소년 연구 6단계 가이드. 주제 선정부터 논문 투고까지 무료로 따라갈 수 있습니다. 로그인 없이 바로 시작하세요.";

/**
 * 모든 페이지가 공유하는 openGraph 필드.
 *
 * Next의 메타데이터 병합은 얕다(docs generate-metadata.md:1346) — 페이지가
 * `openGraph`를 정의하는 순간 루트의 `openGraph`는 통째로 버려진다. 그래서
 * 페이지마다 title·description만 바꾸려 해도 type·locale·siteName·url을
 * 함께 다시 적어야 하고, 그 "함께 다시 적을 것"이 이 객체다.
 *
 * `url: "./"`는 metadataBase 기준 현재 경로로 풀린다(루트의 canonical과 같은 규약).
 * `images`는 넣지 않는다 — opengraph-image.tsx 파일 규약이 자동으로 붙인다.
 */
export const sharedOpenGraph = {
  type: "website",
  locale: "ko_KR",
  siteName: SITE_NAME,
  url: "./",
} as const satisfies Metadata["openGraph"];

/** 페이지 하나의 openGraph — 공유 필드 + 그 페이지의 제목·설명. */
export function pageOpenGraph(
  title: string,
  description: string,
): NonNullable<Metadata["openGraph"]> {
  return { ...sharedOpenGraph, title, description };
}
```

`import type`은 타입 전용이라 `lib/site.ts`를 import하는 클라이언트 컴포넌트(`SiteNav.tsx:5`, `ResearchShowcaseForm.tsx:5`)에 런타임 영향이 없다.

### 변경 2 — `app/layout.tsx`

`:7` import에 `SITE_TITLE, SITE_DESCRIPTION, sharedOpenGraph` 추가. `:12-18`의 주석과 두 상수 **삭제**(site.ts로 이동). `:29-36`:

```ts
  // 루트는 공유 필드만 갖는다. title·description을 여기 두면 하위 페이지가
  // openGraph를 안 쓸 때 통째로 상속돼 51개 페이지의 og:title이 전부 같아진다
  // (라운드 18 SE1 실측). 비워 두면 Next가 페이지 <title>에서 채운다
  // (resolve-metadata.js inheritFromMetadata) — openGraph를 직접 쓰지 않는
  // 정적 페이지들의 안전망이다.
  openGraph: sharedOpenGraph,
```

`SITE_TITLE`·`SITE_DESCRIPTION`은 `:22-26`의 `title.default`·`description`에서 계속 쓴다(import만 바뀜).

### 변경 3 — 세 `generateMetadata`

`app/articles/[slug]/page.tsx:27-31`:
```ts
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    openGraph: pageOpenGraph(article.title, article.description),
  };
```
`app/guide/[stage]/page.tsx:28-32` — `title`을 변수로 뺀다(두 번 쓰므로):
```ts
  const title = `${stage.order}단계: ${stage.title}`;
  return {
    title,
    description: stage.description,
    keywords: stage.keywords,
    openGraph: pageOpenGraph(title, stage.description),
  };
```
`app/showcase/[slug]/page.tsx:26`:
```ts
  return {
    title: item.title,
    description: item.summary,
    openGraph: pageOpenGraph(item.title, item.summary),
  };
```
각 파일 import에 `import { pageOpenGraph } from "@/lib/site";`.

**정적 페이지 7곳은 손대지 않는다.** 변경 2의 안전망으로 자기 `<title>`(접미사 포함)을 받는다. 접미사 없는 카드를 원하면 같은 한 줄을 붙이면 되지만, 이 항목의 범위(SE1 "51개 동일")는 변경 2로 이미 닫힌다.

### 함정

1. **`type: "website"`를 사례·자료실에서 `"article"`로 바꾸고 싶어질 것이다.** 바꾸지 마라 — `OpenGraphArticle`은 `publishedTime`·`authors` 등 다른 필드 집합이고, `sharedOpenGraph`가 `type`을 갖고 있어 spread 순서로 덮인다. A3(JSON-LD `image`)·C2와 함께 별도 판단.
2. **`og:url`이 페이지별로 풀리는지 실측할 것.** 루트에서 `"./"`가 동작함은 canonical 51/51로 간접 확인됐지만, 페이지 세그먼트에서 정의한 `openGraph.url: "./"`도 같은 경로로 풀리는지는 이 문서가 읽은 범위에서 확정 못 했다. 구현 후 `curl | grep og:url` 3개 경로. **구현 시 확인.**
3. **`twitter`는 건드릴 것 없다.** `resolve-metadata.js:628-636`이 og에서 자동으로 채운다. 실측으로 `twitter:title`이 페이지별인지 함께 본다.
4. `keywords`는 openGraph와 무관 — 그대로.
5. **C2(목록 페이지 OG 이미지)가 이 뒤에 온다**(라운드 18 순서 제약). C2가 `openGraph.images`를 명시하기 시작하면 `sharedOpenGraph`에 넣지 말고 페이지에서 넣는다 — 이미지는 페이지마다 다르다.

### 테스트 — 렌더 없이 `generateMetadata`를 직접 부를 수 있나

**부를 수 있다. 두 층으로 나눈다.**

**층 1 — `lib/__tests__/site.test.ts` (신설, node)**: 순수 함수라 확실히 된다.
```ts
it("pageOpenGraph는 공유 필드를 유지하고 제목·설명만 바꾼다")
//   const og = pageOpenGraph("제목", "설명");
//   expect(og).toMatchObject({ type: "website", locale: "ko_KR", siteName: SITE_NAME, url: "./", title: "제목", description: "설명" });
it("pageOpenGraph의 제목은 사이트 제목과 다르다 (SE1 회귀 방지)")
//   expect(pageOpenGraph("아무 제목", "x").title).not.toBe(SITE_TITLE);
it("sharedOpenGraph에는 title·description이 없다 (루트 상속 차단)")
//   expect("title" in sharedOpenGraph).toBe(false); expect("description" in sharedOpenGraph).toBe(false);
```
세 번째가 이 항목의 핵심 계약이다 — 누군가 루트에 `title`을 되돌리면 빨개진다.

**층 2 — `app/__tests__/pageMetadata.test.ts` (신설, node)**: 실제 `generateMetadata`를 부른다.
```ts
import { generateMetadata as articleMeta } from "@/app/articles/[slug]/page";
import { generateMetadata as stageMeta } from "@/app/guide/[stage]/page";
import { generateMetadata as showcaseMeta } from "@/app/showcase/[slug]/page";

it("자료실 전 문서의 og:title이 문서 제목이고 사이트 제목이 아니다", async () => {
  for (const a of getAllArticles()) {
    const m = await articleMeta({ params: Promise.resolve({ slug: a.slug }) });
    expect(m.openGraph?.title).toBe(a.title);
    expect(m.openGraph?.title).not.toBe(SITE_TITLE);
  }
});
it("가이드 6단계의 og:title이 '{n}단계: {제목}'이다", …)
it("사례 전편의 og:description이 summary다", …)
it("51개(자료실+단계+사례) og:title이 전부 서로 다르다", …)   // 고유값 개수 === 문서 수
it("없는 slug는 openGraph 없이 {}를 돌려준다 (경계)", …)
```
**`params`는 `Promise<{slug}>`라 `Promise.resolve`로 넘긴다** (`page.tsx:20-23` 시그니처 그대로).
**함정**: 이 세 page 모듈은 `next-mdx-remote/rsc`·`next/link`·`next/navigation`을 import한다. node 환경 vitest에서 로드가 되는지 **구현 시 첫 실행으로 확인**. 안 되면 `vi.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }))`를 파일 상단에 두면 된다 — `generateMetadata`는 그 모듈을 호출하지 않으므로 mock이 결과에 영향을 주지 않는다. 층 1이 있으므로 층 2가 막혀도 계약은 잠긴다.

---

## SE2. `<title>` 길이 — **재판정: 프론트매터 변경 없음, 상한 테스트만**

### 실측 (문자 기준, `| 연구랩 가이드` 접미사 포함)

| 구간 | 자료실 31 | 가이드 6 | 사례 6 |
| --- | --- | --- | --- |
| 전체 제목 길이 | 25~49자 | 18~22자 | 46~58자 |
| 원 제목만 | 15~39자 | 3~7자 | 36~48자 |

파트 0 #42: 백로그의 "142자"는 142**바이트**다. 문자로 60자를 넘는 페이지는 **0개**.

### 진짜 기준과 그에 따른 판정

검색결과 제목 잘림은 글자 수가 아니라 폭(데스크톱 약 600px)이다. 한글은 글자당 폭이 라틴의 두 배 안팎이라 **약 30자**에서 잘린다. 그 기준으로 잘리는 것은 자료실 약 20편·사례 6편 전부다. 그런데:

- 이 사이트의 제목은 **앞에 핵심어를 둔다**(`layout.tsx:12-15`의 설계 의도가 문서화돼 있다). 뒤가 잘려도 검색어 일치 부분은 남는다.
- 구글은 잘릴 때 접미사부터 버리고 사이트명을 `og:site_name`/구조화 데이터에서 따로 붙인다. **접미사 `| 연구랩 가이드`는 검색결과에서는 어차피 거의 안 보인다.**
- 사례 6편 제목이 문장인 것은 M7(화자)·P6-a(선정 기준)와 함께 사례 정체성의 문제지 SEO 문제가 아니다.

**판정: 프론트매터도 템플릿도 바꾸지 않는다.** `ogTitle` 필드 신설은 S6(필수 필드 검증)·T7(출처 필드)과 같은 스키마를 두 번 열게 되고, 얻는 것은 "카드에서 한 줄"이다. NX1(나)가 og:title에서 접미사를 이미 뗐으므로 공유 카드는 원 제목만 보인다 — 사례도 36~48자로 카톡 카드 두 줄 안에 든다.

### 남기는 것 — 상한 테스트 (미래의 회귀만 막는다)

`lib/__tests__/articles.test.ts` 또는 신설 `lib/__tests__/contentMeta.test.ts`:
```ts
it("자료실·사례 제목은 45자 이하다 (검색결과 두 줄 안에 든다)")
//   getAllArticles()·getAllShowcases()의 [...title].length <= 45  — 현재 최댓값 39(자료실)·48(사례)
//   → 사례는 48이 이미 넘는다. 상한을 50으로 두고 사례 제목 정리는 M7 커밋에서 재검토
it("description은 70자 이상 120자 이하다 (스니펫 권장 폭)")
//   자료실 77~116 → 통과. 가이드 writing 50·data-collection 61·submission 66 → **실패**
```
두 번째 것은 **가이드 3편의 description이 너무 짧다**는 반대 방향 결함을 드러낸다(`content/guide/05-writing.mdx` 50자 등). 백로그 SE3이 "70자 미만 1건(/privacy)"이라 했지만 그것도 바이트였다. 상한만 잠그고 하한은 경고로 두든지, 세 편을 70자 이상으로 늘리는 콘텐츠 작업(S 난이도)을 묶음 8에 붙이든지 — **운영자 판단.** 기본은 `<= 120`만 단언하고 하한은 `it.todo`로 남긴다.

`[...s].length`를 써야 한다 — `s.length`는 UTF-16 코드 유닛이라 한글은 같지만 `℃`(KO5) 같은 기호와 이모지에서 어긋난다.

## SE3. `description` 길이 — **재판정: 변경 없음**

- 문자 기준 자료실 77~116, 사례 40~50(`summary`), 가이드 50~99. 160자 초과 **0개**.
- 폭 기준(데스크톱 두 줄 ≈ 한글 85자, 모바일 세 줄 ≈ 100자+)으로 자료실 약 25편이 데스크톱에서 잘린다. 잘린 스니펫은 결함이 아니다 — 구글은 어차피 절반 이상을 본문에서 직접 뽑는다.
- **`description`은 메타만이 아니다.** `app/articles/[slug]/page.tsx:97-99`가 같은 문자열을 **본문 리드 문단**으로 그린다. 160→120으로 줄이면 페이지 첫 문단이 바뀐다. `summary`(31~48자)가 따로 있고 그것이 목록용이다.
- 사례는 `summary`를 description으로 쓴다(`showcase/[slug]/page.tsx:26`) — 40~50자라 오히려 짧은 쪽이지만 사례 6편은 M6·M7·T7이 파일을 다시 연다. 거기서 본다.

**SE2·SE3의 실제 산출물은 백로그 정정 두 줄과 상한 테스트 2건이다.** 커밋 분할에서 NX1과 같은 커밋에 태운다.

---

# 파트 2 — Next 규약 (NX2+PF10, NX3+L2+L3 병합, NX4~NX8)

## NX2 + PF10. `dynamicParams` — 페이지 2곳 + OG 라우트 3곳

### 현재

| 파일 | `generateStaticParams` | `dynamicParams` |
| --- | --- | --- |
| `app/showcase/[slug]/page.tsx` | `:14-16` | **`:12` `false`** (주석 `:10-11`) |
| `app/articles/[slug]/page.tsx` | `:15-17` | 없음 |
| `app/guide/[stage]/page.tsx` | `:16-18` | 없음 |
| `app/showcase/[slug]/opengraph-image.tsx` | `:8-10` | 없음 |
| `app/articles/[slug]/opengraph-image.tsx` | `:8-10` | 없음 |
| `app/guide/[stage]/opengraph-image.tsx` | `:6-8` (import `:9-10`이 함수 **뒤**에 있다) | 없음 |

문서 근거:
- `docs/…/02-route-segment-config/dynamicParams.md:16-17`: `true`(기본)면 "generated at request time", `false`면 404.
- `docs/…/opengraph-image.md:322`: OG 파일은 "specialized Route Handlers that can use the same route segment configuration options as Pages and Layouts" — **페이지의 설정을 상속하지 않는다.** 그래서 `showcase/[slug]/page.tsx:12`만으로는 이미지 라우트가 안 닫힌다.
- `docs/…/opengraph-image.md:91`: "By default, generated images are **statically optimized** … unless they use Request-time APIs or uncached data." → 세 OG 파일의 주석("이게 없으면 요청 때마다 그려진다", `articles/[slug]/opengraph-image.tsx:5-7`, `showcase:5-7`, `guide:4-5`)이 **문서와 어긋난다.** `generateStaticParams`는 "어느 slug를 미리 굽나"이지 정적/동적 스위치가 아니다.

### 변경 — 다섯 파일에 같은 두 줄

**페이지 2곳** (`articles/[slug]/page.tsx:15` 앞, `guide/[stage]/page.tsx:16` 앞):
```ts
// 목록은 빌드 시점에 확정된다. dynamicParams를 꺼서 없는 slug 요청이 MDX 파이프라인을
// 켜지 않고 정적 404가 되게 한다 — 크롤러·스팸 URL이 곧 함수 실행이 되는 것을 막는다
// (showcase/[slug]/page.tsx:12와 같은 처방).
export const dynamicParams = false;
```

**OG 라우트 3곳** — 기존 주석을 **교체**하고 `dynamicParams` 추가. `articles/[slug]/opengraph-image.tsx:5-10`:
```ts
// 이 파일은 페이지와 별개의 Route Handler라 페이지의 dynamicParams를 상속하지
// 않는다(docs opengraph-image.md:322). 여기서도 꺼야 미지의 slug 요청이 이미지를
// 요청 시점에 그리지 않는다 — 그때 lib/ogFont.ts의 process.cwd() 경로는 번들
// 트레이싱 밖이라 500이 될 수 있다.
// (generateStaticParams는 "어느 slug를 미리 굽나"이고, 정적 최적화 자체는 기본값이다
// — docs opengraph-image.md:91.)
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}
```
`showcase/[slug]/opengraph-image.tsx:5-10`, `guide/[stage]/opengraph-image.tsx:4-8` 동일. **guide 파일은 `:9-10`의 import 두 줄을 `:1-2` 옆으로 올린다** — 함수 뒤 import는 동작하지만 ESLint `import/first`가 켜지면 걸린다.

### 함정

1. `page.tsx`의 `if (!article) notFound()`(`articles:42`)와 `if (!item) return {}`(`generateMetadata`)는 **그대로 둔다.** `dynamicParams=false`가 그 앞에서 끊지만, `generateStaticParams`가 반환한 slug 안에서도 `getArticleBySlug`가 실패할 수 없다는 보장은 코드로 남기는 편이 안전하다.
2. **`content/showcase`가 0편일 때** `generateStaticParams`가 `[]`를 반환하면서 `dynamicParams=false`면 Next가 빌드 경고를 낼 수 있다(빈 정적 경로). 지금은 6편이라 해당 없지만 `lib/showcase.ts:9-10`이 "0편이 정상 상태"라 적었다. **구현 시 `content/showcase`를 비우고 `next build` 한 번** — 경고면 무시, 오류면 OG 파일 쪽만 조건부로 푼다.
3. `lib/ogFont.ts:17`의 `process.cwd()`는 **그대로 둔다.** 정적 최적화 경로에서는 빌드 머신의 cwd라 항상 맞다. `outputFileTracingIncludes`는 동적 렌더가 있을 때만 필요하고, 이 변경이 그 경로를 닫는다.
4. `app/opengraph-image.tsx`(루트)는 동적 세그먼트가 없으니 대상 아님.

### 테스트 — `app/__tests__/segmentConfig.test.ts` (신설, node, 파일 텍스트 검사)

렌더 없이 소스를 읽어 규약을 잠근다(T6의 `routes.test.ts`와 같은 방식, `app/__tests__/`는 **아직 없는 디렉터리**라 이 라운드가 만든다).
```ts
const DYNAMIC_FILES = [
  "app/articles/[slug]/page.tsx", "app/articles/[slug]/opengraph-image.tsx",
  "app/guide/[stage]/page.tsx",   "app/guide/[stage]/opengraph-image.tsx",
  "app/showcase/[slug]/page.tsx", "app/showcase/[slug]/opengraph-image.tsx",
];
it.each(DYNAMIC_FILES)("%s 는 generateStaticParams와 dynamicParams=false를 함께 갖는다", (f) => {
  const src = fs.readFileSync(f, "utf8");
  expect(src).toMatch(/export function generateStaticParams/);
  expect(src).toMatch(/export const dynamicParams = false/);
});
it("동적 세그먼트 디렉터리는 위 목록이 전부다 (새 [param] 폴더가 생기면 여기 추가)", () => {
  // glob app/**/[[]*[]]/(page|opengraph-image).tsx 결과가 DYNAMIC_FILES와 집합으로 같다
});
```
두 번째 `it`이 NX6(네 번째 사본)의 답 절반이다 — 아래.

## NX3 + L2 + L3 — `app/api/search-papers/route.ts` 한 파일, 설계 하나로 병합

### 세 설계가 겹치는 지점

| 설계 | 만지는 줄 | 하는 일 |
| --- | --- | --- |
| L2 (batch06 §변경 2) | `:25` 삭제, `:34 :44-48`, `:51 :59-67`, `:71 :84-88`, `:91 :98-102` | `UPSTREAM_TIMEOUT_MS` 제거, fetch 4곳이 `signal` 인자를 받음 |
| L3 (batch06 §L3) | `:28` 근처 | `export const maxDuration = 20` + 주석 |
| NX3 | `:47 :66 :87 :101` | `next: { revalidate: CACHE_SECONDS }` 처리 |

L2가 이미 그 네 줄의 `fetch(...)` 옵션 객체를 다시 쓴다. NX3을 따로 커밋하면 **같은 네 줄을 두 번 연다.** 병합한다.

### NX3 판정 — `force-cache`를 넣나, `revalidate`를 지우나

문서:
- `docs/…/fetch.md:52`: 기본 `auto no cache` — "If Request-time APIs are detected on the route, Next.js will fetch the resource on every request."
- `:58`: "**Caching is opt-in.** Set `cache: 'force-cache'` to cache any request".
- `:60-70`: `next.revalidate`는 "Set the cache lifetime of a resource" — **캐시가 있을 때의 수명**이지 캐시를 켜는 스위치가 아니다.
- `docs/…/route.md:669`: v15.0.0-RC에서 GET 핸들러 기본이 static → dynamic.
- 이 라우트는 `req.nextUrl.searchParams`(`route.ts:106`)를 읽는다 → 요청 시점 API → 위 `:52`의 "매 요청" 경로.

따라서 지금 `next: { revalidate: 600 }`은 **아무 캐시 엔트리에도 붙지 않는다.** 백로그 판정이 맞다.

**두 선택지:**

| | (A) `cache: "force-cache"` 추가 | (B) `next: { revalidate }` 삭제 |
| --- | --- | --- |
| 효과 | Vercel Data Cache에 URL 단위 캐시. CDN 미스(다른 리전·`Vary`) 때 2층이 실제로 생긴다 | 캐시 층은 CDN 헤더 하나. 코드가 사실을 말한다 |
| `signal`과의 관계 | `fetch.md:90-97`은 `signal`이 **메모이제이션**을 끈다고만 하고 persistent cache와의 관계는 말하지 않는다. L2가 요청마다 다른 `AbortSignal.timeout`을 만드는데, 그 신호가 캐시 키에 안 들어가는지 **이 문서에서 확정 못 했다** | 무관 |
| 위험 | `x-api-key` 헤더가 캐시 키에 들어간다(`:54` "matches on URL, method, headers") — 키 회전 시 자연 무효화, 문제 없음. 200만 저장(`:56`) — 429·5xx 재사용 위험 없음 | 없음 |
| SC5 관점 | 검색어를 바꾸면 어차피 둘 다 우회된다 | 같음 |

**(B)를 채택한다.** (A)의 실익은 "CDN 미스 시 두 번째 층"인데, 이 사이트의 검색 트래픽은 한 리전(한국)이고 `s-maxage=600`이 이미 429를 막고 있음이 실측됐다(백로그 "잘 동작한다"). (A)는 `signal`과 Data Cache의 상호작용을 **추측**으로 넣는 것이고, 이 저장소의 원칙은 추측 금지다. 원하면 나중에 (A)를 별도 항목으로 실측해 올린다.

### 병합된 최종 형태 — `route.ts` 변경점 전부

**`:24-32` 상수 블록**:
```ts
const MAX_QUERY_LENGTH = 200;
const RESULT_LIMIT = 10;
const CACHE_SECONDS = 600;

/**
 * Vercel Function의 실행 상한(초).
 *
 * 명시하지 않으면 플랫폼 기본값에 걸려 504가 나가고, 그때는 NextResponse.json이
 * 실행조차 안 된다 — searchChain이 만든 한국어 오류 문구가 사용자에게 절대 닿지
 * 않는 경로가 생긴다. SUCCESS_HEADERS의 CDN 캐시도 안 붙는다.
 *
 * 세 상한의 관계(순서가 곧 설계다):
 *   SEARCH_BUDGET_MS 12s  <  CLIENT_TIMEOUT_MS 16s  <  maxDuration 20s
 * 정상 경로에서는 예산이 먼저 끝나 구체적인 오류 문구가 나가고,
 * 서버가 폭주해도 클라이언트 중단이 플랫폼 504보다 먼저 온다.
 * (docs route-segment-config/maxDuration.md — 라우트 파일 최상위 export)
 */
export const maxDuration = 20;

/**
 * 캐시는 이 헤더 한 층뿐이다.
 *
 * fetch 옵션의 `next: { revalidate }`는 여기서 아무것도 캐시하지 않았다 —
 * 이 핸들러는 searchParams를 읽는 요청 시점 라우트라 Next 데이터 캐시가
 * 애초에 켜지지 않는다(docs fetch.md:52·58 "Caching is opt-in", route.md:669
 * GET 기본 dynamic). 두 층이 있는 것처럼 읽히던 코드를 한 층으로 정직하게 줄였다.
 * 두 번째 층이 필요해지면 `cache: "force-cache"`를 실측 후 넣는다 — `signal`과
 * 데이터 캐시의 상호작용을 확인하지 않은 채로 넣지 말 것.
 */
const SUCCESS_HEADERS = {
  // 같은 검색어는 CDN에서 10분간 재사용 — 업스트림 429를 덜 만나게 함
  "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
};
```
`UPSTREAM_TIMEOUT_MS`(`:25`)는 L2대로 사라진다.

**fetch 4곳** — L2의 시그니처 + NX3의 옵션 정리를 한 번에. `fetchSemanticScholar` (`:34, :44-48`):
```ts
async function fetchSemanticScholar(query: string, signal: AbortSignal): Promise<Response> {
  // … :35-42 그대로 …
  return fetch(url, { headers, signal });
}
```
`fetchCrossref` (`:51, :59-67`): `return fetch(url, { headers: { … }, signal });`
`fetchOpenAlexByDois` (`:71, :84-88`): `async function fetchOpenAlexByDois(dois: string[], signal: AbortSignal)` … `return fetch(url, { headers: { Accept: "application/json" }, signal });`
`fetchOpenAlex` (`:91, :98-102`): 같은 방식.

`GET`(`:105-128`) 변경 없음 — batch06이 확인한 대로 `runSearchChain(query, {...})` 호출 형태 동일.

**`lib/searchChain.ts`·`components/PriorResearchSearch.tsx:7,29-33`·테스트는 batch06 §변경 1·3과 테스트 절을 그대로 따른다.** 이 문서는 `route.ts`의 최종 형태만 다시 정한다.

### 함정 (병합으로 새로 생기는 것만)

1. batch06 함정 2("`next.revalidate`와 `signal`을 같이 쓰는 것이 안전한가 … 현재 코드도 이미 signal을 넘기고 있으므로 동작은 변하지 않는다")는 **이 병합으로 소멸**한다 — `revalidate`가 없으니 물을 것이 없다.
2. `maxDuration`은 Vercel Hobby에서 기본 10초·최대 60초(batch06 함정 5). **Fluid Compute가 켜진 프로젝트면 기본값이 다르다** — 어느 쪽이든 20은 안전 범위. 로컬 `next dev`에서는 무시된다.
3. **`docs/…/maxDuration.md:6`**: "Deployment platforms can use `maxDuration` from the Next.js build output". `vercel.json`이 이 저장소에 없다(`git ls-files` 확인). 라우트 파일 export 하나로 충분하다 — `vercel.json`을 새로 만들지 마라.

### 커밋 — batch06 커밋 13에 흡수

batch06 커밋 13 `fix: 검색 예산을 단계별로 나누고 maxDuration을 명시한다 (L2, L3)` → 제목을 `(L2, L3, NX3)`으로 바꾸고 파일 목록의 `route.ts` 항목을 "`maxDuration`, `UPSTREAM_TIMEOUT_MS` 제거, fetch 4곳 `signal`, **`next.revalidate` 제거 + 캐시 층 주석**"으로. 테스트 추가 없음 — NX3은 동작 변화가 0이다(안 붙던 옵션을 지운 것). `npm test`의 기존 searchChain 9건 + batch06 추가분이 그대로 초록이면 된다.

## NX4. `PageProps` / `LayoutProps` / `RouteContext` 헬퍼

### 현재

`app/layout.tsx:56`이 **이미** `LayoutProps<"/">`를 쓴다. 나머지:
- `app/articles/[slug]/page.tsx:19-23, :34-38` — `{ params: Promise<{ slug: string }> }` 손글씨
- `app/guide/[stage]/page.tsx:20-24, :35-39` — 같음
- `app/showcase/[slug]/page.tsx:18-22, :29-33` — 같음
- OG 3곳 `:16-20` — 같음
- `app/api/search-papers/route.ts:105` `GET(req: NextRequest)` — 동적 세그먼트 없음, `RouteContext` 불필요

문서 `docs/…/page.md:125-140`: "`PageProps` … globally available helper … generated when running `next dev`, `next build` or `next typegen`". `generate-metadata.md:104`: `generateMetadata`의 첫 인자도 `PageProps<'/route'>`.

### 변경

```ts
// app/articles/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
```
guide → `PageProps<"/guide/[stage]">`, showcase → `PageProps<"/showcase/[slug]">`. import 불필요(`page.md:140`).

**OG 파일은 그대로 둔다.** `opengraph-image`용 헬퍼가 문서에 없고(`ImageProps` 없음), 손글씨 `{ params: Promise<{ slug: string }> }`가 정확하다.

### 함정 — 파트 0 #47

`tsconfig.json:30-31`이 `.next/types/**/*.ts`·`.next/dev/types/**/*.ts`를 포함한다. **깨끗한 체크아웃에서 `tsc --noEmit`을 먼저 돌리면 `PageProps`를 못 찾는다.** S1(CI)의 `typecheck` 스크립트는 `next typegen && tsc --noEmit`이어야 한다. **NX4는 S1 커밋 01 뒤에 넣고, 그 커밋에 `package.json`의 `typecheck` 스크립트 확인을 게이트로 둔다.** 이미 `layout.tsx:56`이 `LayoutProps`를 쓰고 있으므로 S1이 이 전제를 어차피 만나게 되지만, NX4가 그것을 3파일로 늘린다.

테스트 없음(타입만). 게이트: `npx next typegen && npx tsc --noEmit` 초록.

## NX5. `typedRoutes`

`docs/…/05-config/01-next-config-js/typedRoutes.md:6-14`: "This option has been marked as stable … `typedRoutes: true`".

### 실측 — 켜면 어디가 빨개지나

`` href={` `` 템플릿 리터럴 **23곳**(`grep -rn 'href={\`' app components`). 그중:
- `mailto:` 2곳(`about:122`, `privacy:131`) — `<a>`라 무관
- `#…` 앵커 2곳(`articles/page.tsx:64`, `articles/[slug]/page.tsx:114`) — `<a>`
- `<Link href={`/guide/${stage.slug}`}>` 류 **19곳** — `stage.slug`·`article.slug`가 `string`이라 `Route` 타입에 안 맞아 **전부 컴파일 오류**

typedRoutes는 동적 세그먼트 값을 검증하지 못한다(`/guide/${string}` 형태만 통과). 19곳 전부 `as Route` 캐스트 또는 `Route<\`/guide/${string}\`>` 표기가 필요하고, **그 캐스트가 S6의 원칙("런타임 검증 없이 캐스팅하지 않는다", batch05 O7 함정 2)과 정면충돌**한다.

### 판정 — **켜지 않는다. 대신 정적 경로 문자열만 잠근다.**

이 사이트의 링크 오타 위험은 두 종류다. (1) 정적 경로 오타(`/artcles`) — typedRoutes가 잡는다, 앱 코드에 정적 `href` 리터럴은 손에 꼽는다(`/guide`, `/articles`, `/tools`, `/showcase`, `/example`, `/about`, `/privacy`, `/activity`, `/guide/print`). (2) slug 오타 — typedRoutes가 **못** 잡고 `articles.test.ts:181-297`이 이미 잡는다.

(1)만을 위해 19곳에 캐스트를 뿌리는 것은 비용 대비가 나쁘다. **`app/__tests__/routes.test.ts`(T6가 신설)에 한 건 추가**:
```ts
it("앱 코드의 정적 href 리터럴은 전부 실재하는 라우트다", () => {
  // app/**/*.tsx, components/**/*.tsx에서 href="/..." 리터럴을 뽑아
  // app/ 디렉터리의 page.tsx 존재(동적 세그먼트 제외)와 대조
});
```
NX5는 이 테스트로 닫고 백로그를 `[-]`(기각, 사유: 캐스트 19곳)로 옮긴다. **운영자가 typedRoutes를 원하면** `next.config.ts:14`에 `typedRoutes: true` 한 줄 + 19곳 캐스트가 작업량이다.

## NX6. 네 번째 사본 — sitemap · robots · `notFound()` · `dynamicParams`

같은 사실("이 경로들이 정적으로 존재한다")을 네 곳이 따로 안다. T6(batch05 커밋 4, `app/__tests__/routes.test.ts`)이 sitemap↔robots를 대조한다. NX2의 `segmentConfig.test.ts`가 `generateStaticParams`↔`dynamicParams`를 대조한다. 남는 축 하나:

```ts
// app/__tests__/routes.test.ts 에 추가
it("sitemap의 동적 URL 집합은 generateStaticParams가 굽는 집합과 같다", () => {
  // sitemap()에서 /articles/*, /guide/*, /showcase/* 를 뽑아
  // getAllArticles·getAllStages·getAllShowcases의 slug 집합과 대조
});
```
`app/sitemap.ts:14-16`이 같은 세 함수를 쓰므로 지금은 항등이지만, 누군가 sitemap에서 필터를 걸거나 `generateStaticParams`에 조건을 넣는 순간 갈라진다. 코드 변경 0, 테스트 1건.

## NX7. `ViewTransition` — 주석 한 줄

`app/template.tsx:1` `import { ViewTransition } from "react"`. `docs/01-app/02-guides/view-transitions.md:50`: "The App Router uses React canary releases … You do not need to install `react@canary` yourself." 설치된 `react@19.2.8`에는 그 export가 없다(백로그 실측). `:3-6` 주석 뒤에 추가:

```ts
// ViewTransition은 설치된 react@19.2.8의 공개 export가 아니다. App Router가 자체
// canary 빌드로 alias해 런타임은 정상이지만(docs view-transitions.md:50), vitest는
// node_modules/react를 그대로 해석하므로 **이 파일을 import하는 테스트를 쓰면 죽는다.**
// template.tsx를 테스트하려면 vitest.config.ts의 resolve.alias에 react를
// next/dist/compiled/react로 거는 것부터 필요하다. 지금은 그런 테스트가 없다.
```
코드·테스트 변경 없음. **vitest alias는 넣지 않는다** — 필요가 생길 때 넣는다.

## NX8. 문제 없음

`cacheComponents`·`reactCompiler` 미사용은 옳다. `dynamicParams.md:22`: "`dynamicParams` is not available when Cache Components is enabled" — NX2가 `dynamicParams`에 기대므로 **Cache Components를 켜는 순간 NX2가 무효**가 된다. 두 결정이 서로 잠근다는 것만 백로그에 한 줄.

---

# 파트 3 — 성능 (PF1~PF12)

## PF1. 광고 예약 높이 — 고정 크기 단위로 전환

### 현재 — `components/AdSlot.tsx`

```tsx
  const sizeClass =
    variant === "rail" ? "h-[600px] w-[160px]" : "my-8 h-24 w-full";      // :37-38
  …
      data-ad-format={variant === "rail" ? "vertical" : "auto"}            // :58
      data-full-width-responsive={variant === "rail" ? "false" : "true"}   // :59
```

파트 0 #45: `auto` + `full-width-responsive=true`는 adsbygoogle가 `<ins>`에 인라인 `height`를 써서 **클래스를 이긴다**. 모바일에서 100~280px. 슬롯 위치는 `app/guide/[stage]/page.tsx:190-192` — 이전/다음 내비(`:194-213`) **바로 위**. 밀리는 것이 콘텐츠다.

### 변경 — 반응형 고정 높이 (AdSense의 "미디어쿼리로 광고 크기 지정" 방식)

`data-ad-format`·`data-full-width-responsive`를 **bottom 변형에서 제거**하고, 크기를 CSS가 정한다. AdSense는 `data-ad-format`이 없고 `<ins>`에 명시 width/height가 있으면 그 크기의 단위를 요청한다.

`app/globals.css` (`:124` `.tool-embed` 블록 뒤):
```css
/* 본문 하단 광고 — 높이를 우리가 정한다. data-ad-format="auto"는 광고가 높이를
   정하므로(모바일 100~280px) 어떤 예약 높이도 맞을 수 없고, 슬롯이 이전/다음
   내비 바로 위라 밀리는 것이 콘텐츠다(라운드 17 PF1). 폭 구간별로 표준 크기를
   고정해 CLS를 0으로 만든다. 320×100 / 468×60 / 728×90은 전부 AdSense 표준 단위. */
.ad-bottom {
  display: block;
  width: 320px;
  height: 100px;
}
@media (min-width: 500px) {
  .ad-bottom { width: 468px; height: 60px; }
}
@media (min-width: 800px) {
  .ad-bottom { width: 728px; height: 90px; }
}
```

`components/AdSlot.tsx:37-38, :51-60`:
```tsx
  const isRail = variant === "rail";

  // …useEffect 그대로…

  if (!clientId) return null;

  return (
    // 바깥 래퍼가 높이를 예약한다 — <ins>가 광고를 못 받아 비어도(승인 전·차단)
    // 아래 내비가 올라오지 않는다. 그 빈 자리는 O5의 판단(광고 없는 페이지에서
    // 슬롯 자체를 안 그린다)이 다룬다.
    <div className={isRail ? "" : "my-8 flex justify-center"}>
      <ins
        className={`adsbygoogle ${isRail ? "block h-[600px] w-[160px]" : "ad-bottom"}`}
        aria-label={label}
        data-ad-client={clientId}
        data-ad-slot={slot}
        {...(isRail
          ? { "data-ad-format": "vertical", "data-full-width-responsive": "false" }
          : {})}
      />
    </div>
  );
```
`style={{ display: "block" }}`(`:54`)은 `.ad-bottom`의 `display: block`과 rail의 `block` 클래스가 대신한다.

### 함정

1. **AdSense 정책상 `data-ad-slot` 단위의 종류와 맞아야 한다.** 대시보드에서 만든 단위가 "반응형"이면 CSS 크기 지정이 그대로 동작하지만, "고정 크기 728×90"로 만든 단위에 320×100을 요청하면 빈 응답이 온다. **E3(클라이언트 ID)을 켜는 시점에 단위를 "디스플레이 광고 · 반응형"으로 만들고 이 CSS와 함께 쓴다.** BR4 → O5 → E3 순서 제약에 PF1을 끼운다: **BR4 → O5 → PF1 → E3.**
2. `.ad-bottom`의 정확한 CSS 문법(`display:inline-block` vs `block`)은 AdSense 도움말 "반응형 광고 단위의 크기 지정"을 **구현 시 재확인**. 이 문서는 문법이 아니라 "고정 높이로 간다"는 판단을 확정한다.
3. 375px 화면에서 320px 단위 좌우 여백은 `flex justify-center`가 잡는다. 320px 미만 화면은 이 사이트가 `nav-scroll`(`globals.css:179-185`)로 이미 "가로 넘침 허용"한 영역이다.
4. rail 변형은 이미 고정 160×600 + `vertical` — 손대지 않는다. 다만 O5가 레일을 레이아웃에서 빼는 커밋(batch05 커밋 7)이 `AdSlot`을 부르는 위치를 바꾼다. **PF1은 O5 뒤.**

### 테스트 — `components/__tests__/AdSlot.test.tsx` (신설, jsdom)

```ts
it("클라이언트 ID가 없으면 아무것도 그리지 않는다 (현재 동작 보존)")
it("bottom 변형은 data-ad-format을 붙이지 않는다 (높이를 광고가 정하지 못하게)")
//   vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-test") 후 render
//   ins.getAttribute("data-ad-format") === null, ins.classList.contains("ad-bottom")
it("rail 변형은 vertical 고정이다 (회귀 방지)")
```
`process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID`는 `AdSlot.tsx:36`에서 렌더 시 읽으므로 `vi.stubEnv`가 먹는다. 인라인 `.ad-bottom` 높이 자체는 jsdom이 CSS를 안 계산하므로 `globalsCss.test.ts`(batch06 커밋 1이 신설)에 `expect(css).toMatch(/\.ad-bottom\s*\{[^}]*height:\s*100px/)` 한 줄.

## PF2. 도구 딥링크 CLS — 해시 유지 + "접지 않고 펼치기만"

### 현재 — `components/StageTools.tsx:125-147, :159, :190`

```tsx
  const [hashId] = useSeededState(() => (typeof window === "undefined" ? null : window.location.hash), [slug]);   // :128-131
  …
  const openIndex = targetToolId ? titles.findIndex((title) => TOOL_IDS[title] === targetToolId) : -1;  // :144-146
  …
            open={openIndex === -1 ? i === 0 : i === openIndex}     // :159
  …
            {opened.has(i) || i === openIndex ? ( … ) : null}        // :190
```
SSR·첫 렌더: `hashId === null` → `openIndex === -1` → **0번 열림**. 시드 후 `#tool-stats`(writing 단계의 1번)면 `openIndex === 0`… 아니, `stats`는 `STAGE_TOOL_TITLES.writing[0]`이라 우연히 같다. `#tool-ethics`(writing[8])면 **0번이 닫히고 8번이 열린다** — 0번 본문(통계 계산기, 긴 폼)이 사라지며 위로 당겨지고, 8번이 펼쳐진다. 두 방향 이동 = 백로그 진단 그대로.

### 세 선택지 비교

| | (1) `?tool=` 쿼리, 서버가 편다 | (2) 해시 + 시드 전 아무것도 안 펼침 | (3) 해시 + **0번은 유지, 대상은 추가로** 펼침 |
| --- | --- | --- | --- |
| 딥링크 진입 CLS | 0 | 대상 하나 펼침(아래로 한 방향) | 대상 하나 펼침(아래로 한 방향). 0번은 SSR 그대로 |
| **해시 없는 일반 진입 CLS** | 0 | **0번이 시드 후 펼쳐짐 — 모든 방문자가 한 번 겪는다** | 0 |
| 정적 프리렌더 | **잃는다** (파트 0 #44) | 유지 | 유지 |
| 파급 범위 | 아래 표 전부 | `StageTools.tsx`만 | `StageTools.tsx` 2줄 |
| 브라우저 앵커 스크롤 | 쿼리에는 앵커가 없어 **직접 `scrollIntoView`** 필요 → KB10과 얽힘 | 브라우저가 `#tool-xxx`(SSR에 있는 `<details id>`)로 스크롤 | 같음 |

**(1)의 파급 범위** — 실측:
- `lib/stageToolMeta.ts` `toolHref()` (batch05가 신설, A1·G1·O7 **세 발신처가 전부 이 함수를 거친다**) — 1곳
- `lib/__tests__/articles.test.ts:258-277` "`#tool-{id}` 앵커가 그 단계에 실제로 있는 도구다" — `link.hash.startsWith("tool-")` 검사가 쿼리 검사로 바뀌어야 함. `lib/articleLinks.ts:10-15` `InternalLink` 타입에 `query` 필드 추가 필요
- `content/articles/*.mdx` 본문의 `#tool-` 링크 **44개**(31편 중 27편) + `content/showcase/01-lysozyme:75` 1개 + batch7 P2가 추가할 5개 + batch7 H4·B2 1~2개 → **약 50개 MDX 링크 전부 재작성**
- `components/__tests__/StageTools.test.tsx:26-39, :56-63` (`window.location.hash` 설정) — 2건
- KB10(딥링크 후 포커스) — 쿼리면 앵커 스크롤·포커스를 코드가 떠안는다
- `app/showcase/page.tsx:51` (`#tools`, A1이 `toolHref`로 바꿈)

50개 MDX 링크와 정적 렌더 상실 — **(1) 기각.**

**(2)와 (3)의 차이는 "누가 CLS를 겪나"다.** (2)는 딥링크 사용자를 위해 **전체 방문자**에게 0번 펼침 CLS를 준다. 도구 섹션은 본문 아래라 대개 첫 화면 밖이지만(CLS 점수는 뷰포트 안만 센다), 짧은 단계·큰 화면에서는 안에 든다. (3)은 딥링크 사용자만 "대상 펼침" 한 번을 겪고, 그것도 아래 방향 한 번이다. **(3) 채택.**

### 변경 — `components/StageTools.tsx`

`:159`:
```tsx
            // 0번은 SSR에서 이미 열려 있다. 딥링크 대상이 다른 도구여도 0번을
            // 접지 않는다 — 접으면 본문이 사라지며 위로 당겨지고 대상이 아래서
            // 펼쳐지는 두 방향 이동이 된다(라운드 17 PF2). 펼치기만 하면 한 방향이고,
            // 브라우저가 이미 #tool-xxx로 스크롤해 둔 위치보다 위는 움직이지 않는다.
            open={i === 0 || i === openIndex}
```
`:190`의 `opened.has(i) || i === openIndex`는 그대로(0은 `opened` 초기값에 있다).

`:140` 주석 "시드 전(null)이거나 매치가 없으면 첫 항목을 편다" → "첫 항목은 항상 편다. 해시가 가리키는 도구는 **추가로** 편다".

### 함정

1. **딥링크 대상이 0번 아래에 있고 0번 본문이 길 때**(writing의 `#tool-ethics`) 브라우저 초기 스크롤은 SSR 시점의 위치(0번 펼침 상태)로 간다 → 시드 후 8번이 펼쳐져도 8번 `<summary>`의 화면 위치는 그대로다(위쪽 레이아웃 불변). 맞다. 단 `scroll-mt-24`(`:160`)는 그대로 둔다.
2. **`open`이 제어 prop이라 사용자가 0번을 접었다가 다른 도구 딥링크로 같은 페이지에 다시 오면**(해시만 변경, 클라이언트 네비) `useSeededState`의 deps가 `[slug]`라 재시드가 안 된다 — batch05 A1 함정("해시 재구독")이 지적한 그 문제. **PF2의 범위 밖**이고 batch05가 "백로그 신규 항목"으로 올리라 했다. 구현 시 `/tools`에서 같은 단계의 두 도구를 연속 클릭해 보고 깨지면 신규 항목. 이 문서는 그 항목의 최소 처방만 적어 둔다: `useSeededState`의 deps를 `[slug]`에서 `[slug, hashTick]`으로 늘리고 `hashchange` 리스너로 `hashTick`을 올린다(줄 `:128-131`, 약 8줄).
3. `StageTools.test.tsx:26-39` "나머지는 닫혀 있어야 한다"(`:34-37`)가 **깨진다** — 이제 0번도 열려 있다. `if (d.id !== "tool-sample-size" && d !== details[0]) expect(d.open).toBe(false)`로 고치고, 제목을 "#tool-sample-size로 진입하면 그 도구가 첫 도구와 함께 펼쳐진다"로. **의도된 변경이므로 테스트를 고치는 것이 맞다** — T1·N1·TQ6의 "잘못된 동작을 정본화"와는 반대 경우(옳은 새 동작으로 정본을 옮긴다).

### 테스트 — `components/__tests__/StageTools.test.tsx`

```ts
it("#tool-sample-size로 진입하면 그 도구가 첫 도구와 함께 펼쳐진다 (기존 :26 수정)")
it("딥링크 대상이 첫 도구가 아니어도 첫 도구는 접히지 않는다 (PF2 — 한 방향 이동)", async () => {
  window.location.hash = "#tool-ethics";            // writing[8]
  render(<ToolAccordion slug="writing" />);
  await waitFor(() => expect(document.getElementById("tool-ethics")?.open).toBe(true));
  expect(document.querySelectorAll("details")[0].open).toBe(true);
});
it("SSR 마크업(시드 전)에서는 첫 도구만 열려 있다", () => {
  // renderToStaticMarkup(<ToolAccordion slug="writing" />) → open 속성 개수 1
  // react-dom/server는 jsdom 없이 node에서 돌아간다
});
```
세 번째가 "서버 출력이 변하지 않았다"의 증거다 — PF2가 하이드레이션 불일치를 만들지 않음을 잠근다.

## PF3. 시드 전 `null` 4곳 — `ProgressOverview` 패턴 복제

### 실측

`useSeededState` 호출 16곳 중 **시드 전에 `return null`로 빠지는 곳은 4곳**(`grep -rn "=== null) return null\|!state.*return null"`):

| 파일 | 줄 | 위치(페이지) | 시드 후 나타나는 높이 |
| --- | --- | --- | --- |
| `components/ActivityHeatmap.tsx` | `:24` | `/activity` 상단 | 히트맵 전체(≈220px) |
| `components/StageDurations.tsx` | `:28` | `/activity` 히트맵 아래 | 목록(0~6행) |
| `components/ReferenceList.tsx` | `:49` | 도구 아코디언 안(2·5단계) | 카드 전체 |
| `components/ContinueCard.tsx` | `:28` | 홈(`app/page.tsx`) | 카드 1장(≈80px) — **재방문자만** |

옳게 푼 패턴은 `components/ProgressOverview.tsx:54-100` — `hydrated`로 **내용만** 비우고 `aria-hidden={!hydrated || undefined}`로 **같은 높이의 빈 셸**을 그린다(`:75-76` 주석이 이유를 적어 뒀다).

### 판정 — 넷을 같은 처방으로 다루지 않는다

- **`ContinueCard`는 손대지 않는다.** 신규 방문자에겐 영원히 없는 카드다. 빈 셸을 그리면 신규 방문자 전원이 80px 빈 자리를 본다 — 재방문자의 CLS 한 번보다 나쁘다. 백로그 "4곳"에서 **3곳으로 정정.**
- **`ActivityHeatmap`·`StageDurations`**: batch3 커밋 7(G3·L4)이 `ActivityHeatmap.tsx`를 **전면 교체**한다(`impl-plan-batch3.md:952-1110`). 그 교체본도 `:24` `if (byDay === null) return null`을 유지하고, 함정에 "G3 분기가 null 반환 **뒤에** 있어야 한다"(`:1111`)고 적었다. **PF3는 batch3 커밋 7 뒤에, 그 교체본 위에 얹는다** — 라운드 17 순서 제약 "AC3 + G3 + L4 + PF3 한 커밋"은 이 문서로 **"batch3 C7 → PF3 별도 커밋"**으로 바꾼다. 같은 커밋에 넣으면 G3의 빈 상태 분기와 PF3의 셸 분기가 한 diff에서 얽힌다.
- **`ReferenceList`**: 아코디언 안이라 뷰포트 안에 있을 때만 CLS. 처방은 같다.

### 변경 (셋 공통 형태)

`components/ActivityHeatmap.tsx` (batch3 교체본 기준) `:24`:
```tsx
  const hydrated = byDay !== null;
  // 시드 전에는 격자 자리를 같은 높이로 비워 둔다 — null을 돌려주면 시드 뒤
  // 히트맵이 끼어들며 아래 소요일수·단계 목록이 밀린다(ProgressOverview와 같은 처방).
  // 격자는 오늘 기준 12주라 행·열 수가 데이터와 무관하게 결정적이다.
  const data = byDay ?? {};
```
이후 `byDay[…]`를 `data[…]`로, 최상위 `<section>`에 `aria-hidden={!hydrated || undefined}`. G3의 빈 상태 분기(`totalCount === 0`)는 **`hydrated &&`를 앞에 붙인다** — 시드 전엔 "기록이 없어요"도 보이면 안 된다.

`components/StageDurations.tsx:28-31`:
```tsx
  const hydrated = seeded !== null;
  const durations = seeded ?? {};
  const hasAny = hydrated && stages.some(…);
```
빈 상태 `<p>`(`:36-39`)와 목록 둘 다 `hydrated` 뒤에. 시드 전 높이: `SectionHead` + `<p>` 한 줄이 최소 높이이므로 **빈 상태 문구를 `invisible`로 그려 자리를 잡는다**(`ProgressOverview.tsx:87-90`의 `invisible` 기법).

`components/ReferenceList.tsx:49`: `if (seeded === null) return null;` 삭제. `:18`의 `refs = seeded ?? []`가 이미 있다. `<section>`에 `aria-hidden={seeded === null || undefined}`, 빈 목록 문구(`:57-`)는 `seeded !== null &&`.

### 함정

- `aria-hidden`을 준 셸 안에 **포커스 가능한 요소가 있으면 L5 위반**(axe "aria-hidden focusable"). `ReferenceList`의 복사·삭제 버튼은 `refs`가 빈 시드 전에는 렌더되지 않으므로 안전. `ActivityHeatmap`은 링크가 없다(batch3 교체본의 `Link`는 빈 상태 분기 안 — `hydrated &&` 뒤). **`StageDurations`는 G4가 `<Link>`를 건다** — G4 뒤라면 `hydrated` 게이트 안에 있어야 한다.
- `ProgressOverview.tsx:46-47`의 `suppressHydrationWarning`은 이 셋에 필요 없다 — 시드 전 출력이 서버와 같다.

### 테스트

각 컴포넌트 테스트에 1건씩:
```ts
it("시드 전에도 섹션 노드가 존재하고 aria-hidden이다 (PF3 — 높이 예약)", () => {
  // useSeededState를 vi.mock해 [null, vi.fn()]을 돌려주고 render
  // container.querySelector("section")?.getAttribute("aria-hidden") === "true"
});
```
`useSeededState`를 mock하는 방식은 `lib/useSeededState.ts:22-40`가 단순해서 안전하다. **`ContinueCard`에는 반대 테스트**: "시드 전에는 아무것도 그리지 않는다 (의도된 동작 — 신규 방문자에게 빈 자리를 보이지 않는다)".

## PF4. `SurveyBiasChecker` 헛계산 — 한 줄

`components/SurveyBiasChecker.tsx:37-40`:
```tsx
  const flagged = lines.map((line) => ({ line, hints: LEADING_PATTERNS.filter((p) => p.re.test(line)).map((p) => p.hint) }));
```
형제 `components/ImradChecker.tsx:103, :105`는 `checked ? splitBySections(text) : {}` / `checked ? findOptionalSections(text) : []`.

변경:
```tsx
  // 점검 버튼을 누르기 전에는 계산하지 않는다 — 키 입력마다 정규식 6개(:15는 긴
  // 전방탐색)를 전 줄에 돌리는 것은 헛일이고, 결과는 checked일 때만 그린다(:76).
  // ImradChecker(:103)와 같은 게이팅.
  const flagged = checked
    ? lines.map((line) => ({ line, hints: LEADING_PATTERNS.filter((p) => p.re.test(line)).map((p) => p.hint) }))
    : [];
```
`:70`의 `disabled={lines.length === 0}`는 `lines`만 보므로 영향 없음. `:76 {checked && …flagged.map…}`가 빈 배열에도 안전.

테스트(`components/__tests__/SurveyBiasChecker.test.tsx` 신설, jsdom): 
```ts
it("점검 버튼을 누르기 전에는 결과 목록이 없다 (게이팅)")
it("누르면 유도 표현이 있는 줄에 힌트가 붙는다 (정상)")   // "당연히" 한 줄
it("입력을 고치면 결과가 사라지고 다시 눌러야 한다 (stale 방지, :56)")
```
성능 자체는 테스트로 재지 않는다 — 두 번째·세 번째가 동작 보존의 증거다.

## PF5. `logActivity` 동기 파싱 — 클릭 핸들러 밖으로

### 현재

`lib/activity.ts:28-38` `logActivity`: `getActivityLog()`(`JSON.parse` + `filter(isActivityEntry)` — 항목마다 `new Date()`(`:24`)) → `push` → `slice` → `stringify` → `setItem`. **2,000건 상한**(`:2`).
호출부: `components/ChecklistCard.tsx:29` 체크박스 `toggle` 안, `components/EthicsChecklist.tsx:114` 같음, `components/ReflectionBox.tsx:53-56`은 **3초 디바운스**.

체크박스 클릭 = `setChecked` + `writeChecklist`(동기 `setItem` + 이벤트, `lib/checklist.ts:64-75`) + `logActivity`(2,000건 파싱·직렬화). INP에 잡히는 것은 이 세 번째다.

### 변경 — `lib/activity.ts`에 지연 진입점 하나

```ts
/**
 * 사용자 입력 핸들러에서 부를 때 쓰는 변형. 다음 태스크로 미뤄 클릭의 페인트를
 * 막지 않는다 — 로그는 2,000건까지 쌓이고(:2) 매번 전량 파싱·직렬화하므로
 * 체크박스 한 번의 INP에 그대로 얹힌다(라운드 17 PF5). ReflectionBox는 이미
 * 3초 디바운스로 같은 일을 했고, 체크박스만 동기였다.
 *
 * 미룬 사이 탭이 닫히면 그 한 건은 잃는다. 활동 로그는 통계용이라 감수한다
 * (체크 상태 자체는 writeChecklist가 동기로 저장했다).
 */
export function logActivityDeferred(entry: Omit<ActivityEntry, "occurredAt">): void {
  // occurredAt은 지금 시각이어야 한다 — 미뤄진 뒤의 시각이 아니라
  const occurredAt = new Date().toISOString();
  window.setTimeout(() => appendEntry({ ...entry, occurredAt }), 0);
}
```
`logActivity`(`:28-38`)의 본문을 `appendEntry(entry: ActivityEntry)`로 빼고 `logActivity`는 `appendEntry({ ...entry, occurredAt: new Date().toISOString() })`. 기존 시그니처·동작 불변(`ReflectionBox`가 계속 쓴다).

`ChecklistCard.tsx:29`·`EthicsChecklist.tsx:114`: `logActivity` → `logActivityDeferred`.

### `isActivityEntry`의 `new Date()` (`:24`)는 그대로 둔다

읽기 검증에서 날짜 파싱을 빼면 `getActivityByDay`(`:66`)가 어차피 파싱하고, `activity.test.ts:43-55`가 "not-a-date"를 거르는 것을 계약으로 잠갔다. 2,000건 × `new Date()`는 밀리초 한 자리다 — 문제는 그 위치(핸들러 안)였지 양이 아니다.

### 테스트 — `lib/__tests__/activity.test.ts`

```ts
it("logActivityDeferred는 호출 시각을 기록하고 저장은 다음 태스크로 미룬다", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 1, 12));
  logActivityDeferred({ type: "STAGE_ITEM_DONE", refId: "topic:0" });
  expect(store.get(LOG_KEY)).toBeUndefined();          // 아직 안 씀
  vi.setSystemTime(new Date(2026, 8, 1, 13));          // 미뤄진 사이 시간이 흘러도
  vi.runAllTimers();
  expect(JSON.parse(store.get(LOG_KEY)!)[0].occurredAt).toBe(at(2026, 9, 1, 12));  // 호출 시각
});
```
`activity.test.ts:3-9`의 `window` 스텁에 `setTimeout`이 없다 — `vi.stubGlobal("window", { localStorage, setTimeout: globalThis.setTimeout })`로 한 줄 보강. `ChecklistCard.test.tsx`는 `logActivity`를 mock하고 있으면(확인: `components/__tests__/ChecklistCard.test.tsx`) mock 대상 이름만 바꾼다. **구현 시 확인.**

## PF6 → L7. `usePersistentState` — 업데이터 순수화, 그 위에 디바운스

### 현재 — `lib/usePersistentState.ts:61-76`

```ts
  function set(next: T | ((prev: T) => T)) {
    setSeeded((prev) => {
      const base = prev ?? initialValue;
      const resolved = typeof next === "function" ? (next as (p: T) => T)(base) : next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(resolved));   // ← 업데이터 안
        setSaveError(null);                                                    // ← 업데이터 안 setState
      } catch {
        setSaveError(PERSIST_ERROR_MESSAGE);
      }
      return resolved;
    });
  }
```
StrictMode(dev)에서 업데이터가 두 번 불려 `setItem`이 두 번, 그리고 **렌더 단계에서 다른 컴포넌트 상태를 setState**하는 것은 React가 경고하는 패턴이다.

### batch7 L7과의 충돌 (파트 0 #46)

batch7 `impl-plan-batch7.md:94-104`의 확정 코드는 업데이터 안에서 `pendingRef.current = { key, value }`를 쓰고 "멱등이라 괜찮다"고 적었다. 멱등은 맞지만 PF6의 요구("업데이터를 순수하게")와 어긋난다. batch7 「구현 시 판단 1」("함수형 업데이터 안 ref 쓰기 vs 밖에서 계산")이 열어 둔 선택을 **여기서 닫는다: 둘 다 아니고, 커밋 뒤 `useEffect`에서 쓴다.** 상태 → 외부 저장소 동기화는 React가 이펙트에 두라고 하는 바로 그 일이고, 함수형 업데이트 여러 번이 한 커밋으로 합쳐질 때 **이펙트는 최종값으로 한 번만** 돈다(batch7이 원했던 "한 핸들러에서 set을 두 번 부르는 호출부"가 자연히 처리된다).

### 변경 후 코드 — 전문 (batch7 L7의 전문을 이것으로 대체)

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSeededState } from "./useSeededState";

export const PERSIST_ERROR_MESSAGE =
  "브라우저 저장소에 저장하지 못했습니다(프라이빗 모드나 저장 공간 부족일 수 있어요). 이 내용은 새로고침하면 사라집니다.";

/**
 * 쓰기를 미루는 최대 시간(ms). 리셋형 디바운스가 아니라 선행 타이머를 연장하지
 * 않는 트레일링 스로틀이다 — 빠르게 계속 타이핑해도 250ms마다 한 번은 쓴다.
 * (근거·상황별 표는 docs/impl-plan-batch7.md §L7.)
 */
const WRITE_DELAY_MS = 250;

export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void, string | null] {
  const storageKey = `research-guide:tool:${key}`;
  const [initialValue] = useState(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [seeded, setSeeded] = useSeededState<T>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        if (typeof parsed === typeof initialValue) return parsed;
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) 또는 파싱 실패 — 기본값 유지
    }
    return initialValue;
  }, [storageKey]);
  const value = seeded ?? initialValue;

  // "사용자가 바꾼 뒤 아직 디스크에 안 내려간 값"만 쓴다. 시드로 들어온 값을
  // 되쓰지 않기 위한 표식 — 시드 직후 이펙트가 돌 때 이 값은 null이다.
  const pendingRef = useRef<{ key: string; value: T } | null>(null);
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (pending === null) return;
    pendingRef.current = null;
    try {
      window.localStorage.setItem(pending.key, JSON.stringify(pending.value));
      setSaveError(null);
    } catch {
      setSaveError(PERSIST_ERROR_MESSAGE);
    }
  }, []);

  // 상태 → 저장소 동기화는 커밋 뒤 이펙트에서 한다. 업데이터 안에서 setItem을
  // 부르면 React가 업데이터를 순수 함수로 가정하는 것과 어긋나 StrictMode에서
  // 두 번 쓰이고, 렌더 중 다른 상태(saveError)를 바꾸게 된다(라운드 17 PF6).
  // 이펙트는 한 커밋당 최종값으로 한 번만 돈다 — 한 핸들러에서 set을 두 번
  // 불러도 쓰기는 한 번이다.
  useEffect(() => {
    if (seeded === null || !dirtyRef.current) return;
    dirtyRef.current = false;
    pendingRef.current = { key: storageKey, value: seeded };
    if (timerRef.current === null) {
      timerRef.current = window.setTimeout(flush, WRITE_DELAY_MS);
    }
  }, [seeded, storageKey, flush]);

  // 언마운트·키 변경 전에 반드시 내보낸다(cleanup은 동기). pendingRef가 옛 키를
  // 들고 있으므로 slug 이동 시 옛 값은 옛 키로 내려간다.
  useEffect(() => flush, [flush, storageKey]);

  // 탭 닫기·백그라운드 전환은 cleanup이 안 돈다. pagehide가 모바일 사파리까지
  // 실제로 발화하는 유일한 신호다(beforeunload는 bfcache를 깨므로 쓰지 않는다).
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [flush]);

  // "이 값은 사용자가 바꾼 것"의 표식. set()은 이벤트 핸들러에서 불리므로
  // 여기서 ref를 쓰는 것은 렌더 밖의 부수효과라 괜찮다.
  const dirtyRef = useRef(false);

  function set(next: T | ((prev: T) => T)) {
    dirtyRef.current = true;
    setSeeded((prev) => {
      const base = prev ?? initialValue;
      return typeof next === "function" ? (next as (p: T) => T)(base) : next;
    });
  }

  return [value, set, saveError];
}
```
(`dirtyRef` 선언은 실제 파일에서는 `pendingRef` 옆에 둔다 — 위에서는 설명 순서로 아래에 적었다.)

**업데이터는 이제 `prev → next`만 계산한다.** 부수효과 0.

### 시드 되쓰기 방지의 정확한 동작

| 시점 | `seeded` | `dirtyRef` | 이펙트 |
| --- | --- | --- | --- |
| 첫 렌더 | `null` | false | `seeded === null` → 반환 |
| 시드 커밋 | 저장값 | false | `!dirty` → 반환 (**되쓰지 않는다**) |
| 사용자 `set` | 새 값 | true | pending 등록, 타이머 |
| `storageKey` 변경 | `null` → 새 시드 | false (직전 flush가 pending 소진) | 반환 |

`set`이 시드 전(`seeded === null`)에 불리면 `setSeeded(prev => …)`가 `null ?? initialValue` 위에서 계산해 `seeded`를 채우고, `dirty=true`라 이펙트가 쓴다. 현재 코드와 같다.

### 기존 테스트 — `lib/__tests__/usePersistentState.test.tsx` 5건

| 줄 | `it()` | 판정 |
| --- | --- | --- |
| `:36` 저장된 값을 마운트 후 복원 | 통과 |
| `:42` 값을 바꾸면 localStorage에 저장 | **깨진다** — `:47`이 클릭 직후 동기로 `getItem`을 본다. 250ms 뒤다. `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(250))` 뒤에 단언. (batch7 판정과 동일) |
| `:50` setItem이 던지면 저장 실패를 노출 | **깨진다** — `:62`가 클릭 직후 `saveError`를 본다. 같은 처리. **`:56`("클릭 전 error가 빈 문자열")은 그대로 통과해야 한다** — 이것이 "시드 되쓰기가 없다"의 증거다. 되쓰면 마운트 직후 `setItem`이 던져 경고가 미리 뜬다 |
| `:67` 읽기 실패 | 통과 |
| `:77` 손상 저장값 | 통과 |

### 추가 테스트

```ts
it("업데이터는 StrictMode 이중 호출에서도 저장을 한 번만 한다 (PF6)", async () => {
  // <StrictMode><Probe/></StrictMode>, setItem spy, 클릭, 타이머 진행 → spy 호출 1회
});
it("시드된 값은 되쓰지 않는다 (마운트 직후 setItem 0회)", () => {
  // 저장값 세팅 → render → 타이머 진행 → setItem spy 0회
});
it("한 핸들러에서 set을 두 번 부르면 마지막 값 한 번만 저장한다", …)
it("언마운트 시 대기 중인 값을 즉시 저장한다 (flush)", …)
it("pagehide에 대기 중인 값을 저장한다", …)     // window.dispatchEvent(new Event("pagehide"))
```
마지막 둘은 batch7이 설계한 것과 같다.

### 함정

1. **`useSeededState`가 `storageKey` 변경 시 `null`로 되돌리지 않는다** — `lib/useSeededState.ts:28-37`은 `setState(load())`만 한다. 즉 키가 바뀌는 커밋에서 `seeded`는 **옛 값 → 새 시드값**으로 바로 간다. 그 커밋에서 `dirtyRef`는 false(직전 cleanup flush가 pending을 소진)이므로 이펙트가 옛 값을 새 키에 쓰지 않는다. **단, cleanup(`useEffect(() => flush, [flush, storageKey])`)이 새 시드 이펙트보다 먼저 도는 순서에 의존한다** — React는 같은 커밋에서 이전 이펙트 cleanup을 전부 돌린 뒤 새 이펙트를 돌리므로 보장된다.
2. `saveError`가 켜지는 시점이 "입력 멈춤 후 ≤250ms"로 늦어지는 것은 batch7 §L7 「saveError는 언제 나타나나」의 판정 그대로 수용.
3. **C4(`PersistNotice`)는 이 훅의 *읽는* 쪽이라 무관** — batch7 판정 유지. 순서 **PF6/L7 → C4**.
4. SC8(공용 훅의 타입검사 한 줄)이 `:52`의 `typeof parsed === typeof initialValue`를 만진다 — 같은 파일이지만 다른 줄. SC8은 이 라운드 범위 밖. 이 커밋이 먼저 들어가면 SC8은 시드 함수(`:46-58`)만 고치면 된다.

### 커밋 — batch7 L7 커밋을 대체

batch7의 L7 커밋(`impl-plan-batch7.md:1736` "2 L7 usePersistentState 디바운스")을 **`fix: usePersistentState 쓰기를 커밋 뒤 이펙트로 옮기고 250ms 스로틀 (PF6, L7)`** 한 커밋으로. 두 항목을 나누면 중간 상태(이펙트 이동만, 디바운스 없음)에서 테스트 `:42 :50`이 한 번 고쳐지고 다음 커밋에서 또 고쳐진다.

## PF7. `AcademicPhrases` — 정적 배열 재생성 + 검색어 저장

`components/AcademicPhrases.tsx`:
- `:16-20` `allPhrases()`가 호출마다 `flatMap`으로 **36개짜리 새 배열**. `:39`에서 검색할 때마다 부른다.
- `:23-26` `usePersistentState("academic-phrases", { section, query })` — **검색어가 localStorage에 남는다.** 다음 방문에 지난 검색어가 입력칸에 채워진 채 열리고, 그 순간 `:32 searching = true`라 섹션 칩이 사라진 화면(`:85`)이 첫 화면이 된다(KB9와 같은 증상의 원인).

변경:
```tsx
// 모듈 로드 시 한 번만 — 정적 데이터를 렌더마다 다시 펴는 일이 없게 한다.
const ALL_PHRASES: Hit[] = PHRASE_SECTIONS.flatMap((section) =>
  PHRASES[section].map((p) => ({ ...p, section })),
);

export function AcademicPhrases() {
  // 섹션 선택만 기억한다. 검색어는 "지금 찾는 것"이라 다음 방문에 남기지 않는다 —
  // 남기면 지난 검색어로 열리며 섹션 칩이 사라진 화면이 첫 화면이 된다.
  const [section, setSection] = usePersistentState<PhraseSection>("academic-phrases-section", "서론");
  const [query, setQuery] = useState("");
```
`:39` `allPhrases()` → `ALL_PHRASES`. `:78 :93`의 `setForm(prev => ({...prev, …}))` → `setQuery(e.target.value)` / `setSection(s)`.

**함정 — 저장 키가 바뀐다.** `research-guide:tool:academic-phrases`(객체) → `research-guide:tool:academic-phrases-section`(문자열). 옛 키는 남는다(고아). T8(`lib/storageKeys.ts`, batch05)이 키 목록을 `/privacy`와 대조하므로 **T8의 목록에서 이 키 이름을 바꾼다.** 옛 키를 지우는 마이그레이션은 쓰지 않는다 — DataReset(ER7·ER8·K1)의 프리픽스 삭제가 언젠가 지운다. 같은 키를 유지하고 `typeof` 검사(`usePersistentState.ts:52`)로 옛 객체를 거르는 대안도 있지만, `typeof {…} === "object"`와 `typeof "서론" === "string"`이 달라 자동으로 기본값 폴백된다 — **키를 바꾸지 않아도 된다.** 키 유지 쪽을 택한다: `usePersistentState<PhraseSection>("academic-phrases", "서론")`. 옛 저장값(객체)은 형태 불일치로 버려지고 첫 렌더에 "서론"이 된다. T8 목록 변경 없음.

테스트(`components/__tests__/AcademicPhrases.test.tsx` 신설):
```ts
it("검색어는 localStorage에 남지 않는다 (PF7)")       // 타이핑 후 research-guide:tool:academic-phrases 값이 "서론" 같은 섹션 문자열
it("옛 형태({section, query})가 저장돼 있으면 무시하고 서론으로 시작한다 (마이그레이션 없음)")
it("섹션 선택은 저장된다")
```

## PF8. 도구 하나를 펼치면 열린 도구 전부 리렌더

`StageTools.tsx:161-166` `onToggle` → `setOpened` → `ToolAccordion` 리렌더 → `:155-196`의 `titles.map`이 **`TOOL_RENDERERS[title](slug)`를 다시 호출해 새 엘리먼트를 만든다** → 열린 도구 전부(`StatsCalculator` 등 무거운 폼) 리렌더. 상태는 보존되지만 렌더 비용은 든다.

변경 — 행을 `memo` 컴포넌트로 뺀다:
```tsx
const ToolRow = memo(function ToolRow({
  title, slug, open, rendered, onOpen,
}: { title: ToolTitle; slug: string; open: boolean; rendered: boolean; onOpen: () => void }) {
  return (
    <details id={`tool-${TOOL_IDS[title]}`} open={open} className="group scroll-mt-24"
      onToggle={(e) => { if (e.currentTarget.open) onOpen(); }}>
      <summary …>…{title}…</summary>
      {rendered ? <div className="tool-embed …">{TOOL_RENDERERS[title](slug)}</div> : null}
    </details>
  );
});
```
`ToolAccordion`에서 `onOpen`은 인덱스별로 안정해야 한다 — `useCallback`으로 `(i) => setOpened(prev => prev.has(i) ? prev : new Set(prev).add(i))` 하나를 만들고 `ToolRow`에 `index`를 넘겨 안에서 `onOpen(index)`. 그러면 props `(title, slug, open, rendered, index, onOpen)`이 전부 원시값/안정 참조라 `memo`가 먹는다. **`open`은 PF2의 `i === 0 || i === openIndex`**, `rendered`는 `opened.has(i) || i === openIndex`.

함정: `TOOL_RENDERERS[title](slug)`는 `ToolRow` 안에서 불리므로 `ToolRow`가 리렌더될 때만 새 엘리먼트를 만든다 — 그것이 목적이다. `dynamic()` 컴포넌트는 참조가 모듈 레벨이라 안정.

테스트(`StageTools.test.tsx`):
```ts
it("다른 도구를 열어도 이미 열린 도구는 리렌더되지 않는다 (PF8)", () => {
  // TOOL_RENDERERS를 vi.mock할 수 없으므로(모듈 내부 상수) 대신
  // 첫 도구 본문 안의 DOM 노드 참조가 토글 전후 동일한지(===) 확인 — 리렌더돼도 같은
  // 노드가 재사용되므로 이건 증거가 안 된다. **실제 증거는 React Profiler**:
  // <Profiler id="tools" onRender={spy}>로 감싸 두 번째 details 토글 뒤 첫 도구
  // 서브트리의 render 횟수가 늘지 않음을 본다.
});
```
`Profiler` 방식이 jsdom에서 동작하는지 **구현 시 확인**. 안 되면 `StatsCalculator` 자리에 렌더 카운터 컴포넌트를 주입하는 테스트 전용 `TOOL_RENDERERS` override가 필요한데 그건 구조 변경이라 **테스트 없이 코드 리뷰로 대신**하는 것도 허용한다.

## PF9. 스크롤 강제 레이아웃 — **조치 없음** (파트 0 #43)

`StageRail.tsx:94-104` 주석이 이미 "계산도 제목 십수 개 rect 조회뿐이라 싸다"고 판단했고 그 판단이 맞다. 백로그를 "확인했고 문제 없음"으로 옮긴다. `IntersectionObserver`로 바꾸지 말 것 — 같은 주석 `:97-99`가 실브라우저 실측으로 기각한 이유를 적어 뒀다.

## PF10. → NX2와 같은 커밋 (파트 2)

## PF11. 페이지 전환 480ms — 운영자 판단

`app/globals.css:131-137`: exit 160ms, enter `320ms … 60ms` fade + `420ms … 60ms` rise → 마지막 애니메이션 종료 **480ms**. `:129-130` 주석: "이전 버전은 8px/220ms로 거의 안 보인다는 피드백을 받아 이동 거리·지속시간을 키움" — **의도된 값**이다.

**판단 재료만 둔다:**
- 전환 중 클릭은 `:159-161`이 통과시키므로 480ms가 입력을 막지는 않는다. 체감 지연은 "화면이 자리 잡는 시간"이다.
- `prefers-reduced-motion`은 `:163-170`이 0.01ms로 죽인다.
- 줄이려면 `:136-137`의 `420ms`·`60ms` 두 숫자. 예: 지연 60→0, rise 420→280 = 총 280ms. `:152`의 28px는 그대로 둬도 된다(거리보다 시간이 체감을 정한다).

**운영자가 "지금 값 유지"면 코드 변경 0.** 어느 쪽이든 테스트 없음 — `globalsCss.test.ts`에 지속시간을 잠그면 다음 조정 때 테스트부터 고쳐야 해서 오히려 방해다.

## PF12. `storage` 이벤트 필터

`lib/checklist.ts:108-115` `subscribeChecklist`가 `"storage"`를 키 검사 없이 구독 → 다른 탭이 `research-guide:tool:length-checker`를 쓰기만 해도 `StageRail`(`:45-55`)·`StageToc`(`:23-32`)·`ProgressOverview`(`:36-40`)가 단계 전체 `countDone`을 재계산(6단계 × `readChecklist`, 각각 `JSON.parse`). `components/ReferenceList.tsx:26`도 같다.

변경 `lib/checklist.ts:108-115`:
```ts
export function subscribeChecklist(cb: () => void): () => void {
  // 다른 탭의 storage 이벤트는 키를 보고 거른다 — 이 저장소의 키가 아니면
  // (도구 입력값·테마·활동 로그) 6단계 전체를 다시 세지 않는다. key === null은
  // localStorage.clear()(DataReset)이므로 통과시킨다.
  function onStorage(e: StorageEvent) {
    if (e.key === null || e.key.startsWith("research-guide:checklist:") || e.key.startsWith("research-guide:ethics:")) cb();
  }
  window.addEventListener(CHECKLIST_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHECKLIST_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
```
프리픽스 두 개는 `checklistKey`(`:16-18`)의 `Kind`와 짝이다 — `Kind`가 늘면 여기도. `ReferenceList.tsx:20-30`: `(e: StorageEvent) => { if (e.key === null || e.key === "research-guide:references") reload(); }` — 키 상수는 `lib/citations.ts:67`의 `REFERENCES_STORAGE_KEY`인데 **export가 안 돼 있다.** `export` 붙이고 import한다(T8의 `lib/storageKeys.ts`가 들어와 있으면 그쪽에서).

테스트(`lib/__tests__/checklist.test.ts` 추가):
```ts
it("다른 키의 storage 이벤트는 구독자를 깨우지 않는다 (PF12)")
//   dispatch new StorageEvent("storage", { key: "research-guide:tool:x" }) → cb 0회
it("체크리스트 키와 clear(null key)는 깨운다")
```
`jsdom`의 `StorageEvent` 생성자는 `key`를 받는다. 기존 `checklist.test.ts`가 node 환경이면 이 두 건만 `// @vitest-environment jsdom` 파일로 분리.

---

# 파트 4 — 보안 (SC5, SC6)

## SC5. 검색 API 레이트리밋 — Vercel Firewall(코드 0) vs 인스턴스 로컬 토큰 버킷

### 현재

`app/api/search-papers/route.ts:105-115`: 빈 검색어 400, 200자 초과 400. **빈도 제한 0.** `SEMANTIC_SCHOLAR_API_KEY`(`:41-42`)가 설정되면 요청마다 붙는다(AB3: 지금은 미설정이라 위험이 잠복).

### 인스턴스 로컬 토큰 버킷의 한계 — 서버리스에서 왜 부족한가

`Map<ip, bucket>`을 모듈 레벨에 두는 방식:
- **인스턴스마다 별개의 Map이다.** Vercel Function은 동시성에 따라 인스턴스가 늘고, 요청이 어느 인스턴스에 가는지 제어할 수 없다. 분당 30회 제한을 걸어도 인스턴스가 5개면 실효 150회.
- **콜드스타트에 지워진다.** 공격자는 간격을 두고 새 인스턴스를 만나면 된다.
- Fluid Compute면 인스턴스 재사용률이 높아 조금 낫지만 보장이 아니다.
- **IP 식별**: `req.headers.get("x-forwarded-for")`의 첫 항목 — Vercel이 채우지만 헤더 스푸핑을 플랫폼이 걸러 주는지는 **확정 못 한 사실**. Firewall은 그 층 아래에서 실제 접속 IP로 센다.
- 유일한 장점: 코드 안에 있어 테스트되고, 429 응답에 한국어 문구를 실을 수 있다.

### Vercel Firewall Rate Limit

Vercel 문서(`vercel.com/docs/cli/firewall` — `vercel firewall rules add` 옵션): `--action rate_limit`, `--rate-limit-window`(10~3600초), `--rate-limit-requests`, `--rate-limit-keys ip|ja4|header:<name>`, `--rate-limit-algo fixed_window|token_bucket`, `--rate-limit-action rate_limit|deny|challenge|log`. 조건은 `path` 타입으로 `/api/search-papers` 접두 매치. 코드 변경 0, 엣지에서 센다, 인스턴스 수와 무관.

**확인 못 한 것 — 요금제.** 이 세션이 읽은 Vercel 문서 검색 결과에는 요금제별 가용성이 없었다. Firewall 커스텀 규칙의 레이트리밋이 **Hobby에서 되는지**는 대시보드 → 프로젝트 → Firewall → "Add rule"에서 `Rate limit` 액션이 보이는지로 확인해야 한다. **운영자 확인 항목.**

### 판정

1. **Firewall 규칙을 1순위로.** 조건 `path starts with /api/search-papers`, 키 `ip`, 알고리즘 `token_bucket`, **분당 20회**(사람이 검색 폼으로 낼 수 있는 상한의 3~4배), 초과 액션 `rate_limit`(429). 문서화: `docs/`가 아니라 **T11의 배포 후 점검 절차**(batch05 `scripts/postdeploy.mts`)에 "Firewall 규칙 존재 확인" 항목으로. 규칙은 코드 밖이라 잃어버리기 쉽다 — 점검이 기억을 대신한다.
2. **Hobby에서 안 되면** — 로컬 토큰 버킷을 넣지 **않는다.** 위 한계로 "방어가 있는 것처럼 보이지만 없는" 상태가 되고, 그것이 이 저장소가 가장 경계하는 결함 유형(라운드 17 패턴 3)이다. 대신 **AB3의 답을 "S2 키를 넣지 않는다"로 고정**한다 — 키가 없으면 태울 할당량이 없고(폴백 2단이 이미 정상 품질을 준다, AB3 실측), SC5는 "공용 프록시가 Crossref·OpenAlex polite pool을 태운다"로 축소된다. 그 두 곳은 키가 아니라 `mailto`(`route.ts:57, :82, :96`)로 식별되고 무료다.
3. **E3(애드센스)와 무관.** 라운드 18 순서 제약 "SC5 + AB3 → E3"는 **오기**로 보인다 — SC5는 S2 키(AB3)와 맞물리지 광고와 맞물리지 않는다. "BR4 → O5 → E3"와 구조가 같다는 뜻으로 적힌 것이다. 제약을 **"SC5 → AB3(키 투입)"**로 정정.

### 클라이언트 쪽 한 줄 (Firewall 429를 사용자에게 보여 주기)

Firewall의 429는 JSON이 아니다. `components/PriorResearchSearch.tsx:29-33` `classifyStatus`가 `429 → "rate-limit"`을 이미 처리하므로(`:31`) **본문을 읽지 않고 상태코드만 보는 지금 구조(`:70-73`)가 그대로 맞다.** 변경 0. batch06이 추가하는 `504 → "timeout"` 한 줄과 같은 함수다.

### 테스트

코드 변경이 0이면 테스트도 0. **Hobby 불가로 (2)를 택하면** `PriorResearchSearch.test.tsx`에 "429에 rate-limit 문구"가 이미 있는지 확인(`:69` "오류는 role=alert로")하고, 없으면 1건 — 그건 ER3·KB2와 같은 파일이라 그 커밋에.

## SC6. 업스트림 URL 스킴 검사 — 매퍼에서 한 번

### 현재

- `components/PriorResearchSearch.tsx:195` `href={paper.url ?? "#"}` — `target="_blank" rel="noopener noreferrer"`(`:196-197`)는 있지만 스킴 검사 없음.
- `paper.url`의 출처 3곳 (`lib/paperSearch.ts`): S2 `:49` `p.url || null`, Crossref `:100` `it.URL || (DOI ? https://doi.org/… : null)`, OpenAlex `:187` `w.doi || landing_page_url || w.id || null`.
- 같은 값이 `addReference`(`PriorResearchSearch.tsx:46-52`)로 **localStorage에 저장**되고 `lib/citations.ts:83`의 `optionalOk(v.url)`은 `typeof === "string"`만 본다. `ReferenceList`가 URL을 `<a>`로 그리는지: `grep href= components/ReferenceList.tsx` → **0건**(APA/IEEE 텍스트에만 들어간다). 그러므로 실행 경로는 `:195` 한 곳.

### 변경 — `lib/paperSearch.ts`에 헬퍼, 매퍼 3곳에서 적용

```ts
/**
 * 업스트림이 준 URL 중 http(s)만 통과시킨다.
 *
 * Crossref의 URL 필드는 출판사가 직접 채우고 OpenAlex의 landing_page_url도
 * 외부 데이터다. javascript:·data: 스킴이 오면 <a href>가 그대로 실행 경로가
 * 된다(라운드 18 SC6). 발생 확률은 낮지만 방어는 두 줄이고, 여기서 거르면
 * 화면(PriorResearchSearch)과 저장(addReference) 양쪽이 같이 안전해진다.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null; // 상대경로·깨진 문자열 — 링크로 쓸 수 없다
  }
}
```
적용:
- `:49` `url: safeHttpUrl(p.url),`
- `:100` `url: safeHttpUrl(it.URL) ?? (it.DOI ? \`https://doi.org/${it.DOI}\` : null),`
- `:187` `url: safeHttpUrl(w.doi) ?? safeHttpUrl(w.primary_location?.landing_page_url) ?? safeHttpUrl(w.id),`

`PriorResearchSearch.tsx:195`는 그대로 — `paper.url`이 이미 안전하다. `"#"` 폴백은 `url === null`일 때만.

### 함정

1. `new URL("10.1000/xyz")`는 throw → null. Crossref `:100`의 DOI 폴백이 잡는다. OpenAlex `w.doi`는 `https://doi.org/…` 절대 URL(`:121`의 정규식이 그 형태를 전제)이라 통과.
2. `u.href`로 반환하면 정규화된다(`HTTP://A.b` → `http://a.b/`). `paperSearch.test.ts`에 URL 문자열 동등 단언이 있으면 깨진다 — **구현 시 `grep url lib/__tests__/paperSearch.test.ts`.** 있으면 원문 `value`를 반환하도록 바꾼다(정규화가 목적이 아니다).
3. `lib/citations.ts:83`의 `optionalOk(v.url)`은 **건드리지 않는다.** 저장된 옛 값에 이상한 스킴이 있어도 `ReferenceList`가 링크로 그리지 않는다. SC3(백업 값 검증)·SC8이 그 층을 다룬다.

### 테스트 — `lib/__tests__/paperSearch.test.ts`

```ts
describe("safeHttpUrl", () => {
  it("http·https만 통과시킨다 (정상)")            // "https://doi.org/10.1/x" → 그대로
  it("javascript:·data: 스킴은 null (SC6)")     // "javascript:alert(1)", "data:text/html,…"
  it("빈 값·상대경로·깨진 문자열은 null (경계)")   // null, "", "10.1000/x", "not a url"
});
it("Crossref URL이 javascript: 스킴이면 DOI 링크로 대체된다")
it("OpenAlex는 doi → landing_page → id 순으로 첫 안전한 URL을 쓴다")
```

---

# 파트 5 — 커밋 분할과 순서

**11개 커밋.** 이 배치 안의 순서 제약은 셋뿐이고(아래 화살표), 다른 배치와의 제약이 더 많다.

| # | 커밋 | 파일 | 선행 |
| --- | --- | --- | --- |
| 1 | `fix: 페이지별 openGraph — 공유 필드를 lib/site로, 세 generateMetadata에서 펼친다 (NX1, SE1)` + SE2·SE3 상한 테스트 | `lib/site.ts` `app/layout.tsx` 세 `[slug]/page.tsx` · `lib/__tests__/site.test.ts` `app/__tests__/pageMetadata.test.ts` · `contentMeta` 2건 | 없음. **C2보다 먼저** |
| 2 | `fix: 동적 세그먼트 5곳에 dynamicParams=false, OG 주석을 문서에 맞게 (NX2, PF10)` | 페이지 2 + OG 3 · `app/__tests__/segmentConfig.test.ts` | 없음 |
| 3 | batch06 커밋 13에 흡수 — `(L2, L3, NX3)` | `route.ts` | batch06 순서 |
| 4 | `test: sitemap↔generateStaticParams, 정적 href 리터럴 대조 (NX5 기각, NX6)` + NX7 주석 | `app/__tests__/routes.test.ts`(T6가 신설) `app/template.tsx` | **T6(batch05 커밋 4) 뒤** |
| 5 | `refactor: PageProps 헬퍼로 페이지 3곳 타입 (NX4)` | 세 `page.tsx` | **S1 커밋 01(CI, `next typegen`) 뒤** |
| 6 | `fix: usePersistentState 쓰기를 커밋 뒤 이펙트로 옮기고 250ms 스로틀 (PF6, L7)` | `lib/usePersistentState.ts` + 테스트 | batch7 L7 자리. **C4 앞** |
| 7 | `perf: 편향 체크 게이팅 · 활동 로그 지연 · 영어표현 정적화 · storage 필터 (PF4, PF5, PF7, PF12)` | 4 컴포넌트 + `lib/activity.ts` `lib/checklist.ts` `lib/citations.ts`(export 1줄) + 테스트 4파일 | 없음. 서로 파일 교집합 0이라 한 커밋 |
| 8 | `fix: 도구 딥링크는 첫 도구를 접지 않고 대상만 추가로 편다 · 행을 memo (PF2, PF8)` | `components/StageTools.tsx` + 테스트 | **A1(batch05 커밋 8) 앞이 좋다** — A1이 이 경로를 주 진입로로 만들기 전에 |
| 9 | `fix: 시드 전 빈 셸로 높이 예약 (PF3)` | `ActivityHeatmap` `StageDurations` `ReferenceList` + 테스트 3건 | **batch3 커밋 7(G3·L4) 뒤** |
| 10 | `fix: 하단 광고를 고정 크기 단위로 (PF1)` | `AdSlot.tsx` `globals.css` + `AdSlot.test.tsx` | **O5(batch05 커밋 7) 뒤, E3 앞** |
| 11 | `fix: 업스트림 URL은 http(s)만 통과 (SC6)` | `lib/paperSearch.ts` + 테스트 | 없음 |

SC5는 커밋이 없다(Firewall 규칙 + T11 점검 항목 + 백로그 정정). PF9·PF11·NX8은 백로그 정정만.

### 병렬 가능성
1·2·7·11은 파일 교집합이 없다 — 동시에 낼 수 있다. 8은 A1보다 앞, 9·10은 다른 배치 뒤라 시점이 정해져 있다.

### 다른 배치와의 충돌 — 판정

| 이 문서 | 상대 | 판정 |
| --- | --- | --- |
| §NX3 | batch06 커밋 13 (L2·L3) | **흡수.** batch06 함정 2는 소멸 |
| §PF6 | batch7 §L7 전문 (`impl-plan-batch7.md:35-104`) | **대체.** batch7 「구현 시 판단 1」 닫힘 — 이펙트 방식. batch7의 상황별 표·`saveError` 타이밍 판정은 유지 |
| §PF3 | batch3 커밋 7 (`ActivityHeatmap` 전면 교체) + 라운드 17 순서 제약 "AC3+G3+L4+PF3 한 커밋" | **분리.** batch3 C7 뒤 별도 커밋. G3 빈 상태 분기 앞에 `hydrated &&` |
| §PF2 | batch05 §A1 함정 "해시 재구독" | 범위 밖 유지. 최소 처방만 기록 |
| §PF1 | batch05 커밋 7 (O5, `AdSlot` 호출 위치 이동) | O5 뒤. 순서 제약 `BR4 → O5 → PF1 → E3` |
| §PF7 | batch05 T8 `lib/storageKeys.ts` | 키 이름 유지로 결정 → 충돌 없음 |
| §PF12 | batch05 T8 | `REFERENCES_STORAGE_KEY` export — T8이 먼저면 그쪽 모듈에서 import |
| §NX4 | S1(batch0 커밋 01) | `typecheck` = `next typegen && tsc --noEmit` 전제 |
| §NX5·NX6 | batch05 T6 `routes.test.ts` | 그 파일에 2건 추가 |
| §SE2·SE3 | S6·T7 (frontmatter 스키마) | **스키마 변경 없음**으로 결정 → 충돌 없음 |
| §SC5 | 라운드 18 제약 "SC5 + AB3 → E3" | "SC5 → AB3"로 정정 |

---

# 파트 6 — 구현 시 판단 필요 (확정하지 않은 것)

1. **NX1 함정 2** — 페이지 세그먼트의 `openGraph.url: "./"`가 페이지 경로로 풀리는지. `curl` 3경로 `og:url` 실측. 안 풀리면 `url` 을 `sharedOpenGraph`에서 빼고 각 `generateMetadata`에서 `/articles/${slug}` 절대 경로로.
2. **NX1 층 2 테스트** — `app/**/page.tsx`를 vitest node에서 import할 수 있는지. 안 되면 `next-mdx-remote/rsc` mock.
3. **NX2 함정 2** — `content/showcase` 0편 + `dynamicParams=false` 빌드 결과.
4. **PF1 함정 2** — AdSense "반응형 단위 CSS 크기 지정"의 정확한 문법(`inline-block` 요구 여부). E3 시점.
5. **PF2 함정 2** — 같은 단계 안 연속 딥링크 재구독. 깨지면 백로그 신규 항목(최소 처방은 §PF2에).
6. **PF5** — `ChecklistCard.test.tsx`가 `logActivity`를 mock하는지. 하면 이름 변경.
7. **PF8 테스트** — `Profiler`가 jsdom에서 render 콜백을 주는지. 안 되면 테스트 생략(리뷰로 대체).
8. **SC5** — Hobby 요금제에서 Firewall `rate_limit` 액션 가용 여부. 불가면 §SC5 판정 2(키 미투입 고정).
9. **SC6 함정 2** — `paperSearch.test.ts`에 URL 정규화에 민감한 단언이 있는지. 있으면 `u.href` 대신 원문 반환.
10. **SE2 하한** — 가이드 3편 description(50·61·66자)을 70자 이상으로 늘릴지. 콘텐츠 작업이라 운영자.
11. **PF11** — 480ms 유지 여부. 운영자.
12. **NX5** — typedRoutes 기각을 운영자가 뒤집으면 19곳 캐스트가 작업량.

---

# 백로그 정정 요약 (feature-backlog.md·backlog-index.md에 반영할 것)

- SE2·SE3: "60자/160자 초과 40/51" → **바이트 측정 오류.** 문자 기준 초과 0. 조치는 상한 테스트 2건. 가이드 3편 description 하한 미달을 신규 관찰로.
- PF9: **확인했고 문제 없음**으로 이동 (프레임당 강제 레이아웃 ≤1회).
- PF3: 대상 4곳 → **3곳** (`ContinueCard` 제외, 의도된 null).
- PF2: `?tool=` 대안은 정적 프리렌더 상실 + MDX 링크 ~50개 재작성이라 **기각**. 채택은 "첫 도구 유지 + 대상 추가 펼침".
- NX5: **기각** (캐스트 19곳). 대체는 정적 href 리터럴 테스트.
- NX8: `dynamicParams`와 Cache Components가 상호 배타 — 두 결정이 서로 잠근다.
- 순서 제약 정정: "AC3+G3+L4+PF3 한 커밋" → "batch3 C7 → PF3"; "SC5 + AB3 → E3" → "SC5 → AB3"; 추가 "BR4 → O5 → PF1 → E3"; "S1 → NX4"; "PF6/L7 → C4".
- batch7 §L7 전문 → 이 문서 §PF6으로 대체 (구현 시 판단 1 닫힘).
- batch06 커밋 13 → `(L2, L3, NX3)`.
