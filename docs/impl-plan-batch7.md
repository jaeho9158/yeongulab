# 구현 설계 — 묶음 5.5 · 6 · 7 (16건)

라운드 13. 대상: **L7 C4** / **H3 H4 B2** / **S4 O6 O8 P1 P2 P3 P4 B5 B6 C3 C6**

모든 줄 번호·개수·존재 여부는 이 문서를 쓰면서 파일에서 직접 확인했다.
백로그 판정과 어긋난 것은 §0에 먼저 모았다.

---

## §0. 백로그 판정 정정 (이번 라운드에서 새로 확인한 9건)

| # | 백로그 주장 | 실측 | 영향 |
| --- | --- | --- | --- |
| 1 | P2 "링크 없는 도구 **9개**" | **5개**다. `TOOL_IDS` 24개 중 본문(자료실·가이드·사례)에서 `#tool-` 앵커로 걸린 것이 19개. 미연결은 `survey-bias` `phrases` `length` `ai-disclosure` `showcase` | P2 작업량이 절반 이하. §P2가 5개 전부의 실제 삽입 위치를 지정 |
| 2 | P2 "`ai-disclosure`는 31편 어디에도 링크가 없다" | 텍스트 포인터는 **있다** — `04-research-ethics.mdx:61` "[3단계: 방법론 설계](/guide/methodology)에 이 문장을 만들어주는 도구가 있습니다." 단계가 틀렸고(실제 submission) 앵커가 없어 앵커 검증을 통과해 버렸다 | **P2와 U4는 같은 한 줄 수정**이다. 따로 잡지 말 것 |
| 3 | O8 "허브 2편 out **0**" | 자료실 글로 나가는 링크가 0이다. `/guide/*` 링크는 각각 3개·3개 있다. `statistics` inbound는 7이 아니라 **10**(사례 3편 포함) | 표현만 정정. 처방은 유효 |
| 4 | P1 "고아 **4편**" | 자료실 글 기준 inbound 0은 `survey-questions` `why-topics-go-stale` `finding-calls` **3편**. `public-data-topics`는 inbound 2지만 **둘 다 사례**(`03-sex-difference-adr`, `04-aria-deep-learning`)라 자료실 안에서는 고아 | "고아 4편"은 유지하되 근거가 다르다. `public-data-topics`는 사례에서만 들어온다 |
| 5 | C6 "비어 있는 사례 슬롯 채우기" | **이미 끝나 있다.** 사례 6편 전부가 대응 자료실 글에 서사 문단 + 링크로 흡수돼 있다(17:90, 21:71, 23:73, 27:112, 29:111, 30:75). 라운드 6 기준("사례는 증거")을 이미 충족 | **C6은 신규 작업 없음.** §C6이 남은 잔여분만 정의 |
| 6 | P4 "유입은 자료실 본문 인라인 **8개**" | **6개**다(사례 6편 × 각 1). 앱 코드 링크는 `/showcase/{slug}` → `/showcase` 하나뿐이라는 판정은 맞다 | 푸터 항목 추가라는 처방은 유효 |
| 7 | C4 "**대부분의** 도구가 무시" + 대상 4개 | `usePersistentState` 호출부 **15곳**, `saveError` 구조분해 **3곳**(`ImradChecker` `LengthChecker` `SurveyBiasChecker`), 무시 **12곳**. 그런데 C4가 지목한 4개 중 **레퍼런스(`ReferenceList`)·마감일(`DeadlineTracker`)은 이 훅을 안 쓴다** — 각각 `lib/citations.ts`, 자체 `localStorage` 경로 | PersistNotice의 적용 대상 목록을 다시 짜야 한다. §C4 참고 |
| 8 | B6 "`lib/korean.ts` 글자수 로직 재사용" | `lib/korean.ts`에는 글자수 로직이 **없다**(조사 판정 `hasBatchim`/`josa`뿐). 글자수 세는 코드는 `LengthChecker.tsx:8-10`, `SpeechTimer.tsx:11` | 새로 `lib/readingTime.ts`를 만든다 |
| 9 | H3/H4 전제 "도구 24 → 26이면 하드코딩 24를 찾아야" | **하드코딩된 24는 사이트에 0곳**이다. `app/tools/page.tsx:11`이 `getTotalUniqueToolCount()`를 쓰고 메타·본문 모두 그 변수를 참조한다. 남은 건 `lib/stageToolMeta.ts:5`의 주석 "21개 도구"(이미 낡음) | 연쇄 목록에서 "숫자 하드코딩" 항목 삭제. §H3 §H4의 연쇄는 타입·표 기반 |

---

# 묶음 5.5 — 저장 계층

## L7. `usePersistentState` 쓰기 디바운스

### 현재 코드 (`lib/usePersistentState.ts:61-76`)

```ts
  function set(next: T | ((prev: T) => T)) {
    setSeeded((prev) => {
      const base = prev ?? initialValue;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(base) : next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(resolved));
        // 저장에 성공하면 이전 경고를 걷는다(저장 공간을 비운 뒤 등)
        setSaveError(null);
      } catch {
        // 조용히 넘기면 화면은 멀쩡한데 새로고침에 전부 사라진다
        setSaveError(PERSIST_ERROR_MESSAGE);
      }
      return resolved;
    });
  }
```

`setItem`이 `setSeeded` 업데이터 **안에서** 돈다. 키 입력 1회 = 직렬화 1회.
호출부는 15곳이고 그 중 텍스트영역에 전문을 붙여넣는 것이 `LengthChecker`(`length-checker`),
`SpeechTimer`(`speech-timer`), `ImradChecker`(`imrad-draft`), `SurveyBiasChecker`(`survey-bias`) 넷이다.

### 변경 후 코드 (전문 교체)

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSeededState } from "./useSeededState";

export const PERSIST_ERROR_MESSAGE =
  "브라우저 저장소에 저장하지 못했습니다(프라이빗 모드나 저장 공간 부족일 수 있어요). 이 내용은 새로고침하면 사라집니다.";

/**
 * 쓰기를 미루는 최대 시간(ms).
 *
 * 리셋되는 디바운스가 아니라 **선행 타이머를 연장하지 않는 트레일링 스로틀**이다.
 * 리셋형이면 빠르게 계속 타이핑하는 동안 한 번도 저장되지 않아, 탭이 죽으면
 * 문단 전체를 잃는다. 연장하지 않으면 최악의 경우에도 250ms마다 한 번은 쓴다.
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

  // 아직 디스크에 안 내려간 값. 담긴 키까지 같이 들고 다닌다 — storageKey가
  // 바뀌는 순간(예: slug 이동) 새 키에 옛 값을 쓰면 남의 기록을 덮어쓴다.
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

  // 언마운트·키 변경 전에 반드시 내보낸다. cleanup은 React가 동기로 부르므로
  // 라우터 이동·조건부 언마운트·StrictMode 재마운트 모두 여기로 들어온다.
  useEffect(() => flush, [flush, storageKey]);

  // 탭을 닫거나 백그라운드로 보내면 cleanup이 아예 안 돈다. pagehide는
  // bfcache 진입까지 포함해 모바일 사파리에서 실제로 발화하는 유일한 신호다.
  useEffect(() => {
    function onLeave() {
      flush();
    }
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
    };
  }, [flush]);

  function set(next: T | ((prev: T) => T)) {
    setSeeded((prev) => {
      const base = prev ?? initialValue;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(base) : next;
      // 업데이터 안의 유일한 부수효과. ref에 같은 값을 두 번 넣는 것은
      // 멱등이라 StrictMode 이중 호출에서도 결과가 같다. 함수형 업데이트를
      // 유지해야 한 핸들러에서 set을 두 번 부르는 호출부가 안 깨진다.
      pendingRef.current = { key: storageKey, value: resolved };
      return resolved;
    });
    if (timerRef.current === null) {
      timerRef.current = window.setTimeout(flush, WRITE_DELAY_MS);
    }
  }

  return [value, set, saveError];
}
```

### 질문에 대한 답

**언마운트 flush를 어떻게 보장하나**
`useEffect(() => flush, [flush, storageKey])`의 cleanup. `flush`는 `useCallback([])`이라
정체성이 고정이므로 이 이펙트는 **`storageKey`가 바뀔 때와 언마운트 때만** 돈다.
`pendingRef`가 옛 키를 들고 있으니 키 전환 시 옛 값은 옛 키로 정확히 내려간다.

**세 가지 상황별 결과**

| 상황 | cleanup | `pagehide` | 결과 |
| --- | --- | --- | --- |
| 탭 닫기 / 창 닫기 | 안 돔 | **발화** | 저장됨 |
| 페이지 이동(Next.js 클라이언트 라우팅) | **돔** | 안 돔 | 저장됨 |
| 페이지 이동(전체 새로고침·외부 링크) | 안 돔 | **발화** | 저장됨 |
| 모바일에서 앱 전환 | 안 돔 | `visibilitychange` **발화** | 저장됨 |
| 브라우저 프로세스 강제 종료 / 크래시 | 안 돔 | 안 돔 | **최대 250ms 분량 손실** |

마지막 칸이 이 수정이 만드는 유일한 새 손실이고, 그래서 리셋형 디바운스를 쓰지 않는다.
`beforeunload`는 쓰지 않는다 — 리스너를 등록하는 것만으로 bfcache가 무효화되고,
모바일에서는 발화 보장도 없다. `pagehide`가 상위 호환이다.

**`saveError`는 언제 나타나나**
디바운스 후 첫 `flush`에서. 즉 **입력이 멈춘 뒤 최대 250ms 뒤**에 나타난다.
현재는 첫 글자에 즉시 뜬다. 250ms는 사람이 "쳤더니 나왔다"로 인식하는 범위 안이고,
`aria-live="polite"`로 읽히는 컴포넌트에서는 오히려 글자마다 재낭독되지 않아 낫다.
**표시 지연이 문제가 되는 유일한 경로는 "붙여넣고 곧바로 탭을 닫는" 경우**인데,
그때는 `pagehide` flush가 돌아 `setSaveError`를 부르지만 화면이 이미 사라진 뒤다.
이 경우 사용자는 경고를 못 본다 — **현재 코드도 못 본다**(붙여넣기 직후 닫으면
마찬가지). 회귀가 아니다. 명시적으로 "구현 시 판단 필요"로 남기지 않고 수용한다.

**K2(`citations.ts`)·C4와 같이 들어올 때 충돌하나**
- **K2와는 충돌하지 않는다.** `lib/citations.ts`의 `addReference`는 이 훅을 전혀 쓰지 않고
  `REFERENCES_STORAGE_KEY`(`research-guide:references`)에 직접 쓴다. 접점 0.
- **C4와는 같은 파일이지만 충돌하지 않는다.** C4는 `saveError`를 *읽는* 쪽(새 컴포넌트)만
  건드리고, L7은 *만드는* 쪽만 건드린다. 다만 **L7을 먼저 넣어야 한다** — C4의 표시 타이밍
  테스트를 L7 이후 기준으로 한 번만 쓰기 위해서다.

**기존 테스트가 깨지나 — 정확히 어느 `it()`인가**

`lib/__tests__/usePersistentState.test.tsx`는 `it()` **5개**. 그 중 **2개**가 깨진다.

| 줄 | `it()` | 판정 |
| --- | --- | --- |
| 36 | 저장된 값을 마운트 후 복원한다 | 통과 (읽기만) |
| 42 | **값을 바꾸면 localStorage에 저장한다** | **깨짐** — `click` 직후 동기로 `getItem`을 본다 |
| 50 | **setItem이 던지면 저장 실패를 노출한다** | **깨짐** — `click` 직후 동기로 error 노드를 본다 |
| 67 | 읽기가 실패해도 초기값으로 정상 렌더된다 | 통과 |
| 77 | 손상된 저장값은 무시하고 초기값을 쓴다 | 통과 |

**저장소 전체에서 하나 더 깨진다:**
`components/__tests__/StatsCalculator.test.tsx:90` `it("입력값이 localStorage에 유지된다")` —
`await fill(...)` 직후 동기로 `getItem("research-guide:tool:stats-calculator")`를 읽는다.

나머지 `localStorage`를 만지는 테스트(`ChecklistCard` `ContinueCard` `DeadlineTracker`
`ReflectionBox` `SampleSizeCalculator` `SimpleChart` `CitationFormatter` `RandomSampler`)는
전부 (a) 씨딩용 `setItem`이거나 (b) 이 훅을 안 쓰는 경로라 **영향 없다**. 확인함.

**깨진 3개의 수정 방법** — 세 곳 모두 어서션을 `waitFor`로 감싼다. 가짜 타이머는 쓰지 말 것:
`userEvent`가 실제 타이머에 의존해 `advanceTimers` 배선 없이는 타이핑이 멈춘다.

```ts
    await waitFor(() =>
      expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify("바뀐 값")),
    );
```

### 함정

1. **업데이터 안의 ref 쓰기.** 유일한 부수효과이고 멱등이다. `value`를 클로저로 읽어
   업데이터 밖에서 계산하는 대안은 한 핸들러 안 연속 `set(fn)` 두 번을 붕괴시킨다 — 채택 금지.
2. **`useEffect(() => flush, [flush, storageKey])`에서 `storageKey`를 빼면** 키 전환 시
   옛 값이 새 키에 쓰인다. deps에 반드시 남길 것. (`flush` 자체는 `storageKey`를 안 읽는다 —
   `pendingRef`에 든 키를 쓴다. 이게 이 설계의 핵심이다.)
3. **`visibilitychange`는 `hidden`·`visible` 양쪽에서 발화**한다. `flush`가 pending 없으면
   즉시 리턴하므로 `visibilityState` 검사는 불필요하고, 넣으면 오히려 분기가 는다.
4. 이 훅은 `"use client"` 모듈이고 `window`를 이벤트 등록에서만 쓴다 — 이펙트 안이라 SSR 안전.

### 테스트 (`lib/__tests__/usePersistentState.test.tsx`에 추가)

- `it("연속 입력 중에는 setItem이 매 입력마다 돌지 않는다")` — `Storage.prototype.setItem`을
  spy로 감싸고 `Probe`의 버튼을 5회 연속 클릭. `waitFor`로 최종 값 확인 후
  `setItem` 호출 수가 **5보다 작다**고 단언(정확한 수를 박으면 타이밍에 취약).
- `it("언마운트해도 마지막 입력이 저장된다")` — 클릭 직후 `unmount()`를 즉시 부르고
  `getItem`이 마지막 값을 갖는지 **동기로** 확인(cleanup은 동기 실행).
- `it("pagehide가 발화하면 대기 중인 값을 즉시 저장한다")` — 클릭 후
  `window.dispatchEvent(new Event("pagehide"))`, 동기 `getItem` 확인.
- `it("키가 바뀌면 옛 값을 옛 키에 저장한 뒤 새 키를 읽는다")` — `key` prop을 받는 Probe로
  `rerender`. 옛 키에 마지막 값이 남고 새 키 값으로 화면이 바뀌는지.
- `it("저장 실패 경고는 디바운스 후에 뜬다")` — `setItem` throw 모킹 후 클릭.
  **즉시**는 빈 문자열, `waitFor` 후 `PERSIST_ERROR_MESSAGE`.

### 커밋 분할

1. `fix(storage): usePersistentState 쓰기를 250ms 트레일링 스로틀로` — 훅 + 기존 테스트 2건 `waitFor` 전환
2. `test(storage): 언마운트·pagehide·키 전환 flush 회귀선 4건`
3. `test(stats): StatsCalculator 저장 어서션을 waitFor로` — StatsCalculator.test.tsx:90

---

## C4. `PersistNotice` 공용 컴포넌트

### grep 실측 — `saveError` 반환을 받는 곳과 무시하는 곳

`usePersistentState` 호출부 **15곳** 전부:

| 컴포넌트 | 줄 | `saveError` | 입력량 |
| --- | --- | --- | --- |
| `ImradChecker.tsx` | 100 | **받음** | 큼(초고 전문) |
| `LengthChecker.tsx` | 6 | **받음** | 큼(본문 전문) |
| `SurveyBiasChecker.tsx` | 29 | **받음** | 큼(설문 전문) |
| `SpeechTimer.tsx` | 9 | 무시 | **큼(발표 대본 전문)** |
| `VariableTableBuilder.tsx` | 12 | 무시 | **큼(행 무제한)** |
| `ResearchShowcaseForm.tsx` | 67 | 무시 | **큼(양식 전체)** |
| `StatsCalculator.tsx` | 17 | 무시 | 중(데이터 두 열) |
| `SimpleChart.tsx` | 37 | 무시 | 중 |
| `CitationFormatter.tsx` | 31 | 무시 | 중 |
| `AcademicPhrases.tsx` | 23 | 무시 | 작음(필터 상태) |
| `ObjectiveTemplateGenerator.tsx` | 16 | 무시 | 작음 |
| `RandomSampler.tsx` | 8 | 무시 | 작음 |
| `SampleSizeCalculator.tsx` | 18 | 무시 | 작음 |
| `ResearchDesignQuiz.tsx` | 167 | 무시 | 작음(선택지) |
| `FigureCaptionHelper.tsx` | 10 | 무시 | 작음 |

**3 받음 / 12 무시.** 백로그가 지목한 4개 중 `레퍼런스`(`ReferenceList` → `lib/citations.ts`)와
`마감일`(`DeadlineTracker` → 자체 `localStorage` + 자체 문구)은 **이 훅을 쓰지 않아 C4 대상이 아니다.**
DeadlineTracker는 이미 자체 오류 문구를 띄우므로 결함도 아니다.

### 새 파일 `components/PersistNotice.tsx`

```tsx
"use client";

/**
 * usePersistentState의 saveError를 화면에 붙이는 공용 표시.
 *
 * 도구마다 문구·색·aria 설정이 조금씩 달라지면 같은 사고를 다른 말로
 * 알리게 된다. 표시 방식을 여기 한 곳에 고정한다.
 *
 * saveError가 null이면 아무것도 그리지 않는다. 그런데 <p>는 항상 남긴다 —
 * aria-live 영역은 노드가 DOM에 먼저 있어야 이후의 텍스트 삽입이 낭독된다.
 * (나중에 통째로 삽입되는 live 영역은 대부분의 낭독기가 읽지 않는다.)
 */
export function PersistNotice({ error }: { error: string | null }) {
  return (
    <p
      aria-live="polite"
      className="mt-2 text-xs leading-relaxed text-danger empty:mt-0"
    >
      {error}
    </p>
  );
}
```

`empty:mt-0`은 오류가 없을 때 여백이 남지 않게 한다(빈 `<p>`가 항상 있으므로 필요).
`text-danger`는 `LengthChecker.tsx:32`가 이미 쓰는 색이라 새 토큰이 아니다 — 확인함.

### 적용 대상 (이번 커밋)

**입력량이 큰 6곳까지만.** 나머지 9곳은 값이 몇 글자라 잃어도 재입력이 5초다.

1. `SpeechTimer.tsx:9` — `const [text, setText, saveError] = ...` 로 바꾸고 textarea 아래
2. `VariableTableBuilder.tsx:12` — 세 번째 원소를 받아 `:117`의 `copyFailed` `<p>` **위**에 배치
3. `ResearchShowcaseForm.tsx:67`
4. `StatsCalculator.tsx:17`
5. `SimpleChart.tsx:37`
6. `CitationFormatter.tsx:31`

기존 3곳(`ImradChecker` `LengthChecker` `SurveyBiasChecker`)은 손수 만든 `<p>`를
`<PersistNotice error={saveError} />`로 **치환**한다. 문구 통일이 이 항목의 목적이다.

### L7 디바운스가 들어오면 표시 타이밍

`saveError`는 이제 **첫 flush 시점**(입력 멈춤 후 ≤250ms, 또는 `pagehide`)에 켜진다.
- 사용자 체감: 마지막 글자를 친 뒤 사분의 일 초 뒤 경고가 뜬다. 이전은 첫 글자 즉시.
- **`aria-live="polite"` 관점에서는 개선이다.** 현재는 글자마다 `setSaveError`가 불리는데
  값이 같으면 React가 리렌더를 안 하므로 재낭독은 없다 — 즉 낭독 회수는 변하지 않고,
  경고 등장이 250ms 늦어질 뿐이다.
- **한 번 켜진 경고는 다음 성공 flush 전까지 유지**된다(`setSaveError(null)`이 flush 성공에만).
  디바운스 때문에 경고가 깜빡이는 일은 없다.

### 함정

- `PersistNotice`를 조건부 렌더(`{saveError && <PersistNotice .../>}`)로 감싸면
  live 영역이 뒤늦게 삽입돼 낭독이 안 된다. **항상 렌더한다.**
- `VariableTableBuilder`에는 이미 `aria-live="polite"` `<p>`(복사 실패, `:117`)가 있다.
  live 영역 둘이 나란히 있는 것은 허용되지만 **저장 실패를 위에** 둔다 — 더 심각한 사고다.
- 여섯 컴포넌트 모두 구조분해를 `[a, b]` → `[a, b, saveError]`로 늘리는 것뿐이라
  타입 변화 없음(훅 반환 타입이 이미 3-튜플).

### 테스트 (`components/__tests__/PersistNotice.test.tsx`, 신규)

- `it("error가 null이면 텍스트가 비어 있지만 live 영역 노드는 남는다")` —
  `container.querySelector('[aria-live="polite"]')`가 non-null, `textContent === ""`.
- `it("error 문자열을 그대로 표시한다")`.
- `it("SpeechTimer가 저장 실패를 화면에 알린다")` (`SpeechTimer.test.tsx` 신규) —
  `setItem` throw 모킹 + 타이핑 + `waitFor`로 `PERSIST_ERROR_MESSAGE` 등장.
  **S2(저장 실패 모킹 복제)가 요구한 패턴을 여기서 처음 쓴다** — S2보다 먼저 들어오면
  S2의 헬퍼 자리로 그대로 승격 가능.

### 커밋 분할

1. `feat(ui): PersistNotice 공용 저장 실패 표시` — 컴포넌트 + 테스트 + 기존 3곳 치환
2. `fix(tools): 입력량 큰 도구 6곳에 저장 실패 표시` — SpeechTimer 외 5곳 + SpeechTimer 테스트

---

# 묶음 6 — 도구 (약속 이행만)

## 새 도구 추가 시 연쇄 목록 (H3·H4 공통)

`lib/stageToolMeta.ts`에 제목을 넣으면 **컴파일 에러로 강제되는 곳**과
**조용히 통과하는 곳**이 나뉜다. 후자가 위험하다.

| # | 파일 | 무엇 | 타입이 잡나 |
| --- | --- | --- | --- |
| 1 | `lib/stageToolMeta.ts:20-51` `STAGE_TOOL_TITLES` | 제목 추가 (진입점) | — |
| 2 | `lib/stageToolMeta.ts:54` `ToolTitle` | 자동 확장 | 자동 |
| 3 | `lib/stageToolMeta.ts:61-90` `TOOL_DESCRIPTIONS` | 한 줄 설명 | **잡는다** (`satisfies Record<ToolTitle, string>`) |
| 4 | `lib/stageToolMeta.ts:96-121` `TOOL_IDS` | 앵커 id | **잡는다** (`satisfies Record<ToolTitle, string>`) |
| 5 | `components/StageTools.tsx:97-122` `TOOL_RENDERERS` | 렌더러 매핑 | **잡는다** (`Record<ToolTitle, ...>`) |
| 6 | `components/StageTools.tsx:17-94` | `dynamic()` import 선언 추가 | 5번이 간접적으로 잡는다 |
| 7 | `app/tools/page.tsx` | **자동.** `STAGE_TOOL_TITLES`를 순회하고 개수는 `getTotalUniqueToolCount()` | 손댈 것 없음 |
| 8 | `app/page.tsx:191` `도구 {getToolCount(stage.slug)}` | **자동** | 손댈 것 없음 |
| 9 | `lib/__tests__/stageToolMeta.test.ts` | **자동으로 새 도구를 검사**(4개 `it` 모두 `Object.values(...).flat()` 기반) | 손댈 것 없음 |
| 10 | `app/privacy/page.tsx` 저장 항목 목록 | **조용히 낡는다** — 새 localStorage 키가 문서에 없다 | **안 잡는다. T8이 이 구멍이다** |
| 11 | `content/guide/*.mdx`의 "도구" 칸 | **조용히 낡는다** — 표 칸이 `—`인 채 남는다 | **안 잡는다. T5가 이 구멍이다** |
| 12 | `components/__tests__/StageTools.test.tsx` | 인덱스로 `details[0]`/`details[1]`을 잡는다 | **순서를 바꾸면 깨진다.** 새 도구를 **맨 뒤에** 넣으면 안전 |

**하드코딩된 `24`는 없다**(§0-9). 도구가 26개가 되면 `/tools` 메타 타이틀이
자동으로 "연구 도구 26개"가 된다. 부수적으로 `lib/stageToolMeta.ts:5`의
"21개 도구" 주석만 낡은 채 남아 있으니 이 커밋에서 같이 고친다.

**공통 함정**: `STAGE_TOOL_TITLES`의 배열 **순서**가 아코디언 순서다.
`StageTools.test.tsx:22-23`과 `:47-52`가 `details[0]`/`details[1]`을 인덱스로 본다.
새 도구는 해당 단계 배열의 **끝**에 추가한다. (H4는 예외 — 아래에서 다룬다.)

---

## H3. 검색 기록표 — `PriorResearchSearch`에 "기록에 남기기"

### 근거 (확인함)

`content/guide/02-prior-research.mdx:52`
> 검색할 때마다 **날짜·검색 사이트·키워드·결과 건수**를 한 줄씩 표로 남기세요.

`:54-57`에 5열 예시 표(`| 날짜 | 사이트 | 키워드 | 건수 | 메모 |`)까지 있다.
2단계 도구는 `["선행연구 검색해보기", "내 레퍼런스 목록"]` 둘뿐이고 어디에도 로그가 없다.

### 컴포넌트 안에 이미 있는 값 (`components/PriorResearchSearch.tsx`)

| 표 열 | 출처 | 줄 |
| --- | --- | --- |
| 날짜 | 없음 → `new Date()` | — |
| 사이트 | `source` 상태 (`"semantic-scholar" \| "openalex" \| "crossref"`) | 42, 77-81 |
| 키워드 | `runSearch(rawQuery)`의 `q` — **`query` 상태가 아니다.** 예시 칩은 `setQuery` 직후 실행이라 상태가 아직 안 바뀐다(:57-58 주석) | 59-61 |
| 건수 | `results.length` | 41, 76 |
| 메모 | 사용자 입력 | — |

**즉 "자동으로 채워진다"는 백로그 주장은 맞다.** 단, 키워드는 반드시 `q`(정규화된 값)를
따로 상태에 저장해야 한다. `query`를 쓰면 칩 검색이 빈 문자열로 기록된다 — 이게 함정이다.

### 변경

`runSearch` 성공 경로(`:82` `setStatus("done")` 직전)에 마지막 검색 메타를 남긴다:

```ts
  const [lastSearch, setLastSearch] = useState<{
    query: string;
    source: SearchSource;
    count: number;
  } | null>(null);
```
```ts
      const resolvedSource: SearchSource =
        data.source === "openalex" || data.source === "crossref"
          ? data.source
          : "semantic-scholar";
      const rows = Array.isArray(data.data) ? (data.data as Paper[]) : [];
      setResults(rows);
      setSource(resolvedSource);
      setLastSearch({ query: q, source: resolvedSource, count: rows.length });
      setStatus("done");
```

기록 자체는 별도 훅 모듈로 뺀다 — `PriorResearchSearch`는 이미 229줄이고
표 렌더·마크다운 복사까지 넣으면 350줄이 된다.

**새 파일 `lib/searchLog.ts`**

```ts
export type SearchLogEntry = {
  id: string;
  /** YYYY-MM-DD (로컬 시각) */
  date: string;
  /** 표에 적는 사람이 읽는 이름 */
  site: string;
  query: string;
  count: number;
  note: string;
};

const SOURCE_LABELS: Record<string, string> = {
  "semantic-scholar": "Semantic Scholar",
  openalex: "OpenAlex",
  crossref: "Crossref",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

/** 표의 '날짜' 칸. toISOString은 UTC라 한국 밤 시간대에 하루 전이 찍힌다. */
export function localDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 02-prior-research.mdx:54-57의 예시 표와 열·순서가 같아야 한다. */
export function toMarkdownTable(entries: readonly SearchLogEntry[]): string {
  const header = "| 날짜 | 사이트 | 키워드 | 건수 | 메모 |\n|---|---|---|---|---|";
  const body = entries
    .map((e) => `| ${e.date} | ${e.site} | ${e.query} | ${e.count} | ${e.note} |`)
    .join("\n");
  return `${header}\n${body}`;
}
```

UI는 `PriorResearchSearch` 안, 결과 목록(`:187-226`) **아래**에 붙인다:

- `const [log, setLog] = usePersistentState<SearchLogEntry[]>("search-log", [])`
- `status === "done" && lastSearch` 일 때만 "이 검색을 기록에 남기기" 버튼
- 누르면 `{ id: generateId(), date: localDate(), site: sourceLabel(lastSearch.source), query, count, note: "" }` 추가
- 기록된 행은 메모 `<input>` + `삭제` 버튼. `VariableTableBuilder.tsx:32-47` 패턴 그대로 마크다운 복사
- `<PersistNotice error={saveError} />`

`generateId`는 `lib/citations.ts:60-65`에 이미 있다(비보안 컨텍스트 폴백 포함).
**`lib/citations.ts`에서 export하지 말고 `lib/searchLog.ts`에 같은 구현을 두거나,
별도 `lib/id.ts`로 승격한다** — citations를 import하면 2단계 검색 도구가
레퍼런스 모듈 전체를 끌고 온다. 승격 쪽을 권한다(구현 시 판단).

### 함정

1. **키워드는 `q`, `query` 아님** (위 표).
2. **같은 검색을 두 번 누르면 두 줄이 생긴다.** 막지 않는다 — 검색 기록은
   "몇 번 찾아봤는지"가 정보다. 다만 버튼 라벨을 누른 뒤 "기록됨"으로 2초 바꿔
   중복 클릭을 줄인다(`VariableTableBuilder`의 `copied` 패턴).
3. **`toISOString()` 금지.** 한국 시간 09시 이전이 전날로 찍힌다.
4. 폴백 소스(`openalex`/`crossref`)로 검색된 결과를 "Semantic Scholar에서 찾았다"고
   기록하면 그 표가 논문에 그대로 들어가 **거짓 기록**이 된다. `resolvedSource`를 쓸 것.
5. 새 localStorage 키 `research-guide:tool:search-log`가 생긴다 → **T8**(`/privacy` 목록) 대상.

### 테스트

`lib/__tests__/searchLog.test.ts` (node 환경)
- `it("localDate가 로컬 자정 기준 날짜를 낸다")` — `new Date(2026, 8, 6, 0, 30)` → `"2026-09-06"`
- `it("toMarkdownTable이 02-prior-research의 예시 표와 열이 같다")` — 헤더 문자열 정확 비교
- `it("sourceLabel이 폴백 소스를 사람이 읽는 이름으로 바꾼다")`
- `it("메모에 파이프 문자가 있으면 표가 깨진다")` — **현재 동작을 문서화하는 테스트.**
  이스케이프를 넣을지는 구현 시 판단(권장: `note.replaceAll("|", "\\|")`)

`components/__tests__/PriorResearchSearch.test.tsx` (기존 파일에 추가)
- `it("검색 후 기록 버튼을 누르면 키워드·건수가 자동으로 채워진 행이 생긴다")`
- `it("예시 칩으로 검색해도 키워드가 빈 칸이 되지 않는다")` — **`q` vs `query` 회귀선**
- `it("폴백 소스로 검색되면 사이트 칸이 Crossref로 기록된다")` — fetch 모킹 `source: "crossref"`

### 커밋 분할

1. `feat(lib): 검색 기록 표 로직 (searchLog)` — 모듈 + node 테스트
2. `feat(tools): 선행연구 검색에 기록 남기기` — 컴포넌트 + stageToolMeta 연쇄 5곳 + 컴포넌트 테스트
3. `docs(privacy): 검색 기록 저장 항목 추가` — T8 부분 이행

### 도구 등록

- `STAGE_TOOL_TITLES["prior-research"]` **끝**에 추가하지 **않는다** — 이건 별도 도구가 아니라
  `PriorResearchSearch` 안의 기능이다. **도구 개수는 24로 유지된다.**
  백로그가 H3을 "새 도구"로 읽었다면 그것도 정정 대상이다: 본문이 요구하는 것은
  "검색할 때마다 남기는 표"이고, 검색하는 화면과 떨어뜨리면 아무도 안 쓴다.
  → **§H3에는 위 연쇄 목록이 적용되지 않는다.** 적용되는 것은 H4 하나뿐이다.

---

## H4. 데이터 정리 기록표 도구 (신규 도구 — 24 → 25)

### 근거 (확인함)

`content/guide/04-data-collection.mdx:31` (표의 첫 행, **도구 칸이 `—`**)
> | 이상치 제외 기준 | "응답 시간 1분 미만 설문은 제외" … 처럼 숫자로 적습니다 | **—** |

같은 파일 `:37`
> 이상치 기준을 미리 적는 이유는 단순합니다. 결과를 본 뒤에 "이 값은 이상해 보이니까
> 빼자"고 하면, 내 가설에 불리한 값만 빠지기 쉽습니다.

`:113` 이하 "클리닝: 정한 기준대로, 기록하면서" 절이 제외 건수 기록을 요구한다.
백로그가 인용한 `:102-109`는 현재 파일에서 **유형별 주의점 표**다(줄 번호 이동).
요구 자체는 살아 있다 — 위치만 다르다.

### 새 파일 `components/DataCleaningLog.tsx`

`VariableTableBuilder.tsx` 골격 복제(usePersistentState + 행 추가/삭제 + 마크다운 복사).
**다른 점 하나**: 표 위에 "수집 전에 적는 칸"이 있고, 그 칸이 비면 표에 행을 못 넣는다.

```tsx
type CleaningRow = { stage: string; before: string; after: string; reason: string };

type CleaningLog = {
  /** 데이터를 보기 전에 적는 제외 기준. 표보다 먼저이고, 비면 행 추가가 막힌다. */
  criteria: string;
  rows: CleaningRow[];
};
```

- `usePersistentState<CleaningLog>("data-cleaning-log", { criteria: "", rows: [] })`
- 맨 위: `<textarea>` "수집을 시작하기 전에, 어떤 데이터를 뺄지 기준을 먼저 적으세요"
  + 안내문 "결과를 본 뒤에 기준을 정하면 가설에 불리한 값만 빠집니다."
- `criteria.trim() === ""`이면 "+ 단계 추가" 버튼 `disabled`
  + `aria-describedby`로 연결된 설명 "제외 기준을 먼저 적어야 기록을 시작할 수 있습니다"
- 표 4열: `단계 | 처리 전 건수 | 처리 후 건수 | 제외 사유`
- 마크다운 복사 시 **기준 문장을 표 위에 인용문(`> `)으로 함께** 복사한다 —
  표만 복사하면 "논문에 그대로 들어간다"는 약속의 절반만 나간다

### 도구 등록 (연쇄 6곳)

1. `STAGE_TOOL_TITLES["data-collection"]`에 `"데이터 정리 기록표"` 추가.
   **위치: 배열 맨 앞이 아니라 맨 뒤** — `StageTools.test.tsx`가 인덱스로 첫 항목을 본다.
   (본문 순서상으로는 이상치 기준이 먼저지만, 아코디언 첫 항목이 바뀌면
   `data-collection`을 쓰는 기존 테스트 `StageTools.test.tsx:26-39`의 `#tool-sample-size`
   딥링크 테스트는 안 깨지고 `:16-24`(topic)도 안 깨진다 — 실제로는 안전하지만
   맨 뒤가 회귀 위험 0이다.) → **구현 시 판단**: 교육적으로는 맨 앞이 옳다.
   맨 앞에 넣는다면 `StageTools.test.tsx`에 인덱스 어서션이 `data-collection`을 쓰지
   않음을 확인했으니(topic/writing만 씀) 실제로 깨지는 테스트는 없다.
2. `TOOL_DESCRIPTIONS`: `"뺀 데이터가 몇 건이고 왜 뺐는지 논문에 넣을 표로 남깁니다."`
3. `TOOL_IDS`: `"데이터 정리 기록표": "cleaning-log"`
4. `StageTools.tsx` `dynamic()` 선언 + `TOOL_RENDERERS` 항목
5. `lib/stageToolMeta.ts:5` 주석 "21개 도구" → 실수 유발 문구 제거
6. `app/privacy/page.tsx` 저장 항목 (T8)

`content/guide/04-data-collection.mdx:31`의 `—`를 `위 도구 '데이터 정리 기록표'`로 바꾼다.
**Y4 주의**: 인쇄물 체크리스트가 "위 도구"를 종이에서 가리키는 문제 — 이 문구는 같은 함정을
하나 더 만든다. Y4의 치환 규칙 대상에 이 줄을 추가해야 한다(Y4 미착수 상태이므로
이 커밋에서 목록만 남긴다).

### 함정

1. **`criteria`가 비면 행 추가를 막는 것이 이 도구의 존재 이유**다. 단순 `disabled`만 두면
   화면낭독기 사용자에게 왜 막혔는지 안 들린다 → `aria-describedby` 필수(M2 패턴 선점).
2. 건수 두 칸은 `type="number"`가 아니라 `inputMode="numeric"`의 텍스트로.
   `SampleSizeCalculator.test.tsx:33` 주석이 이미 number 입력의 테스트 난점을 적어뒀다.
3. 처리 전 < 처리 후는 논리적으로 불가능하다. **막지 않고 경고만** 띄운다 —
   여러 단계를 합쳐 적는 사용자를 차단하면 안 된다.
4. 새 localStorage 키 `research-guide:tool:data-cleaning-log` → T8.

### 테스트

`components/__tests__/DataCleaningLog.test.tsx`
- `it("제외 기준이 비어 있으면 단계 추가 버튼이 비활성이다")`
- `it("제외 기준을 적으면 행을 추가할 수 있다")`
- `it("마크다운 복사에 기준 문장이 표 위 인용문으로 포함된다")` — clipboard 모킹
- `it("처리 후 건수가 처리 전보다 크면 경고를 띄우되 입력은 막지 않는다")`
- `it("저장 실패 시 PersistNotice가 뜬다")` (C4 이후)

`lib/__tests__/stageToolMeta.test.ts` — 수정 불필요(전부 자동 순회). 확인함.

### 커밋 분할

1. `feat(tools): 데이터 정리 기록표` — 컴포넌트 + 테스트
2. `feat(tools): 데이터 정리 기록표를 4단계에 등록` — stageToolMeta + StageTools + 가이드 표 칸
3. `docs(privacy): 데이터 정리 기록 저장 항목 추가`

---

## B2. 차트 오차막대

### 근거 (백로그보다 강하다)

`content/articles/14-figure-first.mdx:100`
> 실제로 그려 볼 때는 [간이 차트 그리기](/guide/writing#tool-chart)로 축과 **오차막대**를
> 붙여 보고 …

즉 자료실이 **이 도구가 오차막대를 그린다고 이미 단언**하고 있다. 못 그린다.
`content/articles/03-statistics.mdx:119`도 "오차를 안 그리기"를 금지 항목으로 든다.

### `lib/chartGeometry.ts` 변경

현재 `parsePairs(labelsText, valuesText)`는 2열. 3번째 인자를 **선택**으로 붙인다.

```ts
export function parsePairs(
  labelsText: string,
  valuesText: string,
  errorsText = "",
) {
  const labelTokens = labelsText.split(/[\n,]+/).map((s) => s.trim());
  const { tokens: valueTokens, thousandsMergedCount } =
    tokenizeNumberList(valuesText);
  // 오차는 선택 입력이다. 비어 있으면 전부 undefined, 일부만 적혀 있으면
  // 적힌 것만 그린다 — 값 쪽처럼 쌍을 통째로 버리면 안 된다.
  const { tokens: errorTokens } = tokenizeNumberList(errorsText);

  const n = Math.max(labelTokens.length, valueTokens.length);
  const labels: string[] = [];
  const values: number[] = [];
  const errors: (number | undefined)[] = [];
  let droppedCount = 0;
  let invalidErrorCount = 0;

  for (let i = 0; i < n; i++) {
    const label = labelTokens[i] ?? "";
    const valueToken = valueTokens[i] ?? "";
    if (!label && !valueToken) continue;
    const v = valueToken === "" ? NaN : Number(valueToken);
    if (label && Number.isFinite(v)) {
      labels.push(label);
      values.push(v);
      const errToken = errorTokens[i] ?? "";
      if (errToken === "") {
        errors.push(undefined);
      } else {
        const e = Number(errToken);
        // 오차막대 길이는 음수일 수 없다. 0은 유효하다(오차 없음).
        if (Number.isFinite(e) && e >= 0) {
          errors.push(e);
        } else {
          errors.push(undefined);
          invalidErrorCount++;
        }
      }
    } else {
      droppedCount++;
    }
  }
  return {
    labels,
    values,
    errors,
    droppedCount,
    thousandsMergedCount,
    invalidErrorCount,
  };
}
```

`errors`는 **`values`와 같은 길이로 push된 배열**이다. 이게 K3형 쌍 어긋남을 막는 핵심 —
값이 버려진 인덱스에서 오차도 같이 빠진다.

**함정**: `SimpleChart.tsx:58-63`이 `hbar`/`pie`/`donut`에서 음수를 걸러낼 때
`labels`·`values`만 필터한다. `errors`도 **같은 `keep` 마스크로 필터해야 한다.**
안 하면 오차막대가 엉뚱한 막대에 붙는다. 이게 이 항목의 실제 결함 지점이다.

```ts
  if (excludeNegatives) {
    const keep = values.map((v) => v >= 0);
    negativeCount = keep.filter((k) => !k).length;
    labels = labels.filter((_, i) => keep[i]);
    values = values.filter((_, i) => keep[i]);
    errors = errors.filter((_, i) => keep[i]);   // 추가
  }
```

### `components/SimpleChart.tsx` 변경

**1) 상태 + 입력칸**

`chartState`에 `errorsText: string` 추가. 저장값에 이 키가 없는 기존 사용자는
`usePersistentState`가 `typeof parsed === typeof initialValue`(둘 다 `"object"`)로
통과시켜 **`errorsText`가 `undefined`가 된다** — 구조분해에 기본값을 둘 것:

```ts
  const { type, labelsText, valuesText, xTitle, yTitle, errorsText = "" } =
    chartState;
```

입력칸은 `XY_TYPES` 중 `bar`·`hbar`·`line`에만 보인다(백로그: bar·line만.
`hbar`도 막대이므로 포함. `area`·`scatter`는 제외 — 면적/산점에 ± 막대는 오해를 만든다).

```tsx
const ERROR_BAR_TYPES: ChartType[] = ["bar", "hbar", "line"];
```
```tsx
        {ERROR_BAR_TYPES.includes(type) && (
          <div className="sm:col-span-2">
            <label htmlFor="chart-errors" className="text-xs font-medium text-ink-soft">
              오차 (± 값, 선택 — 빈 칸은 막대 없이 그립니다)
            </label>
            <textarea
              id="chart-errors"
              value={errorsText}
              onChange={(e) =>
                setChartState((prev) => ({ ...prev, errorsText: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
            />
            <p className="mt-1 text-xs text-ink-soft">
              표준편차인지 표준오차인지 신뢰구간인지는 캡션에 반드시 적으세요.
            </p>
          </div>
        )}
```

마지막 안내문은 `14-figure-first.mdx:95`가 요구하는 것을 UI에서 반복한 것이다.

**2) 축 범위 — 실제 함정**

현재 `:66-68`:
```ts
  const maxV = hasData ? Math.max(...values, 0) : 0;
  const minV = hasData ? Math.min(...values, 0) : 0;
```
오차 상단이 잘린다. 변경:
```ts
  // 오차막대 끝이 플롯 밖으로 나가면 잘려서 "오차가 작다"로 잘못 읽힌다.
  const upper = values.map((v, i) => v + (errors[i] ?? 0));
  const lower = values.map((v, i) => v - (errors[i] ?? 0));
  const maxV = hasData ? Math.max(...upper, 0) : 0;
  const minV = hasData ? Math.min(...lower, 0) : 0;
```
`hbar`는 별도 스케일을 쓴다(`:257` `const hMax = Math.max(...values, 0.0001)`).
거기도 `Math.max(...upper, 0.0001)`로 바꿔야 한다. **놓치기 쉬운 두 번째 지점.**

**3) 그리기** — `bar`의 `values.map` 블록(`:238-246`) 뒤, `line`의 `circle` 블록(`:314-316`) 뒤에
각각 오차막대 `<g>`를 추가. T자 캡을 포함한다:

```tsx
{values.map((v, i) => {
  const e = errors[i];
  if (e === undefined) return null;
  const cx = PAD.left + barSlot * i + barSlot / 2;   // line은 xForIndex(i)
  const cap = 4;
  return (
    <g key={`err-${i}`} stroke="#17181a" strokeWidth={1.25}>
      <line x1={cx} x2={cx} y1={yFor(v - e)} y2={yFor(v + e)} />
      <line x1={cx - cap} x2={cx + cap} y1={yFor(v + e)} y2={yFor(v + e)} />
      <line x1={cx - cap} x2={cx + cap} y1={yFor(v - e)} y2={yFor(v - e)} />
    </g>
  );
})}
```

`hbar`는 축이 뒤집혀 있어 x/y를 맞바꾼 별도 블록이 필요하다.

**4) 안내문** — `:191-208`의 `aria-live` 묶음에 한 줄 추가:
```tsx
        {parsed.invalidErrorCount > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            오차 값 {parsed.invalidErrorCount}개를 읽지 못해(음수이거나 숫자가
            아님) 그 항목은 막대 없이 그렸습니다.
          </p>
        )}
```

**5) `aria-label`** (`:219`) — 오차막대가 있으면 그 사실을 붙인다:
`...그래프${errors.some((e) => e !== undefined) ? ", 오차막대 포함" : ""}`

### 함정 정리

1. **`errors` 배열을 `keep` 마스크로 같이 필터**(위). 안 하면 K3와 같은 종류의 조용한 오정렬.
2. **`hMax`(hbar 전용 스케일)를 잊기 쉽다.** `maxV`만 고치면 hbar 오차막대가 잘린다.
3. `errorsText`가 기존 저장값에 없다 → 구조분해 기본값 `= ""`.
4. `#17181a`는 다크모드에서 안 보인다. **O3(차트 색 하드코딩)과 같은 결함을 새로 만드는 것**이므로,
   O3이 아직 미착수라면 기존 코드와 같은 하드코딩을 쓰되 O3의 대상 목록에 이 줄을 추가한다.
   O3이 먼저 들어왔다면 그 토큰을 쓴다. → **순서 의존. O3 뒤가 낫다.**
5. `downloadSvg`(`:83-100`)는 `<rect fill="white">` 배경 위에 그리므로 내보내기는 그대로 정상.

### 테스트

`lib/__tests__/chartGeometry.test.ts` (기존 파일에 추가)
- `it("오차 열이 비면 errors가 전부 undefined이고 길이는 values와 같다")`
- `it("값이 버려진 인덱스에서는 오차도 함께 빠진다")` — `parsePairs("A,B,C", "1,x,3", "0.1,0.2,0.3")`
  → `labels=["A","C"]`, `errors=[0.1, 0.3]`. **K3형 회귀선**
- `it("음수 오차는 무시하고 invalidErrorCount로 센다")`
- `it("오차 토큰이 값보다 적으면 뒤쪽은 undefined다")`

`components/__tests__/SimpleChart.test.tsx` (기존 파일에 추가)
- `it("오차를 입력하면 축 최댓값이 값+오차를 담는다")` — y축 눈금 텍스트로 확인
- `it("산점도·원형에서는 오차 입력칸이 사라진다")`
- `it("가로막대에서 음수를 제외해도 오차막대가 남은 막대에 맞게 붙는다")` —
  `keep` 마스크 회귀선. `<line>` 개수로 확인

### 커밋 분할

1. `feat(chart): parsePairs에 오차 열 (3열 선택)` — chartGeometry + 테스트
2. `feat(chart): 오차막대 그리기와 축 범위 포함` — SimpleChart + 테스트
3. (선택) `docs(articles): 14-figure-first의 오차막대 안내 확인` — 이제 사실이 됐으므로 문장 유지 확인만

---

# 묶음 7 — 링크 구조 (11건)

## S4. 링크 검증을 사례·가이드로 확장 **(가장 먼저)**

### 현재 (`lib/__tests__/articles.test.ts:181-298`)

```ts
describe("자료실 내부 링크", () => {
  const articles = getAllArticles();
  const slugs = new Set(articles.map((a) => a.slug));
  ...
  const linksOf = (article: (typeof articles)[number]) =>
    extractInternalLinks(article.content);
```

`for (const article of articles)`가 5개 `it()` 전부에 있다. 순회 대상이 자료실 31편뿐이다.

### 실측 무방비 링크 수

| 출처 | 내부 링크 |
| --- | --- |
| 사례 6편 | **32개** (5+5+9+3+4+6) — 백로그 수치 정확 |
| 가이드 6편 | **15개** (`/example` 6, `/guide/*` 8, 그 외 1) |

사례 중 `01-lysozyme-charge-aggregation.mdx`는 `/guide/writing#tool-ethics` **도구 앵커 딥링크**를,
`01-trem2-chain.mdx`와 `05-focused-ultrasound-bbb.mdx`는 `/showcase/{slug}` **사례 간 링크**를 쓴다.
자료실 slug 하나만 바꿔도 사례 6편에서 조용히 깨진다.

### 변경

`describe` 블록 안의 두 줄만 바꾸고 나머지 로직은 손대지 않는다.

```ts
describe("사이트 내부 링크", () => {
  const articles = getAllArticles();
  const slugs = new Set(articles.map((a) => a.slug));
  const showcases = getAllShowcases();
  const showcaseSlugs = new Set(showcases.map((s) => s.slug));

  /**
   * 링크를 검사할 모든 원본. 자료실만 보던 것을 사례·가이드까지 넓힌다 —
   * 검사 로직은 그대로고 순회 대상만 는다. 사례가 자료실 slug를 걸고
   * 가이드가 /example을 거는 이상, 셋이 같은 방지선 안에 있어야 한다.
   */
  const sources: { id: string; content: string }[] = [
    ...articles.map((a) => ({ id: `articles/${a.slug}.mdx`, content: a.content })),
    ...showcases.map((s) => ({ id: `showcase/${s.slug}.mdx`, content: s.content })),
    ...getAllStages().map((s) => ({ id: `guide/${s.slug}.mdx`, content: s.content })),
  ];

  const linksOf = (source: { content: string }) =>
    extractInternalLinks(source.content);
```

그 뒤 5개 `it()`의 `for (const article of articles)` → `for (const source of sources)`,
`${article.slug}.mdx` → `${source.id}`로 치환. **검사 로직 자체는 한 줄도 안 바뀐다.**

`describe` 이름을 "자료실 내부 링크" → "사이트 내부 링크"로. import에 `getAllStages` 추가.

두 번째 `it`(`/showcase/{slug}` 검증)이 내부에서 다시 `getAllShowcases()`를 부르던 것은
바깥 `showcaseSlugs`를 쓰도록 정리한다.

### 함정

1. **사례 → 사례 링크**가 이제 검사 대상이다. `01-trem2-chain.mdx`가 자기 자신을 안 걸고
   `lysozyme-charge-aggregation`을 건다 — 통과할 것. 확인함.
2. **가이드가 `/example`을 6번 건다.** `ALLOWED_PATHS`에 `/example`이 이미 있다. 통과.
3. `/guide/{stage}` 검증이 가이드 자기 자신에게도 적용된다. 6편 모두 유효 slug만 쓴다. 확인함.
4. **`showcase` 사이드에 slug 없는 파일이 들어오면** `s.slug`가 `undefined`가 되어
   `showcase/undefined.mdx`가 된다. S6(frontmatter 검증)이 아직 없다 — 이 테스트가 잡지 않는다.
   S4의 범위 밖이므로 그대로 둔다.

### 테스트

새 `it()`을 추가하지 않는다. **기존 5개의 순회 대상이 31 → 43개 파일로 는 것 자체가 이 항목의 산출물이다.**
단, 회귀선 하나는 추가한다:
- `it("검사 대상에 자료실·사례·가이드가 모두 들어 있다")` —
  `sources.length === articles.length + showcases.length + 6`. 나중에 누가 `sources`에서
  한 종류를 빼면 다른 테스트가 조용히 통과해 버리는 것을 막는다.

### 커밋 분할

1. `test(links): 링크 검증 범위를 사례·가이드로 확장` (단일 커밋)

**이 커밋이 묶음 7의 다른 모든 항목보다 먼저 들어가야 한다.** O8·P1·P2·C3·C6이 전부
링크를 새로 심는 작업이고, 방지선 없이 심으면 오타가 조용히 배포된다.

---

## O6. 홈에서 `/tools`로 가는 길

### 현재 (`app/page.tsx`)

`/tools` 링크 **0개**. `href`가 있는 곳: `:85 /guide`, `:123 point.href`, `:175 /guide/{slug}`,
`:212 /example`, `:238 /articles`, `:254 /articles/{slug}`, `:288 GLOSSARY.url`(외부).

`:191`에 `<span>도구 {getToolCount(stage.slug)}</span>`가 이미 있다 — 숫자가 6번 보이는데
누를 곳이 없다. 그리고 `:281`의 섹션 제목이 **"함께 쓰면 좋은 도구"인데 그 안은 외부
용어사전 링크**다. 사이트 자신의 도구 24개가 아니라. 이 이름 충돌이 결함을 키운다.

### 변경 — 두 곳

**(1) 6단계 `<ol>` 바로 아래** (`:194` `</ol>` 다음, `</div>` 앞)

```tsx
          <p className="mt-5 text-sm leading-[1.7] text-ink-soft">
            위 숫자는 각 단계 안에 접혀 있는 계산기·체크리스트·생성기의 개수입니다.{" "}
            <Link href="/tools" className="text-accent hover:underline">
              도구 {getTotalUniqueToolCount()}개를 한 페이지에서 보기 →
            </Link>
          </p>
```

`getTotalUniqueToolCount`를 `@/lib/stageToolMeta`에서 import한다(`getToolCount`가 이미 같은
모듈에서 오고 있다 — import 줄만 늘린다). 하드코딩 금지.

**(2) `:281` 섹션 제목의 이름 충돌 해소**

`"함께 쓰면 좋은 도구"` → `"함께 쓰면 좋은 외부 사이트"`.
`:283`의 `<span>별도 사이트</span>`가 이미 그렇게 말하고 있으므로 제목만 맞춘다.

### 함정

1. **E1(헤더에 항목 추가)과 무관하다.** 헤더는 손대지 않는다. 375px 폭 논쟁에 안 걸린다.
2. `getTotalUniqueToolCount()`는 서버 컴포넌트에서 호출된다 — `app/page.tsx`는 서버다. 안전.
3. 이 문단을 `<ol>` **안**에 넣으면 `<li>` 아닌 자식이 되어 HTML이 무효다. `</ol>` 밖에 둘 것.

### 테스트

`app/` 테스트가 0개다(T6이 지적한 그 구멍). 이 항목만으로 라우트 테스트 인프라를 세우지 않는다.
대신 **정적 검증**을 하나 둔다 — `lib/__tests__/articles.test.ts`가 아니라 신규
`lib/__tests__/siteLinks.test.ts`:

- `it("홈이 /tools를 링크한다")` — `fs.readFileSync("app/page.tsx")`에 `href="/tools"` 포함.
  문자열 검사라 조악하지만, 이 링크가 사이트의 유일한 홈→도구 경로이므로
  누가 리팩터링하다 지우는 것을 막을 값어치가 있다.
- 같은 파일에서 P4의 푸터 검증도 함께 한다(아래).

### 커밋 분할

1. `feat(home): 6단계 목록 아래 /tools 진입로 + 외부 사이트 섹션 제목 정정`

---

## O8. 허브 2편에 배출구 — **삽입할 문장과 위치**

### 실측

| 글 | inbound | 자료실로 나가는 링크 |
| --- | --- | --- |
| `03-statistics.mdx` | **10** (자료실 7 + 사례 3) | **0** (`/guide/writing` ×2, `#tool-stats` ×1뿐) |
| `04-research-ethics.mdx` | **9** | **0** (`/guide/writing` `/guide/methodology` `/guide/submission`) |
| `08-abstract-and-title.mdx` | 1 | 0 (`/example`, `/guide/writing`) |
| `07-presentation.mdx` | 2 | 0 (`/guide/submission`) |

### 삽입 1 — `03-statistics.mdx`, 인라인

**위치**: `:118` (「그래프에서 하지 말아야 할 것」의 두 번째 항목).
**현재**:
> - **오차를 안 그리기**: 평균만 있는 막대는 정보가 절반입니다. 가능하면 표준편차나 표준오차를 함께 표시하세요.

**변경 후**:
> - **오차를 안 그리기**: 평균만 있는 막대는 정보가 절반입니다. 가능하면 표준편차나 표준오차를 함께 표시하세요. 남의 논문 그림에서 이걸 어떻게 읽는지는 [그림부터 읽기](/articles/figure-first)에 따로 정리돼 있습니다.

### 삽입 2 — `03-statistics.mdx`, 말미 절 교체

**위치**: `:131` (파일 마지막 줄).
**현재**:
> 여기까지 확인했다면 결과 서술은 준비된 것입니다. 결과와 논의를 어떻게 나누는지는 [5단계: 논문화](/guide/writing)에 이어집니다.

**변경 후** (한 문단 추가):
> 여기까지 확인했다면 결과 서술은 준비된 것입니다. 결과와 논의를 어떻게 나누는지는 [5단계: 논문화](/guide/writing)에 이어집니다.
>
> 이 문서에서 갈라지는 길이 셋 있습니다. 표본이 작아서 검정 자체가 성립하는지 걱정된다면 [표본이 작을 때 무엇을 말할 수 있나](/articles/small-sample), 유의하지 않은 결과를 어떻게 쓸지 막혔다면 [유의하지 않은 결과를 쓰는 법](/articles/negative-results), 계산은 끝났고 그림으로 옮길 차례라면 [그림부터 읽기](/articles/figure-first)로 가세요.

### 삽입 3 — `04-research-ethics.mdx`, 인라인 (**P2·U4와 같은 줄**)

**위치**: `:61`.
**현재**:
> [3단계: 방법론 설계](/guide/methodology)에 이 문장을 만들어주는 도구가 있습니다.

**틀렸다**: `ai-disclosure`는 `submission` 단계에 있다(`TOOL_IDS` 확인).
**변경 후**:
> [6단계: 투고와 발표](/guide/submission#tool-ai-disclosure)의 'AI 활용 disclosure 문구 만들기'가 이 문장을 만들어 줍니다.

이 한 줄이 **O8(배출구) · P2(미연결 도구) · U4(틀린 단계 안내)** 셋을 동시에 처리한다.
앵커가 붙으므로 `articles.test.ts`의 도구 앵커 검증이 이제 이 링크를 지킨다.

### 삽입 4 — `04-research-ethics.mdx`, 말미 절 교체

**위치**: `:106` (파일 마지막 줄).
**현재**:
> 이 목록을 통과한 연구는 결과가 어떻든 떳떳합니다. 그리고 심사에서 신뢰를 얻는 것도 결국 이 부분입니다.

**변경 후** (한 문단 추가):
> 이 목록을 통과한 연구는 결과가 어떻든 떳떳합니다. 그리고 심사에서 신뢰를 얻는 것도 결국 이 부분입니다.
>
> 이 목록의 마지막 세 줄 — 제외 기준, 사전에 적은 가설, 기여자 표시 — 은 결국 기록의 문제입니다. 무엇을 언제 적어야 하는지는 [연구노트, 무엇을 어떻게 적나](/articles/lab-notebook)에, 다 지키고도 남는 한계를 어떻게 쓰는지는 [한계를 쓰는 법](/articles/limitations)에 있습니다.

### 삽입 5 — `08-abstract-and-title.mdx`, 인라인 (**P2와 겸함**)

**위치**: `:63`.
**현재**:
> 위 초록은 약 450자입니다. 그런데 대회 요약문은 "250자 이내"처럼 더 짧게 요구하는 경우가 많습니다. …

**변경 후** (문장 하나 추가):
> 위 초록은 약 450자입니다. 그런데 대회 요약문은 "250자 이내"처럼 더 짧게 요구하는 경우가 많습니다. 지금 내 초록이 몇 자인지는 [분량 체크기](/guide/writing#tool-length)에 붙여넣으면 바로 나옵니다. 이때 문장을 하나씩 지우면 여섯 덩어리 중 하나가 통째로 사라집니다. 지우지 말고 **압축**하세요.

### 삽입 6 — `07-presentation.mdx`, 말미

`presentation`은 inbound 2 / out 0이다. 파일 끝에:
> 발표 자료가 준비됐다면 남은 것은 질의응답입니다. 심사에서 나올 질문을 미리 받아보려면 [6단계의 예상 질문 뽑기](/guide/submission#tool-questions)를, 대본 길이를 재보려면 [발표 시간 재보기](/guide/submission#tool-timer)를 쓰세요.

(두 도구 모두 이미 `31-finding-calls`에서 링크돼 있으므로 P2 대상은 아니고, O8 배출구용이다.)

### 함정

1. **`/guide/submission#tool-ai-disclosure`가 실제로 submission 단계에 있는지** —
   `STAGE_TOOL_TITLES.submission`에 `"AI 활용 disclosure 문구 만들기"` 있음, `TOOL_IDS`에서
   `"ai-disclosure"`. 확인함. 앵커 검증 통과한다.
2. **`#tool-length`는 `writing` 단계**다(`STAGE_TOOL_TITLES.writing`에 `"분량 체크기"`). 확인함.
3. `figure-first` `small-sample` `negative-results` `lab-notebook` `limitations` 전부 실재 slug. 확인함.
4. `03-statistics`에 링크를 넣으면 `figure-first`의 inbound가 2 → 4가 된다. P3(같은 3편 추천)의
   회전 계산에 영향 없다(P3는 카테고리 인덱스 기반).

### 테스트

새 테스트 불필요 — **S4가 이미 방지선이다.** 단, O8의 결과를 고정하는 회귀선 하나:
`lib/__tests__/articles.test.ts`에
- `it("허브 글(statistics·research-ethics)이 다른 자료실 글로 나가는 링크를 갖는다")` —
  두 slug의 `content`에서 `/articles/`로 시작하는 링크가 1개 이상.

### 커밋 분할

1. `docs(articles): 허브 4편에 자료실 배출구 (O8)` — 03·04·07·08

---

## P1. 고아 4편 — **어느 글의 어느 문단에**

| 글 | 자료실 inbound | 상태 |
| --- | --- | --- |
| `survey-questions` | 0 | 완전 고아. 대응 도구 `survey-bias`와도 양방향 단절 |
| `why-topics-go-stale` | 0 | 완전 고아 |
| `finding-calls` | 0 | 완전 고아 |
| `public-data-topics` | 0 (사례 2편에서만) | 자료실 안에서 고아 |

### `survey-questions` — 들어오는 링크 2개 + 나가는 도구 링크 1개

**(a) 들어오기 1**: `04-research-ethics.mdx:71` 부근 「사람을 대상으로 할 때」 절.
동의·개인정보를 다루는 문단 뒤에 한 문장:
> 문항 자체를 어떻게 쓰는지 — 이중 질문, 유도 질문, 답하기 곤란한 것을 그냥 묻는 문제 — 는 [설문 문항이 결과를 바꾸는 아홉 가지 방식](/articles/survey-questions)에 따로 있습니다.

**(b) 들어오기 2**: `24-question-to-test.mdx` 말미.
질문을 검증 가능한 형태로 바꾸는 글이므로, 설문으로 재는 경우의 다음 단계로 자연스럽다:
> 재는 방법이 설문이라면 문항 자체가 결과를 바꿉니다. [설문 문항이 결과를 바꾸는 아홉 가지 방식](/articles/survey-questions)을 문항을 확정하기 전에 한 번 보세요.

**(c) 나가기 (P2 겸함)**: `02-survey-questions.mdx:104` 「돌리기 전에 반드시 하는 두 가지」의
"소리 내어 읽기" 문단 끝에:
> 소리 내어 읽어도 안 잡히는 것은 [설문 문항 편향 체크](/guide/data-collection#tool-survey-bias)에 문항을 통째로 붙여넣으면 이중 질문·유도 표현을 자동으로 찾아 줍니다.

`survey-bias`는 `data-collection` 단계다(`STAGE_TOOL_TITLES` 확인). 앵커 검증 통과.

### `why-topics-go-stale` — 들어오는 링크 1개

**위치**: `06-topic-ideas.mdx`. 이 글은 이미 `question-vs-researchable`,
`from-a-paper`, `from-curriculum`, `research-ethics`로 나간다(out 4).
주제 목록 섹션 앞이나 뒤에:
> 목록에서 하나를 골랐다면, 그 주제가 왜 이미 답이 나와 있는지부터 확인하세요. [왜 어떤 주제는 시작부터 낡아 있나](/articles/why-topics-go-stale)가 그 판별법입니다.

### `finding-calls` — 들어오는 링크 1개

**위치**: `08-abstract-and-title.mdx` 말미.
초록·제목을 다 쓴 사람의 다음 행동이 "어디에 내나"다:
> 초록과 제목이 준비됐다면 낼 곳을 찾을 차례입니다. [대회와 학술지 공고를 찾는 법](/articles/finding-calls)에 어디를 언제 보는지 정리돼 있습니다.

(`31-finding-calls.mdx`는 이미 `abstract-and-title`을 걸고 있으므로 이걸로 **양방향**이 된다.)

### `public-data-topics` — 들어오는 링크 1개

**위치**: `21-right-sized-topic.mdx`. "장비가 없다"는 제약을 다루는 맥락:
> 장비도 실험 공간도 없다면 범위를 줄이는 대신 재료를 바꾸는 길이 있습니다. [공개 데이터로 할 수 있는 연구](/articles/public-data-topics)를 보세요.

`right-sized-topic`은 out 2 / in 5라 배출구를 늘려도 균형이 안 무너진다.

### 함정

1. **`04-research-ethics`는 O8에서도 손댄다.** 같은 파일을 두 항목이 수정하므로
   **O8 커밋을 먼저 넣고 P1이 뒤**에 오도록. 충돌 자체는 다른 줄이라 없지만 리뷰가 쉬워진다.
2. `08-abstract-and-title`은 O8(삽입 5)·P1(finding-calls)·P2(`length`) 셋의 대상이다.
   **한 커밋에서 세 곳을 같이 넣는다.**
3. 슬러그 확인: `survey-questions` `why-topics-go-stale` `finding-calls` `public-data-topics`
   모두 `content/articles/`에서 확인함.

### 테스트

- `lib/__tests__/articles.test.ts`에 `it("자료실 안에서 inbound 0인 글이 없다")` 추가.
  `getAllArticles()`만으로 인접행렬을 만들어 `faq`를 제외한 모든 slug의 inbound ≥ 1.
  `faq`는 목록 맨 위 고정 카드라 본문 링크가 없어도 도달 가능하므로 제외한다.
  **이 테스트가 P1의 유일한 회귀선이고, 새 글이 추가될 때마다 자동으로 걸린다.**

### 커밋 분할

1. `docs(articles): 고아 4편에 유입 링크 (P1)` — 04·24·06·08·21 수정
2. (P2와 합쳐도 무방 — §P2 참고)

---

## P2. 링크 없는 도구 — **5개, 각각의 실제 위치**

### 실측: `#tool-` 앵커로 걸린 id 19개 / 전체 24개

**걸린 것**: `stats` `paper-search` `references` `citation` `chart` `caption` `variables`
`survey-or-inquiry` `idea` `sample-size` `deadlines` `ethics` `purpose` `design-type`
`random-sample` `imrad` `questions` `venues` `timer`

**안 걸린 것 5개**와 처방:

| id | 도구 | 넣을 곳 | 문장 |
| --- | --- | --- | --- |
| `survey-bias` | 설문 문항 편향 체크 | `02-survey-questions.mdx:104` | **§P1 (c)와 같은 문장** |
| `ai-disclosure` | AI 활용 disclosure 문구 | `04-research-ethics.mdx:61` | **§O8 삽입 3과 같은 문장** (U4 겸함) |
| `length` | 분량 체크기 | `08-abstract-and-title.mdx:63` | **§O8 삽입 5와 같은 문장** |
| `phrases` | 논문에 쓰는 영어 표현 | `05-reading-english-papers.mdx:45` | 아래 |
| `showcase` | 내 연구 사례 나누기 | `29-negative-results.mdx` 말미 | 아래 |

**`phrases`** — `05-reading-english-papers.mdx:43` 「자주 나오는 표현과 실제 뜻」 절 도입부(`:45`):

현재:
> 직역하면 어색하지만 논문에서는 정해진 뜻으로 쓰이는 표현들입니다.

변경 후:
> 직역하면 어색하지만 논문에서는 정해진 뜻으로 쓰이는 표현들입니다. 반대로 내가 영어로 쓸 때 쓸 표현은 [논문에 쓰는 영어 표현](/guide/writing#tool-phrases)에 섹션별로 36개 모아 뒀습니다.

("36개"는 `TOOL_DESCRIPTIONS`의 "정형 표현 36개"와 일치. `AcademicPhrases`의 실제 데이터 개수는
확인하지 않았다 — **구현 시 `lib/academicPhrases.ts`에서 세어 맞출 것.** 안 맞으면 숫자를 뺀다.)

**`showcase`** — `29-negative-results.mdx` 말미. 이 글은 이미 `/showcase/eeg-binaural`을
걸고 있어 "남의 실패담"이 있는 자리다. 그 뒤에:
> 그리고 당신의 기록도 여기 실을 수 있습니다. [내 연구 사례 나누기](/guide/submission#tool-showcase)에서 짧게 정리해 보내면 됩니다. 유의하지 않은 결과일수록 다음 사람에게 쓸모가 있습니다.

### 대응할 글이 없는 도구 — 0개

5개 전부 대응 글이 있다. **콘텐츠 공백으로 기록할 항목 없음.**

### 함정

1. **P2의 5개 중 3개가 P1·O8과 같은 줄이다.** 세 항목을 따로 커밋하면 같은 파일을
   세 번 만진다. §커밋 순서에서 합친다.
2. `#tool-phrases`는 `writing` 단계, `#tool-showcase`는 `submission` 단계.
   `#tool-survey-bias`는 `data-collection`. 전부 확인함 — 앵커 검증 통과.
3. `05-reading-english-papers`는 out 6 / in 5로 이미 잘 연결돼 있다. 링크 하나 더는 안전.

### 테스트

`lib/__tests__/stageToolMeta.test.ts`에 새 `it()` 하나 — **자료실이 아니라 도구 쪽에서 본다**:

- `it("모든 도구가 자료실 글 최소 한 편에서 링크된다")` —
  `getAllArticles()`의 content를 `extractInternalLinks`로 훑어 `#tool-` 앵커 집합을 만들고,
  `TOOL_IDS`의 값 전부가 그 집합에 있는지. **실패 메시지에 미연결 도구 이름을 나열한다.**
  새 도구를 넣으면 이 테스트가 즉시 걸리므로 H4가 이 테스트를 깬다 —
  **H4 커밋에서 `data-cleaning`의 글 링크도 같이 넣어야 한다**(`04-data-collection.mdx`는
  가이드라 이 테스트에 안 잡힌다. 자료실에서는 `27-lab-notebook.mdx`가 자연스럽다).
  → 이 상호작용이 이번 라운드의 유일한 항목 간 충돌이다.

**대안**: 테스트를 `articles ∪ guide`로 하면 H4가 가이드 표 칸 수정만으로 통과한다.
**권장**: 자료실만. 이유는 P2의 목적이 "검색 유입 표면에서 도구가 보이게"이고 가이드는
이미 도구를 품고 있기 때문. → **구현 시 판단**하되 자료실 한정을 권한다.

### 커밋 분할

§커밋 순서 참고 — P1·P2·O8을 **파일 단위로 묶는다.**

---

## P3. "다른 문서" 3편이 카테고리 안에서 전부 같다

### 현재 (`app/articles/[slug]/page.tsx:44-52`)

```tsx
  // 전체에서 앞 3편을 그대로 보여주면 모든 글이 같은 3편을 추천하게 된다.
  // 같은 카테고리를 우선 채우고, 모자라면 다른 카테고리로 채운다.
  const sameCategory = articles.filter(
    (a) => a.slug !== article.slug && a.category === article.category && a.category,
  );
  const otherCategory = articles.filter(
    (a) => a.slug !== article.slug && a.category !== article.category,
  );
  const others = [...sameCategory, ...otherCategory].slice(0, 3);
```

`getAllArticles()`는 카테고리 → order 정렬(`lib/articles.ts:97-103`)이라
`sameCategory`도 order 순이다. 결과: **`search` 카테고리 8편 중 4~8번째 글이 전부
1·2·3번째 글(= `reading-english-papers` `start-with-reviews` `riss-kci`)만 추천**한다.
44줄 주석이 막으려던 문제가 카테고리 안에서 재현된다. 백로그 판정 정확.

### 변경 — `lib/articles.ts`에 순수 함수를 추가하고 페이지는 그것을 부른다

로직을 페이지에 두면 테스트할 수 없다(`app/` 테스트 0개). lib으로 뺀다.

```ts
/**
 * 상세 하단 "자료실의 다른 문서" 3편.
 *
 * 같은 카테고리를 우선하되, 그 안에서 **자기 위치부터 순환**시킨다.
 * 단순 slice(0,3)이면 카테고리 8편 중 뒤쪽 다섯 편이 모두 같은 앞 세 편만
 * 추천하게 된다(search 카테고리에서 실제로 그랬다).
 *
 * 난수를 쓰지 않는다 — 빌드마다 결과가 바뀌면 정적 생성 결과와 테스트가
 * 흔들린다. 자기 인덱스라는 결정적 값만으로 회전시킨다.
 */
export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const all = getAllArticles();
  const article = all.find((a) => a.slug === slug);
  if (!article) return [];

  const sameCategory = article.category
    ? all.filter((a) => a.category === article.category)
    : [];
  const index = sameCategory.findIndex((a) => a.slug === slug);

  // 자기 다음 글부터 순환해서 채운다. 앞에서부터 채우면 뒤쪽 글이 전부
  // 같은 앞 세 편을 가리킨다.
  const rotated: Article[] =
    index === -1
      ? []
      : Array.from({ length: sameCategory.length - 1 }, (_, i) =>
          sameCategory[(index + 1 + i) % sameCategory.length],
        );

  const others = all.filter(
    (a) => a.slug !== slug && a.category !== article.category,
  );
  return [...rotated, ...others].slice(0, limit);
}
```

**페이지 변경** (`app/articles/[slug]/page.tsx:44-52` 삭제, `:6-10` import에 추가):
```tsx
  const others = getRelatedArticles(article.slug);
```

### 함정

1. **`prev`/`next`(`:53`, `getAdjacentInCategory`)와 겹친다.** 회전은 자기 **다음** 글부터
   시작하므로 `others[0] === next`가 된다. 같은 화면에 같은 글이 두 번 나온다.
   → **`index + 2`부터 시작**하거나 `next`/`prev`를 제외해야 한다.
   권장: `rotated`에서 `prev.slug`·`next.slug`를 필터한다. 카테고리가 4편 이하면
   남는 게 0~1편이 되어 `otherCategory`가 채운다 — 허용된다.
   **이게 이 항목의 실제 함정이고 백로그에 없다.**
2. **FAQ(카테고리 없음)** — `article.category`가 `undefined`면 `sameCategory`가 빈 배열,
   `rotated`도 빈 배열, `others` 필터의 `a.category !== undefined`가 모든 글에 참이 되어
   전체 앞 3편이 나온다. 현재 동작과 같다. 회귀 아님.
3. 결정적이므로 `generateStaticParams` 정적 생성과 충돌 없음.

### 테스트 (`lib/__tests__/articles.test.ts`)

- `it("같은 카테고리 안에서 글마다 다른 3편을 추천한다")` — `search` 카테고리 8편 각각의
  `getRelatedArticles(slug).map(a => a.slug)`를 모아, 서로 다른 조합이 **6가지 이상** 나오는지.
  (완전히 다 다를 필요는 없다 — 8편에서 3편을 뽑으면 겹침이 생긴다.)
- `it("추천에 자기 자신이 없다")` — 전체 글 순회.
- `it("추천에 prev·next가 중복되지 않는다")` — 함정 1의 회귀선.
- `it("두 번 불러도 같은 결과다")` — 결정성.
- `it("FAQ는 카테고리가 없어도 3편을 낸다")`.

### 커밋 분할

1. `feat(articles): 관련 문서 추천을 카테고리 안에서 회전 (P3)` — lib + 페이지 + 테스트 5건

---

## P4. `/showcase`를 푸터에

### 현재

- 앱 코드에서 `/showcase`(목록)를 거는 곳: `app/showcase/[slug]/page.tsx`의 상세 → 목록 하나뿐.
- `components/SiteFooter.tsx:14-43`이 거는 것: `/tools` `/articles` `/about` `/privacy` `/guide` **5개**.
- 자료실 본문에서 `/showcase/{slug}`로 들어오는 인라인 링크 **6개**(§0-6).
- `app/sitemap.ts:69-84`가 `/showcase` + 사례 6편 = **7개 URL**을 priority 0.7/0.6으로 제출.

### 변경 (`components/SiteFooter.tsx`)

`/articles` 항목(`:20-25`)과 `/about`(`:26-31`) **사이**에 삽입:

```tsx
            <Link
              href="/showcase"
              className="-my-3.5 flex items-center py-3.5 pr-3 hover:text-ink"
            >
              연구 사례
            </Link>
```

순서 근거: 콘텐츠(도구·자료실·연구 사례) → 사이트 정보(소개·개인정보) → 행동 유도(가이드).

### 함정

1. **사례가 0편이면 `/showcase`는 `notFound()`다** (`app/showcase/page.tsx:19`).
   푸터가 모든 페이지에 있으므로 **사례 0편 상태에서 푸터가 404로 링크한다.**
   `SiteFooter`는 서버 컴포넌트인가? — `"use client"`가 없고 `Link`만 쓰므로 서버다.
   `getAllShowcases()`를 불러 조건부 렌더할 수 있다:
   ```tsx
   {getAllShowcases().length > 0 && ( <Link href="/showcase">…</Link> )}
   ```
   `sitemap.ts:69`가 이미 같은 조건 분기를 쓴다 — **같은 판단을 같은 방식으로.**
   현재 사례가 6편이라 실효는 없지만, 운영자가 사례를 다 내리면 사이트 전체가
   깨진 푸터 링크를 갖게 된다. 조건부를 권한다.
   → **비용**: 푸터가 `layout.tsx`에 있으므로 모든 라우트가 `getAllShowcases()`를 부른다.
   `buildOnlyCache`가 프로덕션 빌드에서 캐시하므로(`lib/contentCache.ts`) 부담 없음. 확인함.
2. **E2(홈 사례 섹션)와 무관**하다. `app/page.tsx`를 안 건든다.
3. 375px에서 푸터 링크가 6개가 된다. `flex-wrap`이라 줄바꿈될 뿐 깨지지 않는다(`:13`).

### 테스트 (`lib/__tests__/siteLinks.test.ts` — O6와 같은 파일)

- `it("푸터가 /showcase를 링크한다")` — 파일 문자열 검사.
- `it("푸터의 모든 내부 링크가 실재하는 라우트다")` — `SiteFooter.tsx`에서 `href="/..."`를
  정규식으로 뽑아 `app/` 아래 대응 디렉터리 존재 확인. 이게 있으면 이후 푸터에
  오타난 경로를 넣는 것도 막힌다.

### 커밋 분할

1. `feat(nav): 푸터에 연구 사례 (P4)` — SiteFooter + siteLinks 테스트

---

## B5. 도구 → 자료실 역링크

### 현재

글→도구는 `articles.test.ts`의 도구 앵커 검증이 지킨다(백로그의 `:258` 언급 — 현재 파일에서는
`it("/guide 링크의 #tool-{id} 앵커가 …")` 블록, 대략 `:245-270`). 반대 방향은 데이터 자체가 없다.

### 변경 — `lib/stageToolMeta.ts`에 `TOOL_ARTICLES`

```ts
/**
 * 도구 → 그 도구를 설명하는 자료실 글. 도구 카드와 /tools 목록에서
 * "왜 이걸 쓰나"로 나가는 길이다.
 *
 * 값은 자료실 slug다. 실재 검증은 articles.test.ts가 한다 —
 * 여기서 import하면 lib/stageToolMeta가 fs를 끌어와 클라이언트 번들이 커진다.
 *
 * 모든 도구에 글이 있어야 하는 것은 아니다(Partial). 억지로 붙이지 않는다.
 */
export const TOOL_ARTICLES = {
  "간이 통계 계산기": ["statistics", "small-sample"],
  "표본 크기 계산기": ["small-sample", "right-sized-topic"],
  "설문 문항 편향 체크": ["survey-questions"],
  "간이 차트 그리기": ["figure-first"],
  "그림·표 캡션 도우미": ["figure-first"],
  "연구윤리 · 재현가능성 체크리스트": ["research-ethics", "replication-is-research"],
  "AI 활용 disclosure 문구 만들기": ["research-ethics"],
  "선행연구 검색해보기": ["start-with-reviews", "riss-kci", "pubmed-mesh"],
  "내 레퍼런스 목록": ["citation-chaining"],
  "인용 형식 만들어보기": ["riss-kci"],
  "논문에 쓰는 영어 표현": ["reading-english-papers"],
  "분량 체크기": ["abstract-and-title"],
  "IMRaD 구조 점검": ["negative-results", "limitations"],
  "투고처 후보 모음": ["finding-calls"],
  "마감일 트래커": ["finding-calls"],
  "예상 질문 뽑기": ["presentation"],
  "발표 시간 재보기": ["presentation"],
  "연구주제 아이디어 뽑기": ["topic-ideas", "why-topics-go-stale"],
  "내 연구질문, 조사형일까 탐구형일까": ["question-vs-researchable"],
  "내 연구질문에 맞는 설계 유형 찾기": ["question-to-test"],
  "변수 정의표 만들기": ["question-to-test", "control-group-mistakes"],
  "랜덤 표본 추첨기": ["control-group-mistakes"],
  "내 연구 사례 나누기": ["negative-results"],
  // 목적 진술 만들어보기 — 대응하는 자료실 글이 없다. 콘텐츠 공백으로 남긴다.
} as const satisfies Partial<Record<ToolTitle, readonly string[]>>;
```

**콘텐츠 공백 1건**: `"목적 진술 만들어보기"`(`purpose`). 억지로 붙이지 않는다.
(`24-question-to-test`가 목적 진술을 다루긴 하나 이미 `design-type`·`variables`가 그 글을 쓴다.)

### 표시 — 두 곳

**(1) `app/tools/page.tsx:92-94`** — 설명 `<span>` 아래. `<Link>` 안에 `<Link>`는 무효 HTML이므로
`<li>` 구조를 바꿔야 한다:

```tsx
              {titles.map((title) => {
                const related = TOOL_ARTICLES[title] ?? [];
                return (
                  <li key={title} className="border-t border-line">
                    <Link href={`/guide/${stage.slug}#tool-${TOOL_IDS[title]}`} className="group block pt-4 pb-1">
                      <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">{title}</span>
                      <span className="mt-1 block text-sm leading-[1.65] text-ink-soft">{TOOL_DESCRIPTIONS[title]}</span>
                    </Link>
                    {related.length > 0 && (
                      <p className="pb-4 text-xs text-ink-soft">
                        읽을거리:{" "}
                        {related.map((slug, i) => (
                          <span key={slug}>
                            {i > 0 && " · "}
                            <Link href={`/articles/${slug}`} className="text-accent hover:underline">
                              {articleTitles.get(slug) ?? slug}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
```

`articleTitles`는 페이지 상단에서 `new Map(getAllArticles().map(a => [a.slug, a.title]))`.
**부수 효과: `href`가 `#tools` → `#tool-{id}`로 바뀌면서 A1도 함께 해결된다.**
A1은 이번 범위 밖이지만 같은 줄이라 분리가 불가능하다 — **A1을 이 커밋에 포함한다고 명시**하고,
`:59-67`의 "펼쳐진 것은 목록의 첫 도구이니" 안내 문단도 사실이 아니게 되므로 함께 고친다.

**(2) 도구 카드 하단 (`components/StageTools.tsx`)** — 이건 **하지 않는다.**
`TOOL_RENDERERS[title](slug)` 아래 붙이려면 `StageTools`가 자료실 제목을 알아야 하는데
`StageTools`는 클라이언트 컴포넌트다. `getAllArticles()`는 `fs`를 쓴다.
제목 없이 slug만 링크하면 "citation-chaining"이 화면에 뜬다.
→ **`/tools` 페이지에만 넣는다.** 백로그의 "도구 카드 하단"은 아키텍처상 불가.
(가능하게 하려면 slug→제목 표를 빌드타임 상수로 생성해야 하는데, 그건 별개 항목이다.)

### 함정

1. `<Link>` 중첩 금지 — 위 구조 변경의 이유.
2. `TOOL_ARTICLES`를 `satisfies Partial<Record<...>>`로 두면 **오타난 도구 제목은 잡히지만
   오타난 자료실 slug는 안 잡힌다**(string이라). 테스트가 유일한 방지선.
3. `stageToolMeta.ts`는 `StageTools.tsx`(클라이언트)가 import한다. `TOOL_ARTICLES`가
   커지면 클라이언트 번들에 실린다. 24항목 문자열이라 1KB 미만 — 허용.
4. `/tools` 페이지는 `getAllStages()`만 쓰고 있었다. `getAllArticles()` import 추가 필요.

### 테스트 (`lib/__tests__/articles.test.ts`)

- `it("TOOL_ARTICLES의 모든 slug가 실재하는 자료실 문서다")` — **B5의 핵심 방지선.**
  실패 메시지에 도구 제목과 죽은 slug를 함께 낸다.
- `it("TOOL_ARTICLES에 중복 slug를 한 도구 안에 두지 않는다")`.
- `it("자료실 글이 없는 도구를 문서화한다")` — `TOOL_IDS`의 키 중 `TOOL_ARTICLES`에 없는 것이
  정확히 `["목적 진술 만들어보기"]`. **콘텐츠 공백이 조용히 늘어나는 것을 막는다.**

### 커밋 분할

1. `feat(tools): TOOL_ARTICLES 도구→자료실 역링크 데이터` — stageToolMeta + 테스트 3건
2. `feat(tools): /tools 목록에 도구 앵커 링크와 읽을거리 (B5+A1)` — 페이지 구조 변경 + 안내문 정정

---

## B6. 읽기 시간 표시

### 정정 (§0-8)

`lib/korean.ts`에 글자수 로직 **없음**. 참고할 기존 구현:
- `components/LengthChecker.tsx:8-10` — `text.length`, `replace(/\s/g,"").length`, 단어수
- `components/SpeechTimer.tsx:6,11` — `CHARS_PER_MINUTE = 320`(발표 속도), 공백 제외 글자수

**읽기 속도는 발표 속도와 다르다.** 백로그의 "분당 500자"를 쓰되 근거를 주석에 남긴다.

### 새 파일 `lib/readingTime.ts`

```ts
/**
 * MDX 본문의 예상 읽기 시간(분).
 *
 * 한국어 묵독 속도는 분당 500~700자로 보고된다. 목록에서 "24문항 FAQ"와
 * 짧은 글을 구분하는 것이 목적이므로 보수적으로 500을 쓴다 — 과소 추정보다
 * 과대 추정이 낫다(짧다고 들어갔다가 긴 글을 만나는 쪽이 나쁘다).
 */
const CHARS_PER_MINUTE = 500;

/**
 * 마크다운 문법을 걷어낸 본문 글자수.
 *
 * 정규화 없이 세면 링크 URL·표 구분선·코드블록이 전부 글자로 잡혀
 * 자료실 31편이 실제보다 20~40% 길게 나온다.
 */
export function normalizeForCount(markdown: string): string {
  return (
    markdown
      // 코드블록 통째로 (```/~~~ 모두)
      .replace(/^\s*(```|~~~)[\s\S]*?^\s*\1\s*$/gm, "")
      // 이미지: 대체텍스트도 안 읽는다
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      // 링크: 표시 텍스트만 남기고 URL을 버린다
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // 표 구분선 (|---|---|)
      .replace(/^\s*\|[\s:|-]+\|\s*$/gm, "")
      // 표 파이프와 인라인 강조·인용 기호
      .replace(/[|>*_`#]/g, "")
      // 남은 공백을 하나로
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** 1분 미만도 "1분"으로 올린다 — "0분"은 정보가 아니다. */
export function readingMinutes(markdown: string): number {
  const chars = normalizeForCount(markdown).length;
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
}
```

### 표시 — 세 곳

1. `app/articles/[slug]/page.tsx:100-102` — `마지막 수정 {article.updated}` 옆:
   `마지막 수정 {article.updated} · 읽는 데 약 {readingMinutes(article.content)}분`
2. `app/articles/page.tsx` — 카테고리 목록의 각 항목 `summary` 아래 `약 N분`
3. `app/page.tsx:254` 홈 자료실 목록 — **넣지 않는다.** 홈은 이미 밀도가 높고
   `summary`와 번호가 붙어 있다.

`Article` 타입에 필드를 추가하지 않는다 — `content`에서 파생되는 값이라
frontmatter에 넣으면 두 번째 진실 원본이 된다(T12가 지적한 그 패턴).

### 함정

1. **`getAllArticles()`는 목록 페이지에서도 `content`를 전부 들고 있다**(`lib/articles.ts:83`).
   추가 I/O 없음. 확인함.
2. 코드블록 정규식의 `^\s*\1` 역참조 — `gm` 플래그에서 동작하지만 여는 펜스와 닫는 펜스의
   길이가 다르면(``` vs ````) 안 잡힌다. 자료실에 4-백틱 펜스가 있는지는 확인 안 함.
   → **구현 시 확인.** 없으면 그대로, 있으면 `\1`을 `(```|~~~)`로 완화.
3. `Math.round`는 749자를 "1분", 750자를 "2분"으로 낸다. 경계가 흔들려 보이지만
   `Math.ceil`이면 501자가 "2분"이 되어 더 나쁘다. `round` 유지.

### 테스트 (`lib/__tests__/readingTime.test.ts`)

- `it("링크 URL을 세지 않는다")` — `"[제목](/articles/very-long-slug-name)"` → 2자
- `it("코드블록을 통째로 뺀다")`
- `it("표 구분선을 세지 않는다")`
- `it("빈 문서도 1분으로 낸다")`
- `it("실제 자료실 31편 전부가 1분 이상 60분 이하다")` — 통합 회귀선.
  정규화가 망가지면(예: 전체를 지워버리면) 여기서 걸린다.
- `it("FAQ가 가장 짧은 글보다 길게 나온다")` — B6의 존재 이유 그대로.

### 커밋 분할

1. `feat(lib): 읽기 시간 계산 (readingTime)` — 모듈 + 테스트 6건
2. `feat(articles): 상세·목록에 읽기 시간 표시`

---

## C3. 시리즈 묶기

### 발동 조건 확인 (`docs/articles-taxonomy-design.md`가 "연작이 둘 이상")

실측 연작 후보:

| 시리즈 | 글 | 근거 |
| --- | --- | --- |
| 논문 찾고 읽기 | `start-with-reviews` → `riss-kci` → `pubmed-mesh` → `free-full-text` → `citation-chaining` | 서로 5개 링크로 촘촘히 얽힘(각 in 1~3) |
| 주제 발굴 | `topic-ideas` → `from-a-paper` → `from-curriculum` → `why-topics-go-stale` | `06-topic-ideas`가 나머지 셋을 전부 링크 |
| 결과 쓰기 | `negative-results` → `limitations` → `abstract-and-title` | 상호 링크 |

**셋이다. 발동 조건 충족.** 백로그가 든 "논문 읽기 3편, 주제 발굴 3편"보다 실제로는 더 많다.

### 변경

**(1) frontmatter** — `content/articles/*.mdx`에 `series: "논문 찾고 읽기"` 등 문자열 한 줄.
카테고리와 독립이다(시리즈는 카테고리 안의 부분집합이지만 강제하지 않는다).

**(2) `lib/articles.ts`**

`Article` 타입에 `series?: string` 추가, `readArticleFile`에 `series: data.series` 추가.

```ts
/**
 * 같은 series 문자열을 가진 글들. 카테고리 안 order 순이 곧 시리즈 순서다.
 *
 * 별도 라우트를 만들지 않는다 — 설계 문서의 "얇은 페이지 금지"를 유지한다.
 * 시리즈는 상세 하단 박스로만 존재한다.
 */
export function getSeriesArticles(series: string): Article[] {
  return getAllArticles().filter((a) => a.series === series);
}
```

**(3) 상세 페이지 박스** — `app/articles/[slug]/page.tsx`.
**위치: `stage` 블록(`:152-167`)과 "자료실의 다른 문서"(`:169-183`) 사이가 아니라,
`prev`/`next` 블록(`:185`)보다 위**여야 한다(백로그: "prev/next보다 위").
실제로는 `:169`의 "다른 문서"보다도 위가 낫다 — 시리즈가 더 구체적인 관계다.

```tsx
      {series.length > 1 && (
        <div className="mt-10 rounded-lg border border-line bg-surface px-5 py-4">
          <p className="text-xs font-medium text-accent">
            {article.series} · {series.length}편 중 {seriesIndex + 1}번째
          </p>
          <ol className="mt-2 space-y-1.5">
            {series.map((s, i) => (
              <li key={s.slug} className="text-[15px]">
                <span className="text-ink-soft">{i + 1}. </span>
                {s.slug === article.slug ? (
                  <span aria-current="true" className="font-semibold text-ink">
                    {s.title}
                  </span>
                ) : (
                  <Link href={`/articles/${s.slug}`} className="text-ink-soft hover:text-accent">
                    {s.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
```

### 함정

1. **prev/next와 어긋나 보이는 문제**가 실재한다. 시리즈가 카테고리 경계를 넘으면
   "3편 중 2번째"인데 next는 시리즈 밖 글을 가리킨다.
   → **시리즈는 반드시 한 카테고리 안에서만 만든다.** 위 세 후보 모두 그렇다:
   `논문 찾고 읽기` = search, `주제 발굴` = topic, `결과 쓰기` = writing. 확인함.
   이 제약을 테스트로 박는다.
2. `series.length > 1` 조건 — 시리즈 이름이 하나뿐인 글에 박스가 뜨면 우스꽝스럽다.
3. **S6(frontmatter 검증)이 없어** 오타난 series 이름은 조용히 1편짜리 시리즈가 되고
   위 조건 때문에 박스가 안 뜬다. **조용히 사라진다.** 테스트로 잡는다.
4. `getSeriesArticles`는 `getAllArticles()` 정렬(카테고리 → order)을 상속하므로
   시리즈 안 순서 = order 순. 위 세 시리즈의 order가 읽는 순서와 맞는지 **구현 시 확인**.
   (`start-with-reviews`가 order 1인지 등 — 파일 접두사와 order가 다를 수 있다.)

### 테스트 (`lib/__tests__/articles.test.ts`)

- `it("모든 series는 2편 이상이다")` — 1편짜리 시리즈는 오타다. **함정 3의 방지선.**
- `it("한 시리즈의 글은 모두 같은 카테고리다")` — 함정 1의 방지선.
- `it("시리즈 안 순서가 order 오름차순이다")`.
- `it("시리즈가 최소 둘 있다")` — 설계 문서의 발동 조건을 테스트로 고정.

### 커밋 분할

1. `feat(articles): series frontmatter와 조회` — 타입 + lib + 테스트 4건 + 12편 frontmatter
2. `feat(articles): 상세에 시리즈 박스`

---

## C6. 사례 흡수 — **이미 끝나 있다**

### 실측

라운드 6의 판정("사례는 콘텐츠가 아니라 증거")에 따르면 C6의 목표는
"사례를 독립 페이지로 키우는 것"이 아니라 "관련 글 안에 인용+링크로 흡수"다.
**6편 전부 이미 그 상태다:**

| 사례 | 흡수된 글 | 형태 |
| --- | --- | --- |
| `trem2-chain` | `17-question-vs-researchable.mdx:90` | RMSD 0.044/1.22 Å 수치를 본문 논지의 예로 서술 + 링크 |
| `focused-ultrasound-bbb` | `21-right-sized-topic.mdx:71` | "가정을 다음 질문으로 바꿨다"는 논지의 실례 |
| `sex-difference-adr` | `23-public-data-topics.mdx:73` | 12년치 39.9/60.1%, p=.02173을 본문에 인용 |
| `lysozyme-charge-aggregation` | `27-lab-notebook.mdx:112` | 시약 미도착 → 발표본과 보고서 C군이 달랐다는 기록의 실례 |
| `eeg-binaural` | `29-negative-results.mdx:111` | 음수 R²를 지우지 않은 사례 |
| `aria-deep-learning` | `30-limitations.mdx:75` | MRI → CT 대체를 그대로 적은 사례 |

전부 **서사 문단 + 인라인 링크**다. 목록 나열이 아니다. **백로그 판정이 낡았다**(§0-5).

### 남은 잔여분 — 2건만

**(1) 사례 → 사례 링크의 비대칭.**
`trem2-chain`이 `lysozyme-charge-aggregation`을 걸고, `focused-ultrasound-bbb`가
`trem2-chain`을 건다. 반대 방향이 없다. 사례 6편 중 4편은 사례 간 링크가 0이다.
→ **하지 않는다.** 사례는 증거이지 읽는 순서가 있는 콘텐츠가 아니다.
라운드 6 기준에 따라 **명시적으로 기각**한다.

**(2) `03-statistics.mdx`는 사례 3편이 인용하는데 자기는 사례를 하나도 안 건다.**
inbound 3(사례) / outbound to showcase 0. 통계 글이 "실제로 이렇게 나왔다"의 증거를
안 갖고 있다. §O8 삽입 2에서 이미 자료실 3편으로 배출구를 냈으므로,
같은 문단에 사례 하나를 더 붙인다:

`03-statistics.mdx:113` (「결과를 문장으로 옮기기」 절 끝) 뒤:
> 유의하지 않은 결과를 실제로 이렇게 쓴 기록이 하나 있습니다. [결정계수가 음수로 나왔다](/showcase/eeg-binaural)는 여섯 모델의 음수 R²를 지우지 않고 그대로 적고, 통계가 뒷받침하지 않는다는 서술과 눈으로 읽은 경향을 나란히 남겼습니다.

### 함정

1. **S4가 먼저 들어와 있어야** 이 `/showcase/eeg-binaural` 링크가 검증된다.
2. `29-negative-results.mdx:111`이 같은 사례를 이미 인용한다. **중복 인용은 문제가 아니다** —
   두 글의 논지가 다르고(하나는 "쓰는 법", 하나는 "읽는 법"), 사례는 증거이므로
   여러 곳에서 인용되는 것이 정상이다.

### 테스트

- `lib/__tests__/articles.test.ts`에 `it("사례 6편이 각각 자료실 글 최소 한 편에서 인용된다")` —
  `getAllShowcases()`의 각 slug가 자료실 본문의 `/showcase/{slug}` 링크에 하나 이상 등장.
  **C6의 상태를 고정한다.** 새 사례가 들어오면 이 테스트가 흡수를 강제한다.

### 커밋 분할

1. `docs(articles): 통계 글에 사례 인용 (C6 잔여)` — 03-statistics 한 문단
2. `test(showcase): 사례가 자료실에서 인용되는지 검증`

---

# 실행 순서

**S4가 절대 먼저다.** 그 뒤 링크를 심는 항목들, 그다음 코드.

```
1  S4   링크 검증 확장                       ← 방지선. 다른 모든 링크 작업의 선행
2  L7   usePersistentState 디바운스           ← C4의 선행
3  C4   PersistNotice                        ← H3·H4가 이걸 쓴다
4  P3   관련 문서 회전                        ← 독립
5  B6   읽기 시간                            ← 독립
6  O6   홈 → /tools
7  P4   푸터 → /showcase                     ← 6과 같은 테스트 파일
8  ─── 본문 링크 라운드 (파일 단위로 묶는다) ───
   8a  03-statistics.mdx      : O8 삽입1,2 + C6 잔여
   8b  04-research-ethics.mdx : O8 삽입3(=P2 ai-disclosure=U4) + O8 삽입4 + P1(survey-questions)
   8c  08-abstract-and-title  : O8 삽입5(=P2 length) + P1(finding-calls)
   8d  02-survey-questions    : P1(c)(=P2 survey-bias)
   8e  05-reading-english     : P2 phrases
   8f  29-negative-results    : P2 showcase
   8g  07-presentation / 06-topic-ideas / 21-right-sized / 24-question-to-test : O8·P1 잔여
9  B5   TOOL_ARTICLES + /tools 목록 (A1 포함) ← 8 이후여야 링크 대상이 확정
10 C3   시리즈
11 B2   차트 오차막대                        ← O3 뒤가 이상적(다크모드 색)
12 H3   검색 기록표
13 H4   데이터 정리 기록표                    ← P2 테스트를 깬다. 자료실 링크를 같은 커밋에
```

**항목 간 충돌 1건**: §P2의 새 테스트("모든 도구가 자료실에서 링크된다")를
H4의 새 도구가 깬다. H4 커밋에 `27-lab-notebook.mdx` → `#tool-cleaning-log` 링크를
반드시 포함할 것. 이번 라운드에서 유일한 순서 의존 함정이다.

---

# 구현 시 판단 필요 (확정하지 않은 것)

1. **L7**: 함수형 업데이터 안 ref 쓰기 vs 밖에서 계산. 전자를 권했으나 팀 규약에 따라.
2. **H3**: `generateId`를 `lib/id.ts`로 승격할지, `searchLog.ts`에 복제할지.
3. **H3**: 메모의 `|` 이스케이프 여부.
4. **H4**: 새 도구를 `data-collection` 배열 맨 앞(교육적으로 옳음)에 둘지 맨 뒤(회귀 위험 0)에 둘지.
   실제로 깨지는 테스트는 없음을 확인했으므로 맨 앞을 권한다.
5. **B2**: 오차막대 색을 하드코딩할지 O3의 토큰을 기다릴지.
6. **B6**: 자료실에 4-백틱 코드펜스가 있는지 확인 후 정규식 확정.
7. **P2 테스트**: 순회 대상을 자료실만으로 할지 가이드까지 넣을지.
8. **C3**: 세 시리즈의 `order` 값이 실제 읽는 순서와 맞는지 파일별 확인.
9. **P2 `phrases`**: "36개"가 `lib/academicPhrases.ts`의 실제 개수와 맞는지 확인 후 확정.
10. **P4**: 푸터 `/showcase`를 조건부 렌더할지. 권장은 조건부.
