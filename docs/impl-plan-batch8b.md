# 구현 설계 — 테스트 품질(TQ) 14건 · 교열(KO) 5건 (라운드 19, 묶음 8b)

작성 2026-09-06. **설계 문서다. 코드는 바꾸지 않았다.** 모든 줄 번호는 이 라운드에 실측했다.

대상은 `docs/backlog-index.md` 라운드 18 절의 TQ1~TQ14, KO1~KO5. 어느 커밋에 들어가는지는
`docs/impl-plan-master.md` 「라운드 16~18 편입」이 정하고, 이 문서는 항목별 상세를 맡는다.

---

## 0. 판정 정정 — 착수 전에 읽을 것 (6건)

| # | 항목 | 백로그·색인 | 실측 |
| --- | --- | --- | --- |
| 1 | **TQ2** | 색인 표에 "타입 중복"으로 지시받았으나 **백로그 본문에도 색인에도 TQ2가 없다**(TQ1 → TQ3으로 건너뛴다) | 후보 둘을 §1.2에 적었다. 채택 여부는 운영자 판단 |
| 2 | **KO1 처방** | "닫는 기호 뒤에 조사를 붙여도 마크다운은 정상 동작한다" | **거짓.** `micromark`로 확인: `**"논문명"**으로` → `<p>**&quot;논문명&quot;**으로</p>`(굵게가 풀리고 `**`가 그대로 찍힌다). CommonMark 오른쪽 플랭킹 규칙 — 닫는 `**` 앞이 문장부호(`"`)이고 뒤가 글자면 닫히지 않는다. **따옴표를 굵게 밖으로 빼야 한다**: `"**논문명**"으로` → `<strong>` 정상. 5건 중 4건(riss-kci)이 이 경우다 |
| 3 | **KO3 개수** | "15곳이 복사됨, 1곳만 복사했습니다" | `components/`에서 `"복사됨"` **13곳**. 결론(1곳만 다르다)은 같다 |
| 4 | **KO5 `℃`** | `showcase/01:17` | `:17`과 **`:27`(55 ℃)** 두 곳이다 |
| 5 | **KO5 ↔ V1** | — | `impl-plan-batch8.md` V1의 교체 문안(`05-writing:76`)이 **"0 ℃"**를 쓴다. KO5가 금지하는 합자다. 커밋 79에서 `0 °C`로 쓴다 |
| 6 | **TQ14 ↔ S2** | "S2와 같은 커밋에서 공용 헬퍼로 올린다" | `impl-plan-batch0.md` S2의 `installMockStorage`는 **이미 `removeItem`을 갖는다**(`:56`). TQ14의 일은 헬퍼 설계가 아니라 `activity.test.ts:3-9`의 인라인 스텁을 헬퍼로 **갈아끼우는 것**뿐이다. 단 헬퍼가 **node 환경**(activity·checklist·citations 테스트는 jsdom 지시자가 없다)에서 `window` 자체를 만들어야 한다 — batch0은 jsdom `defineProperty`만 적었다. §1.14 참조 |

---

## 1. 테스트 품질 TQ1~TQ14

### 1.1 TQ1 — `lib/__tests__/stageToolMeta.test.ts:32-35` 동어반복

**현재.** `getTotalUniqueToolCount()`(`lib/stageToolMeta.ts:136-139`)의 구현이 `new Set(Object.values(STAGE_TOOL_TITLES).flat()).size`이고,
테스트 좌변 `new Set(uniqueTitles.map(t => TOOL_IDS[t])).size`도 같은 집합에서 나온다. 정본이 없다.

**사실.** 제목 총 25개(2+2+3+3+9+6), 고유 24개. 겹치는 것은 `"내 레퍼런스 목록"`(prior-research·writing) 하나.

**변경 후 — `:32-35` 교체**

```ts
  // 정본을 코드에서 다시 계산하면 동어반복이다. 사이트가 "24개"라고 말하는 숫자를
  // 여기 박아 두어, 도구를 늘리거나 줄인 사람이 이 줄을 의식적으로 고치게 한다.
  // (H4 데이터 정리 기록표가 들어오면 25로 올린다 — batch7 「새 도구 추가 시 연쇄 목록」)
  const EXPECTED_UNIQUE_TOOL_COUNT = 24;

  it("사이트 전체 고유 도구 수가 정본과 같다", () => {
    expect(getTotalUniqueToolCount()).toBe(EXPECTED_UNIQUE_TOOL_COUNT);
    expect(uniqueTitles).toHaveLength(EXPECTED_UNIQUE_TOOL_COUNT);
  });

  it("여러 단계에 겹쳐 등장하는 도구가 실제로 있어 Set 중복 제거가 의미를 갖는다", () => {
    // 겹침이 0이면 getTotalUniqueToolCount의 Set은 무의미하고, 이 테스트는 그 사실을 알린다
    expect(allTitles.length).toBeGreaterThan(uniqueTitles.length);
    expect(allTitles.filter((t) => t === "내 레퍼런스 목록")).toHaveLength(2);
  });
```

**함정**
- `app/tools/page.tsx:11`이 `TOOL_COUNT = getTotalUniqueToolCount()`로 본문·메타를 그린다. 정본 상수를 **테스트에만** 둔다 — 프로덕션이 상수를 읽으면 "도구가 늘어도 하드코딩을 안 고쳐도 된다"는 함수의 존재 이유가 사라진다.
- **커밋 71(H4, 24→25)**이 이 상수를 25로 올려야 한다. `impl-plan-batch7.md` 「새 도구 추가 시 연쇄 목록」(`:366`)에 이 파일을 추가한다.
- `lib/stageToolMeta.ts:5` 주석의 "21개 도구"는 낡은 숫자다. 같은 커밋에서 "24개"로 고친다(테스트는 안 잡는다 — 주석이다).

**커밋:** 마스터 **02b**.

### 1.2 TQ2 — 정의 없음. 후보 둘

색인·백로그 어디에도 TQ2 본문이 없다. "타입 중복"이라는 지시어에 맞는 후보를 실측했다.

| 후보 | 위치 | 내용 | 판정 |
| --- | --- | --- | --- |
| (a) | `lib/__tests__/stageToolMeta.test.ts:12` | `Object.values(STAGE_TOOL_TITLES).flat() as ToolTitle[]` — `satisfies`로 이미 좁혀진 타입을 `as`로 다시 선언 | 캐스트 없이도 `readonly string[]`이 `ToolTitle[]`로 안 좁혀져 `as`가 필요하다. **결함 아님** |
| (b) | `components/__tests__/ContinueCard.test.tsx:6-9` | `STAGES` 픽스처가 `ContinueCard.tsx:7-12`의 **export 안 된** `StageInfo` 형태를 손으로 복제 | 필드가 늘면 테스트가 조용히 낡는다. `StageInfo`를 export하고 `const STAGES: StageInfo[] = …`로 잠그면 끝. **TQ6과 같은 파일이므로 02b에서 함께 처리** |

(b)를 TQ2로 채택할지는 운영자가 정한다. 채택 시 `docs/backlog-index.md`에 한 줄을 넣는다.

### 1.3 TQ3 + TQ10 — `lib/__tests__/articles.test.ts` 하드코딩 두 덩어리 + `toBeTruthy` 착시

**현재.**
- `:85-137` 카테고리별 slug 배열 4개(S8이 지목한 것)
- `:139-163` `getAdjacentInCategory` 이름 4곳(TQ3이 새로 찾은 것)
- `:51-55` 미분류 문서가 `"faq"`라는 이름 단언
- `:25-26` `label`/`intro`를 `toBeTruthy` — `" "`도 통과
- `:65-73` `toBeDefined` + `isArray` — **빈 배열도 통과**(TQ10 "글이 전부 사라져도 초록")

**변경 후 — `:22-29` 교체**

```ts
describe("ARTICLE_CATEGORIES", () => {
  it("모든 카테고리 키에 비어 있지 않은 label과 intro가 있다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      expect(ARTICLE_CATEGORIES[key].label.trim().length, `${key}.label`).toBeGreaterThan(0);
      expect(ARTICLE_CATEGORIES[key].intro.trim().length, `${key}.intro`).toBeGreaterThan(0);
    }
  });
});
```

**`:51-55` 교체** — 개수는 설계 불변(`getPinnedArticle`이 2개 이상이면 throw)이므로 남기고, 이름 대신 성질을 본다.

```ts
  it("미분류 문서는 정확히 하나이고 그것이 고정 카드(getPinnedArticle)다", () => {
    const uncategorized = getAllArticles().filter((a) => !a.category);
    expect(uncategorized).toHaveLength(1);
    expect(getPinnedArticle()?.slug).toBe(uncategorized[0].slug);
  });
```
(`getPinnedArticle`을 import 목록에 추가한다.)

**`:65-73` 교체**

```ts
describe("getArticlesByCategory", () => {
  const byCategory = getArticlesByCategory();

  it("모든 카테고리에 글이 최소 1편 있다 (빈 카테고리 방지)", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      expect(byCategory[key].length, `${key} 카테고리가 비었다`).toBeGreaterThan(0);
    }
  });

  it("카테고리 안에서 order가 유일하고 오름차순이다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      const orders = byCategory[key].map((a) => a.order);
      expect(new Set(orders).size, `${key}: order 중복 ${orders.join(",")}`).toBe(orders.length);
      expect(orders, `${key}: 정렬`).toEqual([...orders].sort((a, b) => a - b));
    }
  });
});
```

**`:85-163` 전부 교체** (「카테고리별 문서 순서」 + `getAdjacentInCategory`)

```ts
describe("getAdjacentInCategory", () => {
  const byCategory = getArticlesByCategory();

  it("카테고리 첫 글은 prev가 없고 next는 둘째 글이다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      const [first, second] = byCategory[key];
      const { prev, next } = getAdjacentInCategory(first.slug);
      expect(prev, key).toBeUndefined();
      expect(next?.slug, key).toBe(second?.slug);
    }
  });

  it("중간 글의 prev·next가 정렬상 이웃과 같다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      const list = byCategory[key];
      for (let i = 1; i < list.length - 1; i++) {
        const { prev, next } = getAdjacentInCategory(list[i].slug);
        expect(prev?.slug, `${key}[${i}]`).toBe(list[i - 1].slug);
        expect(next?.slug, `${key}[${i}]`).toBe(list[i + 1].slug);
      }
    }
  });

  it("카테고리 마지막 글은 next가 없다", () => {
    for (const key of ARTICLE_CATEGORY_KEYS) {
      const list = byCategory[key];
      const { prev, next } = getAdjacentInCategory(list[list.length - 1].slug);
      expect(next, key).toBeUndefined();
      expect(prev?.slug, key).toBe(list[list.length - 2]?.slug);
    }
  });

  it("미분류 글은 prev·next 모두 undefined", () => {
    const pinned = getPinnedArticle()!;
    expect(getAdjacentInCategory(pinned.slug)).toEqual({});
  });

  it("없는 slug는 빈 객체다 (실패)", () => {
    expect(getAdjacentInCategory("no-such-slug")).toEqual({});
  });
});
```

**함정**
- 성질 검사로 바꾸면 **"글이 엉뚱한 카테고리·order로 들어갔다"는 실수는 안 잡힌다.** 그것은 라운드 15 S8-(a)(b) 판정이 이미 감수한 대가다. 대신 `order` 유일성이 실제 사고(동점 → 파일시스템 순서)를 막는다. 현재 카테고리 안 `order` 중복은 **0건**(실측).
- `getAdjacentInCategory("faq")`가 `{}`를 돌려주는 것은 `prev`·`next` 키 자체가 없다는 뜻이다. `toEqual({})`은 `{prev: undefined}`도 통과시키므로 현 구현과 호환된다.
- 카테고리에 글이 1편뿐이면 "첫 글" 테스트의 `second`가 `undefined`고 `next`도 `undefined` — 통과한다. 의도된 동작.

**커밋:** 마스터 **85**(S8-(a)(b)와 같은 커밋). **묶음 9(I4) 착수 전 필수** — 색인이 정한 순서.

### 1.4 TQ4 — `components/__tests__/RandomSampler.test.tsx:22-30`

**현재.** 20명에 5명을 요청하므로 `RandomSampler.tsx:29`의 `Math.min`이 발동하지 않는다(L1이 통과한 이유). 뽑힌 이름이 명단에 있는지, 중복이 없는지 안 본다.

**변경 후 — `:22-30` 교체**

```ts
  it("추첨하면 요청한 인원 수만큼, 명단 안에서, 중복 없이 뽑힌다 (정상)", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    await fillRoster(user);
    await user.click(screen.getByRole("button", { name: "추첨하기" }));
    const result = screen.getByRole("button", { name: "결과 복사" })
      .previousElementSibling as HTMLElement;
    const picked = result.textContent!.split(", ");
    const roster = new Set(ROSTER.split("\n"));

    expect(picked).toHaveLength(5);
    expect(new Set(picked).size, "같은 사람이 두 번 뽑혔다").toBe(5);
    for (const name of picked) {
      expect(roster.has(name), `${name}은 명단에 없다`).toBe(true);
    }
  });
```

**함정**
- `Math.min` 경계(3명 명단에 5명 요청)는 **batch0 L1의 테스트 4건**(`impl-plan-batch0.md:660-666`)이 맡는다. 여기서 중복하지 않는다.
- batch0 L1은 "개수 검증만 하는 쪽을 권한다(`shuffle` 구현에 결합하지 않는다)"고 썼다. 위 테스트도 `Math.random`을 모킹하지 않는다 — 소속·중복은 셔플 구현과 무관한 **계약**이다.
- L1 커밋이 결과 영역 DOM을 바꾸면(`/전수/` 안내 `<p>` 추가) `previousElementSibling` 셀렉터가 안내문을 잡을 수 있다. **L1 커밋 안에서 함께 넣으므로 그 자리에서 셀렉터를 맞춘다.**

**커밋:** 마스터 **06**(L1과 같은 파일·같은 테스트 파일).

### 1.5 TQ5 — `components/__tests__/SimpleChart.test.tsx:16-18, 36-38, 51-53` `640` 결합

**현재.** 세 테스트가 `width !== "640"`으로 배경 rect를 걸러 **개수만** 센다.
`impl-plan-batch06.md` O3 함정 3은 그래서 "**`W` 상수나 rect 구조를 건드리지 마라**"고 못 박았다 — 테스트가 구현을 잠근 것이다.

**변경 1 — `components/SimpleChart.tsx` 두 줄에 속성 추가** (동작 변경 0)

```tsx
// :244
<rect key={i} data-role="bar" x={x} y={yTop} width={barWidth} height={…} fill={COLORS[0]} />
// :274
<rect key={i} data-role="bar" x={PAD.left} y={…} width={(v / hMax) * hPlotW} height={barH} fill={COLORS[0]} />
```

**변경 2 — 테스트 파일 상단에 헬퍼, 세 테스트 교체**

```tsx
function bars(container: HTMLElement) {
  return [...container.querySelectorAll('svg rect[data-role="bar"]')];
}
/** x축 라벨 텍스트 — bar 유형에서 막대와 같은 순서로 그려진다 */
function barLabels(container: HTMLElement) {
  return [...container.querySelectorAll("svg text")]
    .map((t) => t.textContent ?? "")
    .filter((t) => /^[A-Z]$/.test(t));
}

const PLOT_H = 340 - 24 - 48; // H - PAD.top - PAD.bottom

describe("SimpleChart", () => {
  it("기본값(A~D 막대)으로 막대 4개를 값에 비례한 높이로 그린다 (정상)", () => {
    const { container } = render(<SimpleChart />);
    const heights = bars(container).map((r) => Number(r.getAttribute("height")));
    expect(heights).toHaveLength(4);
    // 기본값 12, 19, 7, 15 · 축 0~19 → 높이 = v / 19 * plotH
    const expected = [12, 19, 7, 15].map((v) => (v / 19) * PLOT_H);
    heights.forEach((h, i) => expect(h).toBeCloseTo(expected[i], 6));
    expect(barLabels(container)).toEqual(["A", "B", "C", "D"]);
  });

  it("가로막대에서 음수는 제외하고 남은 값에 비례한 너비로 그린다 (경계)", async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleChart />);
    const values = container.querySelector("#chart-values") as HTMLTextAreaElement;
    await user.clear(values);
    await user.type(values, "5, -3, 8, 2");
    await user.click(screen.getByRole("button", { name: "가로막대" }));
    const widths = bars(container).map((r) => Number(r.getAttribute("width")));
    // 5, 8, 2 · hMax 8 · hPlotW 560
    expect(widths).toHaveLength(3);
    [5, 8, 2].forEach((v, i) => expect(widths[i]).toBeCloseTo((v / 8) * 560, 6));
    expect(screen.getByText(/음수 값 1개는 이 차트 유형에서 제외됩니다/)).toBeTruthy();
  });

  it("값의 천 단위 쉼표를 합쳐 읽고 안내한다", async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleChart />);
    const values = container.querySelector("#chart-values") as HTMLTextAreaElement;
    await user.clear(values);
    await user.click(values);
    await user.paste("1,200 1,500 1,350 1,100");
    expect(screen.getByText(/쉼표를 천 단위 구분으로 읽었습니다/)).toBeTruthy();
    const heights = bars(container).map((r) => Number(r.getAttribute("height")));
    expect(heights).toHaveLength(4);
    // 1500이 최대 → 그 막대가 plotH 전체
    expect(Math.max(...heights)).toBeCloseTo(PLOT_H, 6);
    expect(heights[1]).toBeCloseTo(PLOT_H, 6);
  });
```
(원형 테스트 `:22-27`과 거짓 양성 테스트 `:57-60`은 그대로.)

**ER2 재발 방지선 — 커밋 05(ER2)에서 이 파일에 추가**

```tsx
  it("값 칸의 빈 셀은 그 항목만 빠지고 뒤 항목은 당겨지지 않는다 (ER2 회귀)", async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleChart />);
    const values = container.querySelector("#chart-values") as HTMLTextAreaElement;
    await user.clear(values);
    await user.click(values);
    await user.paste("12, , 7, 15");
    // A=12, (B 빠짐), C=7, D=15
    expect(barLabels(container)).toEqual(["A", "C", "D"]);
    const heights = bars(container).map((r) => Number(r.getAttribute("height")));
    [12, 7, 15].forEach((v, i) => expect(heights[i]).toBeCloseTo((v / 15) * PLOT_H, 6));
    expect(screen.getByText(/값을 읽지 못한 항목 1개/)).toBeTruthy();
  });
```

**함정 — 중요**
- **높이만 보면 ER2를 못 잡는다.** ER2 전에는 `A=12, B=7, C=15`(D 탈락), 후에는 `A=12, C=7, D=15`(B 탈락)이다. **막대 개수도 3, 높이 배열도 같다.** 차이는 **라벨**뿐이다. 그래서 `barLabels`가 필수다. 백로그의 "높이 배열까지 본다"만으로는 부족했다.
- `toBeCloseTo(…, 6)`는 SVG 속성에 찍힌 부동소수 문자열(`169.26315789473685`)을 다시 `Number`로 읽는 경로라 정확히 맞는다. 정수로 반올림하지 마라 — O3가 `W`를 바꾸는 날 반올림 경계가 흔들린다.
- **O3(커밋 22) 착수 시 `impl-plan-batch06.md` O3 함정 3을 삭제한다.** 이 계약 분리가 그 금지의 존재 이유를 없앴다.
- `data-role`은 SVG 직렬화(`downloadSvg`)에 그대로 나간다. 무해하지만, O3의 `inlineChartColors` 테스트가 "속성이 fill/stroke뿐"이라고 가정하면 안 된다 — 가정하지 않는다(확인: 정규식이 `var(--chart-` 토큰만 본다).

**커밋:** 마스터 **05a**(새 커밋, 05 직전). ER2 회귀 테스트는 **05**.

### 1.6 TQ6 — `components/__tests__/ContinueCard.test.tsx:36-41` 2단계 픽스처로 "6단계" 정본화

**현재.** `ContinueCard.tsx:40`이 `"6단계를 모두 체크했어요"`를 하드코딩. 테스트는 2단계 픽스처로 그 문장을 정답으로 잠근다.

**변경 1 — `components/ContinueCard.tsx:40`**

```tsx
            : `${stages.length}단계를 모두 체크했어요`}
```

**변경 2 — 테스트 `:36-41` 교체 + 실데이터 1건 추가**

```tsx
  it("전부 완료면 실제 단계 수로 완료 문구를 보여준다", () => {
    window.localStorage.setItem(key("topic"), JSON.stringify({ v: 2, done: ["a", "b"] }));
    window.localStorage.setItem(key("prior"), JSON.stringify({ v: 2, done: ["c", "d"] }));
    render(<ContinueCard stages={STAGES} />);
    // 픽스처는 2단계다 — "6단계"가 나오면 문구가 하드코딩된 것이다
    expect(screen.getByText("2단계를 모두 체크했어요")).toBeTruthy();
    expect(screen.queryByText(/6단계/)).toBeNull();
  });

  it("실제 가이드 단계로 렌더하면 6단계라고 말한다 (정본 대조)", () => {
    const stages = getAllStages().map((s) => ({
      order: s.order, slug: s.slug, title: s.title, checklist: s.checklist,
    }));
    expect(stages).toHaveLength(6);
    for (const s of stages) {
      window.localStorage.setItem(key(s.slug), JSON.stringify({ v: 2, done: s.checklist }));
    }
    render(<ContinueCard stages={stages} />);
    expect(screen.getByText("6단계를 모두 체크했어요")).toBeTruthy();
  });
```
(`import { getAllStages } from "@/lib/guide";` 추가. `lib/guide.ts`는 fs를 읽지만 jsdom 환경에서도 node fs는 쓸 수 있다 — `articles.test.ts`가 같은 방식으로 실제 디렉터리를 읽는다.)

**함정**
- `GuideStage`의 필드명(`order`·`title`·`checklist`)이 `StageInfo`와 같은지 `lib/guide.ts`에서 확인한다. 다르면 매핑 줄을 맞춘다 — 타입이 어긋나면 컴파일에서 잡힌다.
- 두 번째 테스트가 `checklist`에 **빈 단계**가 있으면 `countDone`이 0이고 `doneItems`도 그만큼 줄지만 `nextIndex`는 `-1`이라 통과한다. 단계 6개 중 체크리스트가 빈 단계는 현재 없다(T4가 3~5개로 잠근다).
- TQ2 후보 (b)를 채택하면 `StageInfo`를 export하고 `STAGES: StageInfo[]`로 선언하는 변경이 이 커밋에 같이 들어간다.

**커밋:** 마스터 **02b**.

### 1.7 TQ7 — `lib/__tests__/citations.test.ts:63-83` 전역 오염 잔존

**현재.** `vi.stubGlobal("window", …)`(`:67`)와 `vi.unstubAllGlobals()`(`:82`)가 **같은 `it` 본문** 안에 있다. `:79`나 `:81`의 어서션이 실패하면 `:82`에 도달하지 못해 스텁이 남고, 뒤 테스트 파일이 아니라 **같은 파일의 뒤 테스트**가 오염된 `window`를 본다. 보고서에는 진짜 원인 대신 후속 실패가 찍힌다.

(`components/__tests__/PriorResearchSearch.test.tsx:28-30`은 `afterEach`에 있어 **정상**이다.)

**변경 후 — `:63-84` 교체.** batch0 S2가 "`citations.test.ts:63-83`의 인라인 모킹은 헬퍼로 갈아끼워라"고 이미 지시했으므로 헬퍼를 쓴다.

```ts
import { installMockStorage, restoreStorage, type MockStorage } from "./_storage";

describe("readReferences 손상 데이터 필터 (#9)", () => {
  let storage: MockStorage;
  beforeEach(() => {
    storage = installMockStorage();
  });
  afterEach(() => {
    restoreStorage(); // 어서션이 실패해도 반드시 돈다
  });

  it("배열 아님·필드 누락·타입 불일치 항목을 거른다", async () => {
    const { readReferences } = await import("../citations");
    const good = { id: "1", authors: "Kim", year: "2020", title: "T", source: "J" };
    storage.store.set(
      "research-guide:references",
      JSON.stringify([good, { id: 2, title: "bad" }, "garbage", null]),
    );
    expect(readReferences()).toEqual([good]);
    storage.store.set("research-guide:references", JSON.stringify({ not: "array" }));
    expect(readReferences()).toEqual([]);
  });
});
```

**함정**
- 이 파일은 `// @vitest-environment jsdom`이 없다 → **node 환경, `window` 자체가 없다.** batch0 S2 헬퍼는 jsdom의 `defineProperty`를 전제했다. 헬퍼에 분기를 넣는다: `typeof window === "undefined"`면 `vi.stubGlobal("window", { localStorage, dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} })`, 있으면 `defineProperty`. `restoreStorage`는 각각 `vi.unstubAllGlobals()` / 원본 복원. **이것이 S2 헬퍼 설계에 추가되는 요구사항이고, TQ14도 같은 분기를 쓴다.**
- `store` 노출 이름(`store` vs `_store`)은 헬퍼가 정한다. 위 코드는 `storage.store`로 썼다 — S2 구현 시 맞춘다.
- 동적 `import("../citations")`는 그대로 둔다. `citations.ts`가 모듈 평가 시점에 `window`를 읽는지 확인하지 않았다 — 읽지 않는다면 상단 정적 import로 바꿔도 되지만, 바꿔서 얻는 것이 없다.

**커밋:** 마스터 **02**(S2).

### 1.8 TQ8 — `ResearchQuestionQuiz` 판정 분기 미검증

**현재.** `components/__tests__/LiveRegions.test.tsx:21-37`이 유일한 테스트이고, 체크 0개에서 "조사형에 가깝습니다"만 본다. `components/ResearchQuestionQuiz.tsx:25-43`의 `score >= 3` / `score === 2` 분기는 한 번도 실행되지 않는다.

**변경 — `components/__tests__/ResearchQuestionQuiz.test.tsx` 신설** (LiveRegions의 두 테스트는 aria-live 회귀선이므로 그대로 둔다)

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResearchQuestionQuiz } from "../ResearchQuestionQuiz";

beforeEach(() => cleanup());

async function checkN(user: ReturnType<typeof userEvent.setup>, n: number) {
  const boxes = screen.getAllByRole("checkbox");
  for (let i = 0; i < n; i++) await user.click(boxes[i]);
  await user.click(screen.getByRole("button", { name: "결과 보기" }));
}

describe("ResearchQuestionQuiz 판정", () => {
  it.each([
    [0, "아직 조사형에 가깝습니다"],
    [1, "아직 조사형에 가깝습니다"],
    [2, "탐구형과 조사형 사이"],
    [3, "탐구형에 가깝습니다"],
    [4, "탐구형에 가깝습니다"],
  ])("%i개 체크 → %s", async (n, label) => {
    const user = userEvent.setup();
    render(<ResearchQuestionQuiz />);
    await checkN(user, n);
    expect(screen.getByText(new RegExp(`${n} / 4 · ${label}`))).toBeTruthy();
  });

  it("결과를 본 뒤 항목을 바꾸면 판정이 사라진다 (낡은 결과 방지)", async () => {
    const user = userEvent.setup();
    render(<ResearchQuestionQuiz />);
    await checkN(user, 3);
    expect(screen.getByText(/탐구형에 가깝습니다/)).toBeTruthy();
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.queryByText(/가깝습니다|사이/)).toBeNull();
  });
});
```

**함정**
- 문구를 정규식으로 잡는다. `verdict().label`이 화면에 `"{score} / {ITEMS.length} · {label}"`(`:84`)로 합쳐지므로 `getByText("탐구형에 가깝습니다")` 정확 일치는 실패한다.
- 마지막 테스트의 `queryByText(/가깝습니다|사이/)`는 항목 문구(`:6-9`)에 같은 단어가 없어야 한다 — 확인: 없다. 항목 문구가 바뀌면 이 정규식을 `verdict` 라벨 셋으로 좁힌다.
- 경계 `score === 2`와 `score >= 3` 둘 다 뒤집히면 잡힌다. `>= 3`을 `> 3`으로 바꾸는 회귀는 `[3, "탐구형에 가깝습니다"]` 케이스가 잡는다.

**커밋:** 마스터 **02b**.

### 1.9 TQ9 — `components/__tests__/StageTools.test.tsx:21-23, 46-53, 70-71` 순서 결합

**현재.** `details[0]`·`details[1]` 인덱스로 "첫 도구"를 식별한다. `STAGE_TOOL_TITLES`의 순서가 바뀌거나 PF2(시드 전 미펼침)·A1(딥링크 주 진입로)이 들어오면 세 테스트가 한꺼번에 재작성 대상이 된다.

**변경 후 — 식별을 id로**

```tsx
import { STAGE_TOOL_TITLES, TOOL_IDS, type StageSlug } from "@/lib/stageToolMeta";

/** 그 단계에서 기본으로 펼쳐지는 도구의 앵커 id — STAGE_TOOL_TITLES 첫 항목 */
const firstToolId = (slug: StageSlug) => `tool-${TOOL_IDS[STAGE_TOOL_TITLES[slug][0]]}`;
const detailsById = (id: string) => document.getElementById(id) as HTMLDetailsElement | null;
const others = (id: string) =>
  [...document.querySelectorAll("details")].filter((d) => d.id !== id);
```

`:16-24`
```tsx
  it("해시가 없으면 STAGE_TOOL_TITLES의 첫 도구가 펼쳐진다 (정상)", async () => {
    render(<ToolAccordion slug="topic" />);
    const id = firstToolId("topic");
    await waitFor(() => expect(detailsById(id)?.open).toBe(true));
    others(id).forEach((d) => expect(d.open).toBe(false));
  });
```

`:41-54`
```tsx
  it("기본 상태에서는 첫 도구의 본문만 렌더된다 (접힌 도구는 제목만)", async () => {
    render(<ToolAccordion slug="writing" />);
    const id = firstToolId("writing");
    await waitFor(() => expect(detailsById(id)?.querySelector(".tool-embed")).not.toBeNull());
    others(id).forEach((d) => {
      expect(d.id).not.toBe("");
      expect(d.querySelector("h3")).not.toBeNull();
      expect(d.querySelector(".tool-embed")).toBeNull();
    });
  });
```

`:65-91` — `details[1]` 대신 `STAGE_TOOL_TITLES.writing[1]`의 id로 잡는다. 나머지 흐름(직접 `open` + `toggle` 이벤트)은 그대로.

**함정**
- **PF2가 "시드 전에는 아무것도 안 펼친다"를 택하면 첫 번째 테스트의 기대 자체가 바뀐다**(시드 후 첫 도구 펼침 → `waitFor` 유지, 시드 전 전부 닫힘 → 첫 어서션 추가). 그래서 이 항목은 PF2와 같은 커밋이다 — 두 번 고치지 않는다.
- `STAGE_TOOL_TITLES.writing[0]`은 `"간이 통계 계산기"`(`lib/stageToolMeta.ts:32`). 이 테스트가 그 도구를 마운트하므로 `StatsCalculator`의 무거운 렌더가 돈다 — 지금도 그렇다. 변화 없음.

**커밋:** 마스터 **16**(PF2·A1과 같은 커밋).

### 1.10 TQ10 — `articles.test.ts:25-26, 65-73` `toBeTruthy` 착시

§1.3에 흡수했다. 커밋 **85**.

### 1.11 TQ11 — `lib/__tests__/jsonLd.test.ts:78-81` 구현으로 구현 검증

**현재.** `expect(serializeJsonLd(obj)).toBe(JSON.stringify(obj))` — 구현이 `JSON.stringify(...).replace(/</g, …)`이므로 `<`가 없는 입력에서는 항등식이다.

**변경 후 — `:71-82` 교체**

```ts
describe("serializeJsonLd", () => {
  it("'<'를 유니코드 이스케이프로 바꾼다 (XSS 방지)", () => {
    const result = serializeJsonLd({ headline: "<script>alert(1)</script>" });
    expect(result).not.toContain("<");
    expect(result).toContain("\\u003cscript>alert(1)\\u003c/script>");
  });

  it("이스케이프한 결과가 여전히 유효한 JSON이고 원본으로 되돌아온다 (왕복)", () => {
    const input = { headline: "</script><!--", nested: { a: ["<", 1, null] } };
    expect(JSON.parse(serializeJsonLd(input))).toEqual(input);
  });

  it("'<'가 없는 객체는 리터럴 그대로 나온다", () => {
    // JSON.stringify와 비교하면 구현을 구현으로 검증하는 셈이라 문자열을 직접 적는다
    expect(serializeJsonLd({ a: 1, b: "text" })).toBe('{"a":1,"b":"text"}');
  });

  it("'>'와 '&'는 건드리지 않는다 (과잉 이스케이프 방지)", () => {
    expect(serializeJsonLd({ t: "a > b & c" })).toBe('{"t":"a > b & c"}');
  });
});
```

**함정**
- 왕복 테스트가 진짜 성질이다. `<`를 `<`로 바꾸는 것이 JSON 문법 안에서 이뤄져야 한다는 조건을 이스케이프 방식이 바뀌어도(예: HTML 엔티티로 바꾸는 잘못된 리팩터) 잡는다.
- `articleJsonLd`·`breadcrumbJsonLd` 테스트는 손대지 않는다. A3(커밋 25)이 `image` 필드를 넣을 때 그쪽에 한 케이스가 붙는다.

**커밋:** 마스터 **02b**.

### 1.12 TQ12 — `components/__tests__/ChecklistCard.test.tsx:46-52` 키 부재로 행동 부재 증명

**현재.** 체크 해제 후 `activity-log` 키가 `null`임을 본다. **키가 애초에 없었으므로** `logActivity`가 불렸든 안 불렸든 — 아니, 불렸다면 키가 생기므로 잡히긴 한다. 그러나 `logActivity`가 **읽기만 하고 쓰지 않는 경로**(예: 필터 후 빈 배열이면 저장 생략)로 바뀌면 통과한다. 더 강한 형태는 "이미 있던 기록이 그대로"다.

**변경 후 — `:46-52` 교체**

```tsx
  it("체크 해제 시 활동기록에 항목이 추가되지 않는다 (경계)", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 2, done: ["항목 하나"] }));
    const existing = [
      { type: "STAGE_ITEM_DONE", refId: "topic:9", occurredAt: new Date().toISOString() },
    ];
    window.localStorage.setItem(LOG_KEY, JSON.stringify(existing));
    const user = userEvent.setup();
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(JSON.parse(window.localStorage.getItem(LOG_KEY)!)).toEqual(existing);
  });
```
(`const LOG_KEY = "research-guide:activity-log";`를 `:8` 아래에 추가.)

**함정**
- `lib/activity.ts`의 `logActivity`가 읽을 때 `isActivityEntry`로 거르고(`:46`) 오래된 항목을 버릴 수 있다. 씨앗 항목은 **지금 시각**·유효한 `type`·`refId` 형식(`topic:9`)을 쓴다. `isActivityEntry`가 `refId`에 `단계:인덱스` 형식을 요구하는지 착수 시 확인.
- `logActivity`가 저장 시 정렬·정규화를 하면 `toEqual`이 깨진다. 현재 구현은 `push` 후 `slice`뿐(`:31-33`)이라 원형 유지.

**커밋:** 마스터 **02b**.

### 1.13 TQ13 — `lib/__tests__/stats.test.ts:81, :108` `toBeCloseTo` 정밀도 표기

**현재.** `expect(r.p).toBeCloseTo(5.574e-7, 9)`. 둘째 인자 9는 "소수 9자리"이지 유효숫자가 아니다. 허용 오차 `5e-10`은 기대값 `5.574e-7`(유효숫자 4)의 0.09%라 **수치적으로는 맞지만**, 읽는 사람은 "9자리까지 맞춘다"로 오해하고 다음 사람이 `p=1e-12`급 케이스에 같은 `9`를 쓰면 **무조건 통과**한다. `:81`의 `(0.000643119, 7)`도 같은 형태.

**변경 후**

파일 상단에 헬퍼:
```ts
/** 상대 오차로 비교한다 — 극소 p값에 toBeCloseTo(x, 9)를 쓰면 자릿수와 유효숫자가 섞인다 */
function expectRelClose(actual: number, expected: number, relTol: number) {
  const rel = Math.abs(actual - expected) / Math.abs(expected);
  expect(rel, `상대 오차 ${rel} > ${relTol} (actual ${actual}, expected ${expected})`).toBeLessThan(relTol);
}
```

`:81` → `expectRelClose(tTestTwoTailedP(15, 3), 6.431193e-4, 1e-6); // scipy 유효숫자 7`
`:108` → `expectRelClose(r.p, 5.574e-7, 1e-3); // scipy 출력이 유효숫자 4자리`

**함정**
- `:81`은 주석의 scipy 값(`6.431193e-4`)과 코드의 기대값(`0.000643119`)이 **자릿수가 다르다**(7 vs 6). 상대 오차로 바꾸면서 주석 값으로 통일한다. 라운드 18이 "고정값 전수 검산 — 틀린 값 0건"이라 했으므로 값 자체는 옳다.
- 나머지 `toBeCloseTo`(정수·소수 3자리 수준)는 문제 없다. 바꾸지 않는다.
- batch5 C1(H2)이 이 파일에 `tCriticalTwoTailed` 6케이스 등을 **추가**한다. 그때 극소 p가 있으면 같은 헬퍼를 쓰게 한다.

**커밋:** 마스터 **33**(H2가 `stats.test.ts`를 여는 커밋).

### 1.14 TQ14 — `lib/__tests__/activity.test.ts:3-9` 스텁에 `removeItem` 없음

**현재.** 인라인 `{ getItem, setItem }`뿐. K1(백업 복원 롤백)·ER7(내보내기 범위)·ER8(전체삭제)이 `removeItem`을 부르는 경로를 이 파일에서 테스트하면 `TypeError: removeItem is not a function`이 나고, **결함인지 스텁 부족인지 구분이 안 된다.** `checklist.test.ts:9`는 갖고 있다.

**변경 후 — `:1-26` 교체**

```ts
import { beforeEach, describe, it, expect } from "vitest";
import { installMockStorage, type MockStorage } from "./_storage";

let storage: MockStorage;
// 파일 단위 설치 — 이 파일의 모든 테스트가 같은 스텁을 쓰고 beforeEach에서 비운다.
// (S2 헬퍼: node 환경이면 window 자체를 stubGlobal로 만든다)
storage = installMockStorage();

import { getActivityByDay, getStageDurations, toLocalDateKey } from "../activity";

const LOG_KEY = "research-guide:activity-log";
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h).toISOString();

function seed(entries: { refId: string; occurredAt: string }[]) {
  storage.store.set(LOG_KEY, JSON.stringify(entries.map((e) => ({ type: "NOTE", ...e }))));
}

beforeEach(() => storage.store.clear());
```
본문의 `store.set(…)`·`store.clear()`는 `storage.store.*`로 바꾼다(기계적 치환, 6곳).

**함정**
- ESM은 import를 호이스팅한다. `installMockStorage()`를 **import 문보다 앞에 두어도** `../activity`가 먼저 평가된다. 지금 파일이 `vi.stubGlobal`을 import 앞에 둔 것도 같은 이유로 실제로는 **호이스팅 뒤에 실행**되며, `activity.ts`가 모듈 평가 시점에 `window`를 안 읽기 때문에 우연히 동작한다. 헬퍼로 바꿔도 같은 조건이므로 동작은 같다. **`activity.ts`가 최상위에서 `window`를 읽게 되면 깨진다** — 그때는 동적 import로 바꾼다. 주석으로 남긴다.
- `checklist.test.ts:4-20`도 같은 헬퍼로 옮긴다(S2 지시 "두 방식이 공존하면 헬퍼의 존재 이유가 사라진다"). `dispatchEvent`·`addEventListener` no-op이 헬퍼의 node 분기에 들어가야 `checklist.ts`가 안 죽는다 — §1.7 함정과 같은 요구.

**커밋:** 마스터 **02**(S2).

---

## 2. 교열 KO1~KO5

### 2.1 KO1 — 조사 띄어쓰기 5건 (+ 판정 정정 §0-2)

| 파일:줄 | before | after | 비고 |
| --- | --- | --- | --- |
| `content/articles/10-riss-kci.mdx:28` | `…"연구보고서", "공개강의"** 입니다.` | `…"연구보고서", "공개강의"**입니다.` → **불가.** 굵게 범위를 바꾼다: `**"학위논문", "국내학술논문", … "공개강의"**` 전체를 → `"**학위논문**", "**국내학술논문**", "**해외학술논문**", "**학술지**", "**단행본**", "**연구보고서**", "**공개강의**"입니다.` | 닫는 `**` 앞이 `"`면 CommonMark가 굵게를 닫지 않는다(§0-2). 단어별 굵게로 바꾸면 `**`가 글자 옆에 붙어 정상 |
| `:34` | `**"논문명"** 으로 바꿔` | `"**논문명**"으로 바꿔` | micromark 확인: `<strong>논문명</strong>` |
| `:50` (앞) | `**"심사를 거친 학술지만 골라 관리하고, 인용 관계까지 보여주는 곳"** 입니다.` | `"**심사를 거친 학술지만 골라 관리하고, 인용 관계까지 보여주는 곳**"입니다.` | 같은 규칙 |
| `:50` (뒤) | `**"KCI 소개", …, "분석정보서비스"** 로 되어 있어서` | `"**KCI 소개**", "**논문 검색**", "**학술지 검색**", "**기관 정보 검색**", "**인용 정보 검색**", "**통계 정보**", "**정보마당**", "**논문유사도검사**", "**분석정보서비스**"로 되어 있어서` | `:28`과 같은 처리 |
| `content/articles/16-scholar-alerts.mdx:43` | `` `"백색소음" 기억` 처럼 `` | `` `"백색소음" 기억`처럼 `` | 코드 스팬은 플랭킹 규칙이 없다. 그대로 붙인다 |
| `components/PriorResearchSearch.tsx:129` | `&ldquo;미세플라스틱&rdquo; 보다 &ldquo;microplastic&rdquo;)` | `&ldquo;미세플라스틱&rdquo;보다 &ldquo;microplastic&rdquo;)` | JSX 텍스트. 규칙 무관 |

**함정**
- `:28`·`:50`을 단어별 굵게로 바꾸면 **시각 밀도가 달라진다**(따옴표가 굵게 밖으로 나온다). 대안은 `<strong>…</strong>입니다`로 HTML을 쓰는 것인데, **SC1이 사례를 `format:"md"`로 바꾸는 것과 별개로 자료실은 MDX라 JSX가 살아 있다**. 그러나 MDX에서 `<strong>`은 JSX 요소로 파싱되고 안의 `"`가 문제를 일으키지 않는다. **둘 중 어느 쪽이든 되지만, 저장소 43편이 HTML 태그를 0회 쓰므로(KO 감사 "곡선따옴표 0건" 등 원고 규칙이 순수 마크다운) 단어별 굵게를 택한다.**
- 커밋 80(batch8 C9)이 `10-riss:30`을 고친다(Y11). `:28`·`:34`·`:50`과 겹치지 않는다. **같은 커밋에서 처리**하되 diff는 줄 단위로 분리된다.
- `16-scholar-alerts:45`는 batch0 X6(커밋 08)이 고친다. `:43`은 다른 줄이지만 커밋 08이 먼저 들어가므로 **커밋 80 착수 시 `:43`을 재측정**한다(X6이 줄을 추가하면 밀린다).

**커밋:** riss-kci 3곳 + scholar-alerts 1곳 → **80**. `PriorResearchSearch.tsx:129` → **72b**(KO2·KO3 UI 어투 커밋).

### 2.2 KO2 — UI 어투 정본 결정 + `docs/style-terms.md` 추가 절 전문

**실측 (라운드 18과 일치, 7 / 6 / 6)**

| 어투 | 위치 | 성격 |
| --- | --- | --- |
| `확인해주세요` ×7 | `PlanBackup:12` · `PriorResearchSearch:12` `:19` · `RandomSampler:103` · `SampleSizeCalculator:155` `:167` · `lib/statsVerdict.ts:10` | 오류 5 + **빈 상태 안내 2**(RandomSampler:103, SampleSize:167) |
| `확인해보세요` ×6 | `EthicsChecklist:24` · `FigureCaptionHelper:143` · `ImradChecker:174` `:180` · `SurveyBiasChecker:10` `:16` | 전부 **점검 결과의 힌트·제안** |
| `확인하세요` ×6 | `LengthChecker:21` · `PriorResearchSearch:183` · `ResearchDesignQuiz:145` · `SubmissionVenues:53` `:74` `:127` | 전부 **안내·지시** |
| `추가하세요` ×1 / `추가해보세요` ×1 | `ImradChecker:167` / `ResearchQuestionQuiz:36` | 같은 분열 |

**본문(콘텐츠)은 이미 한 갈래다** — `content/` 43편에서 `확인하세요` **19회**, `확인해보세요`·`확인해주세요` **0회**. 라운드 18 KO 감사가 "합쇼체 서술 + `-세요` 명령형은 표준 조합"이라 판정한 그 규칙이다.

**정본 결정**

1. **안내·지시·제안은 `-하세요`.** 본문 19:0의 실측이 근거다. UI가 본문과 다른 어투를 쓸 이유가 없다.
2. **사용자 입력이 원인인 오류를 알리며 고쳐 달라고 요청할 때만 `-해주세요`.** "검색어를 확인해주세요"처럼 사용자가 한 일을 되짚게 하는 문장이다. 시스템 사정(연결 실패)은 사용자의 잘못이 아니므로 `-하세요`(`인터넷 연결을 확인하세요`).
3. **`-해보세요`는 '해 보다'가 실제 시도를 뜻할 때만** — `다시 시도해보세요`, `직접 써보세요`. 확인·추가처럼 결과가 정해진 동작에 완곡 어미로 붙이지 않는다. 6곳 전부 이 경우가 아니다.
4. **빈 상태 안내는 오류가 아니다** → `-하세요`. `RandomSampler:103` `SampleSizeCalculator:167`이 여기 걸린다.

왜 `-해주세요`를 정본으로 하지 않나 — 본문이 0회이고, 안내 문장마다 "주세요"를 붙이면 사이트가 학생에게 부탁하는 어투가 된다. 이 사이트는 가르치는 쪽이다.

**적용표 (변경 6곳, 유지 12곳)**

| 파일:줄 | before | after |
| --- | --- | --- |
| `RandomSampler.tsx:103` | `뽑을 인원 수를 확인해주세요.` | `뽑을 인원 수를 확인하세요.` |
| `SampleSizeCalculator.tsx:167` | `오차범위와 예상 비율을 확인해주세요.` | `오차범위와 예상 비율을 확인하세요.` |
| `PriorResearchSearch.tsx:19` | `인터넷 연결을 확인해주세요.` | `인터넷 연결을 확인하세요.` |
| `EthicsChecklist.tsx:24` | `보호자 동의가 필요한지 확인해보세요.` | `보호자 동의가 필요한지 확인하세요.` |
| `FigureCaptionHelper.tsx:143` | `…형식으로 시작하는지 확인해보세요.` | `…형식으로 시작하는지 확인하세요.` |
| `ImradChecker.tsx:174` `:180` | `…확인해보세요.` | `…확인하세요.` |
| `SurveyBiasChecker.tsx:10` `:16` | `…확인해보세요.` / `…확인해보세요(이중질문).` | `…확인하세요.` / `…확인하세요(이중질문).` |
| `ResearchQuestionQuiz.tsx:36` | `세부 조건을 하나 추가해보세요.` | `세부 조건을 하나 추가하세요.` |
| 유지 | `PlanBackup:12` `PriorResearchSearch:12` `SampleSizeCalculator:155` `statsVerdict:10` (입력 오류 → `-해주세요`) · `확인하세요` 6곳 · `ImradChecker:167` `추가하세요` · `ERROR_MESSAGES`의 `다시 시도해보세요` 3곳(실제 시도) | |

(변경은 6곳이 아니라 **10줄**이다 — ImradChecker·SurveyBias가 2줄씩.)

**`docs/style-terms.md`에 추가할 절 — 전문.** 「3. 통제변수 / 통제군 / 대조군」 뒤, 「새 글·새 사례를 올릴 때」 앞에 넣는다.

```markdown
### 4. UI 문구의 어미 — `-하세요` / `-해주세요` / `-해보세요`

도구(`components/`)와 오류 문구(`lib/statsVerdict.ts` 등)가 같은 동작을 세 어미로 부르고 있었다
(`확인해주세요` 7 · `확인해보세요` 6 · `확인하세요` 6). 본문 43편은 `확인하세요` 19회,
나머지 둘 0회로 이미 한 갈래다. UI도 본문을 따른다.

| 상황 | 정본 | 예 |
| --- | --- | --- |
| 안내·지시·제안 (기본) | **`-하세요`** | `투고 요강에서 직접 확인하세요` · `세부 조건을 하나 추가하세요` |
| 사용자 입력이 원인인 오류를 알리며 고쳐 달라고 할 때 | **`-해주세요`** | `검색어를 확인해주세요` · `퍼센트(%)로 입력했는지 확인해주세요` |
| '해 보다'가 실제 시도를 뜻할 때 | `-해보세요` (허용) | `잠시 후 다시 시도해보세요` · `직접 써보세요` |

- **빈 상태 안내는 오류가 아니다.** 아직 아무것도 안 넣은 화면의 문구는 `-하세요`다.
- **시스템 사정은 사용자의 잘못이 아니다.** 연결 실패·외부 서비스 장애 문구는 `-하세요`.
- `-해보세요`를 완곡 어미로 쓰지 않는다. `확인해보세요`·`추가해보세요`는 없다.
- 근거: 본문의 실측(19 : 0 : 0)과, 이 사이트가 학생에게 부탁하는 쪽이 아니라 가르치는 쪽이라는 점.

### 5. 복사 버튼과 피드백

| 자리 | 정본 | 쓰지 않는 말 |
| --- | --- | --- |
| 버튼 라벨 | 명사형 **`복사`** (대상이 있으면 `결과 복사` `APA 복사` `표로 복사`) | `복사하기` `문장 복사하기` `표로 복사하기` |
| 성공 피드백 (버튼 라벨이 바뀜) | **`복사됨`** | `복사했습니다` |
| 실패 피드백 | `복사하지 못했습니다. 위 내용을 직접 선택해 복사해주세요.` (RandomSampler의 문장) | — |

- 근거: 성공 피드백 `복사됨` 13 : `복사했습니다` 1, 명사형 라벨 10 : `-하기` 3.
- 실패 문장의 `-해주세요`는 4번 규칙(사용자가 직접 할 일을 요청)에 맞는다.
```

「적용 기록」에 한 줄: `- 2026-09-XX: UI 어투 10줄·복사 문구 4곳 (KO2·KO3)`.

**함정**
- `ERROR_MESSAGES`(`PriorResearchSearch.tsx:11-20`)는 **M2(커밋 51)가 `aria-describedby`로 연결하고, ER3(04b)가 결과 게이팅을 바꾸며, L2/L3(32)가 `:7`을 바꾼다.** 문구 줄만 바뀌므로 충돌은 없지만 **커밋 72b 착수 시 줄 번호를 재측정**한다.
- 테스트가 문구를 잡는 곳: `PriorResearchSearch.test.tsx:80`은 `/요청이 많이/`(rate-limit, 변경 없음). `RandomSampler.test.tsx`는 `"결과 복사"` 버튼 이름(변경 없음). **변경 문구를 잡는 테스트는 0개**(grep 확인) — 그래서 이 커밋은 테스트 없이 나간다. 문구 회귀 방지선을 원하면 `components/__tests__/uiTone.test.ts`로 소스를 읽어 `확인해보세요`·`추가해보세요` 0회를 잠글 수 있다. **권하지 않는다** — `-해보세요`가 허용되는 경우(시도)가 있어 정규식이 규칙을 못 담는다.

**커밋:** 절 추가 → **72**(style-terms 신설 커밋에 동봉). 적용 → **72b**(새 커밋).

### 2.3 KO3 — 복사 문구

| 파일:줄 | before | after |
| --- | --- | --- |
| `components/ResearchShowcaseForm.tsx:268` | `{copied === "done" && "복사했습니다"}` | `{copied === "done" && "복사됨"}` |
| `:252` | `복사하기` (버튼) | `복사` |
| `:275` | `복사하기를 눌러 받은` | `복사를 눌러 받은` |
| `components/ObjectiveTemplateGenerator.tsx:144` | `"문장 복사하기"` | `"문장 복사"` |
| `components/VariableTableBuilder.tsx:114` | `"표로 복사하기"` | `"표로 복사"` |

**함정**
- `ResearchShowcaseForm.tsx:268`은 버튼 라벨이 아니라 **별도 텍스트**로 보인다(`{copied === "done" && …}`). 다른 도구처럼 버튼 라벨을 바꾸는 방식으로 통일할지는 **KB6·AC5(커밋 52b)가 같은 컴포넌트의 링크·버튼 구조를 만지므로 그때 판단**한다. 72b에서는 문구만 바꾼다.
- `VariableTableBuilder.tsx`는 G7(43)·KB4(43)·ER9(43)가 먼저 만진다. 72b 착수 시 `:114` 재측정.
- 버튼 이름으로 요소를 찾는 테스트: grep 결과 `복사하기`·`문장 복사`·`표로 복사`를 잡는 테스트 **0개**.

**커밋:** **72b**.

### 2.4 KO4 — 긴 문장 2건

**`content/articles/26-small-sample.mdx:16`** (111자 · 절 5 · 번역투 `-에 대한`)

before
```
둘 다 틀렸습니다. 적은 표본은 **연구를 못 하게 만드는 조건이 아니라 결론의 범위를 좁히는 조건**입니다. 문제는 그 범위가 어디까지인지 아무도 알려주지 않는다는 것입니다. 몇 명이면 되는지에 대한 대략의 숫자는 [자주 묻는 질문](/articles/faq)의 설문 인원 항목에 있으니 그건 거기서 확인하시고, 이 글은 그다음을 다룹니다 — **이미 인원이 적게 확정된 상태에서** 무엇을 말할 수 있고, 무엇을 하면 안 되고, 설계를 어떻게 바꾸고, 보고서에 어떤 문장을 쓰는가.
```
after
```
둘 다 틀렸습니다. 적은 표본은 **연구를 못 하게 만드는 조건이 아니라 결론의 범위를 좁히는 조건**입니다. 문제는 그 범위가 어디까지인지 아무도 알려주지 않는다는 것입니다. 몇 명이면 되는지 대략의 숫자는 [자주 묻는 질문](/articles/faq)의 설문 인원 항목에 있으니 거기서 확인하세요. 이 글은 그다음을 다룹니다. **이미 인원이 적게 확정된 상태에서** 무엇을 말할 수 있고 무엇을 하면 안 되는지, 설계를 어떻게 바꾸는지, 보고서에 어떤 문장을 쓰는지입니다.
```
(`-에 대한` 제거, 대시 뒤 명사구를 `-입니다`로 닫음, `확인하시고` → `확인하세요`로 문장 분리. KO2 규칙과 일치.)

**`content/showcase/05-focused-ultrasound-bbb.mdx:55`** (132자 — M4(커밋 24) 이후 파일명 `02-focused-ultrasound-bbb.mdx`)

before
```
이 탐구도 한계를 네 가지 적었습니다. 각 기포가 상대의 존재와 무관하게 진동한다고 두고 그 결과로 힘을 계산한 일방향 근사라는 점, 기포 간격을 20 마이크로미터 한 값으로 고정했다는 점, 혈관벽이라는 기하학적 구속을 무시하고 무한한 유체를 가정했다는 점, 그리고 모든 조합이 인력으로 나온 이유를 추가 계산 없이 정성적으로만 설명했다는 점입니다.
```
after
```
이 탐구도 한계를 네 가지 적었습니다. 첫째, 각 기포가 상대의 존재와 무관하게 진동한다고 두고 그 결과로 힘을 계산한 일방향 근사라는 점입니다. 둘째, 기포 간격을 20 μm 한 값으로 고정했다는 점입니다. 셋째, 혈관벽이라는 기하학적 구속을 무시하고 무한한 유체를 가정했다는 점입니다. 넷째, 모든 조합이 인력으로 나온 이유를 추가 계산 없이 정성적으로만 설명했다는 점입니다.
```
(`20 마이크로미터` → `20 μm`은 KO5의 단위 규칙(같은 파일의 `302 μL`와 통일). 원문 유지를 원하면 `20 마이크로미터`로 둔다 — 문장 분할과 무관.)

**함정**
- `05-fus`는 batch8 Y9(커밋 75)가 `:15`·`:27`을, M6/M7(74)이 절 이름과 화자 문장을 고친다. `:55`는 「스스로 밝힌 한계」 절이 될 자리다 — **M6가 이 절의 이름을 바꾸면서 줄이 밀린다.** 75에서 재측정.
- `26-small-sample:16`은 U2(`:48`, 커밋 08)·V3(`:81` `:84`, 커밋 39)·M9(`:58`, 커밋 78)와 줄이 겹치지 않고, 그 셋이 전부 `:16`보다 뒤라 **줄 번호가 밀리지 않는다.**

**커밋:** `26-small-sample:16` → **80**. `05-fus:55` → **75**.

### 2.5 KO5 — 단위 표기 + `℃`

**규칙 (style-terms.md 「6. 숫자와 단위」로 추가 — 전문)**

```markdown
### 6. 숫자와 단위

- **숫자와 단위기호 사이를 띄운다** (SI 관례): `20 g` `15 mL` `1.1 cm` `55 °C` `20 μm`.
- 예외 — 붙여 쓴다: 백분율 `50%`, 각도 `90°`, 배율 `2배`·`×10`, 시각 `10:30`, 한글 단위 `3명`·`두 시간`.
- 섭씨는 **`°C`** (도 기호 U+00B0 + C). 합자 `℃`(U+2103)는 쓰지 않는다 — 폰트에 따라 모양이 다르고 SI·KS 표기가 아니다. `도`로 풀어 쓰지도 않는다.
- 근거: 실험 프로토콜을 담은 글(`27-lab-notebook`, 사례 `lysozyme`)이 이미 띄어 쓰고 있고, 학생이 논문에 옮길 때 SI 규칙 쪽이 안전하다.
```

**적용표**

| 파일:줄 | before → after |
| --- | --- |
| `content/showcase/01-lysozyme-charge-aggregation.mdx:17` (→ M4 후 `03-…`) | `−20 ℃ 아세톤` → `−20 °C 아세톤` |
| `:27` | `항온수조 55 ℃에서` → `항온수조 55 °C에서` |
| `content/articles/14-figure-first.mdx:63` | `체중 1kg당 카페인 3mg` → `체중 1 kg당 카페인 3 mg` |
| `:67` | `33cm에서 39cm` → `33 cm에서 39 cm` (같은 줄의 다른 cm도 전부) |
| `:69` | `34.7cm 대 … 4.7cm … 5.8cm` → 띄어 씀 |
| `:73` | `평균 1.1cm 높았고` → `평균 1.1 cm 높았고` |
| `content/articles/15-borrowing-methods.mdx:73` | `전자저울(0.001g) \| 전자저울(0.01g)` → `전자저울(0.001 g) \| 전자저울(0.01 g)` |
| `content/articles/24-question-to-test.mdx:66` | `1cm` → `1 cm` — **Y7(커밋 80)이 이 줄을 통째로 다시 쓴다.** Y7의 새 문안이 단위 규칙을 따르면 끝 |
| `impl-plan-batch8.md` V1 문안 (`05-writing:76`, 커밋 79) | `0 ℃부터` → `0 °C부터` (§0-5) |

**함정**
- `14-figure-first:63`의 `1kg당`은 **인용된 논문 캡션의 한국어 풀이**다. 원문 영어 캡션(`"…15-s maximal jump test"`)은 건드리지 않는다 — `15-s`는 영어 하이픈 표기로 맞다.
- `−20 °C`의 `−`(U+2212)는 그대로 둔다. 하이픈이 아니라 마이너스다.
- 사례 편집 커밋(74·75)이 화자·절 구조를 갈아엎으므로 **`:17` `:27`은 75에서 재측정**한다.

**커밋:** 규칙 → **72**. 사례 2곳 → **75**. 자료실 3편 → **80**.

---

## 3. 커밋 분할 요약 (마스터 편입표와 일치)

| 마스터 커밋 | 항목 | 이 문서 |
| --- | --- | --- |
| **02** (S2) | TQ7 TQ14 + 헬퍼 node 분기 | §1.7 §1.14 |
| **02b** (신규) `test: 테스트 품질 즉시 수정 (TQ1 TQ6 TQ8 TQ11 TQ12, TQ2-b)` | 테스트 5파일 + `ContinueCard.tsx:40` 한 줄 | §1.1 §1.2 §1.6 §1.8 §1.11 §1.12 |
| **05a** (신규) `test(chart): 막대 계약을 data-role로 (TQ5)` | `SimpleChart.tsx` 속성 2줄 + 테스트 3건 교체 | §1.5 |
| **05** (K3 ER2) | ER2 회귀 테스트(라벨 짝) | §1.5 |
| **06** (L1) | TQ4 | §1.4 |
| **16** (A1 PF2) | TQ9 | §1.9 |
| **33** (H2) | TQ13 | §1.13 |
| **72** (style-terms) | KO2 절 4 · KO3 절 5 · KO5 절 6 | §2.2 §2.5 |
| **72b** (신규) `fix(ui): UI 어투·복사 문구 정본 적용 (KO2 KO3 KO1-PRS)` | 컴포넌트 10파일 | §2.1 §2.2 §2.3 |
| **75** (Y9 Y10) | KO4-fus KO5-℃ | §2.4 §2.5 |
| **79** (V1) | V1 문안 `°C` | §0-5 |
| **80** (Y5~S9) | KO1 riss·scholar, KO4-small, KO5 자료실 | §2.1 §2.4 §2.5 |
| **85** (S8ab) | TQ3 TQ10 | §1.3 |

**어느 커밋에서도 프로덕션 동작이 바뀌지 않는다** — 예외는 `ContinueCard.tsx:40`(문구가 데이터를 따름)과 KO 문구 자체다.
