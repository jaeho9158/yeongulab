# 묶음 0 구현 설계 — 치명 결함 22건

라운드 8. 발견이 아니라 구현 설계다. 오푸스5가 작성하고 페이블 5.1이 검수했다.
대상 항목의 판정 근거는 docs/backlog-index.md와 docs/feature-backlog.md에 있다.

이 문서는 그대로 구현 지침으로 쓴다. 붙여넣을 코드 수준으로 쓰여 있고,
각 항목에 함정과 테스트, 커밋 분할이 붙어 있다.

---

# 묶음 0 구현 설계 — 22건

검증 환경: 실제 파일 인용, 줄 번호 전수 재확인, 통계값은 저장소 `lib/stats.ts`의 알고리즘을 그대로 떼어 재계산했다.

**백로그 줄 번호 오류 2건을 새로 찾았다** (X2·X3의 `:95 :99 :109 :113`, X5의 `:27`). 아래 각 항목에 정정본을 넣었다.

---

# 파트 1 — 코드 변경 12건

## K1. PlanBackup 복원 롤백

### 위치
`components/PlanBackup.tsx:112-120`

```ts
      // '덮어씁니다'라는 안내대로, 기존 기록은 지우고 파일 내용만 남긴다
      for (const key of listRecordKeys()) window.localStorage.removeItem(key);
      for (const [key, value] of entries) window.localStorage.setItem(key, value);

      setStatus("imported");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      fail(GENERIC_ERROR);
    }
```

### 변경 후

`:11-12`의 상수 블록을 교체:

```ts
const GENERIC_ERROR =
  "파일을 읽지 못했습니다. 이 사이트에서 내려받은 백업 파일이 맞는지 확인해주세요.";
// 쓰기가 중간에 실패했지만 스냅샷으로 되돌린 경우 — 기록은 그대로다
const RESTORE_ROLLED_BACK =
  "복원에 실패해 기존 기록을 그대로 되돌렸습니다. 저장 공간이 부족하거나 프라이빗 모드일 수 있습니다.";
// 롤백조차 실패한 경우 — 이 문구만이 사용자에게 손실 가능성을 알린다
const RESTORE_CORRUPTED =
  "복원에 실패했고 기존 기록이 손상됐을 수 있습니다. 이 페이지를 새로고침하지 말고, 먼저 '백업 파일 내려받기'로 지금 상태를 저장해두세요.";
```

`:112-120`을 교체:

```ts
      // 지우기 전에 현재 기록 전체를 메모리에 뜬다. 쓰기 루프가 중간에
      // 실패해도 이 스냅샷으로 되돌린다 — 아니면 한 학기 기록이 사라진 채
      // "파일을 읽지 못했습니다"라는 엉뚱한 안내만 남는다.
      const snapshot = collectData();
      const oldKeys = Object.keys(snapshot);

      try {
        for (const key of oldKeys) window.localStorage.removeItem(key);
        for (const [key, value] of entries) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // 롤백: 새로 쓴 것을 걷어내고 스냅샷을 되돌린다
        try {
          for (const [key] of entries) window.localStorage.removeItem(key);
          for (const [key, value] of Object.entries(snapshot)) {
            window.localStorage.setItem(key, value);
          }
          fail(RESTORE_ROLLED_BACK);
        } catch {
          fail(RESTORE_CORRUPTED);
        }
        return;
      }

      setStatus("imported");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      fail(GENERIC_ERROR);
    }
```

`fail()`의 3초 자동 해제(`:74`)를 심각도에 따라 나눈다 — `:71-75` 교체:

```ts
  /** persist=true면 자동으로 사라지지 않는다(데이터 손실 안내는 놓치면 안 된다). */
  function fail(message: string, persist = false) {
    setErrorMessage(message);
    setStatus("error");
    if (!persist) setTimeout(() => setStatus("idle"), 3000);
  }
```

호출부: `fail(RESTORE_ROLLED_BACK, true)`, `fail(RESTORE_CORRUPTED, true)`. 나머지 둘은 그대로.

### 함정

1. **`collectData()`는 `listRecordKeys()`의 실패를 삼킨다** (`:21-23`의 `catch`가 빈 배열 반환). localStorage 접근 자체가 막힌 환경이면 `snapshot = {}`, `oldKeys = []`가 되고 롤백은 아무것도 되돌리지 않는다. 하지만 그 환경에선 `removeItem`도 즉시 throw하므로 지운 것도 없다 — 실질 무해. 다만 **부분 실패**(일부 키만 `getItem`이 throw)면 그 키는 스냅샷에 없고 지워진 뒤 복구되지 않는다. 이건 롤백으로 못 막는 잔여 위험이므로 주석에 명시해야 한다.
2. **롤백 자체가 quota를 다시 넘길 수 있다.** 스냅샷이 원래 들어 있던 양이므로 보통은 들어가지만, `entries` 일부가 이미 써진 상태에서 롤백 첫 루프(`removeItem`)가 실패하면 공간이 안 비어 두 번째 루프가 또 터진다 → `RESTORE_CORRUPTED`. 이게 정확히 이 문구가 존재하는 이유다. **문구를 지우지 마라.**
3. **`RESTORE_CORRUPTED` 상태에서 `reload()`를 부르면 안 된다.** 현재 코드는 성공 경로에서만 부르므로 위 패치는 안전하지만, 나중에 "실패해도 새로고침" 같은 정리를 하면 사용자가 현 상태를 백업할 기회를 잃는다.
4. `entries`와 `snapshot`에 **같은 키가 겹치면** 롤백 첫 루프가 그 키를 지운 뒤 둘째 루프가 다시 쓴다 — 순서가 맞아 정상. 순서를 바꾸면 깨진다.

### 테스트 (`components/__tests__/PlanBackup.test.tsx`, 신설 · `// @vitest-environment jsdom`)

`_storage.ts` 헬퍼(S2)로 만든 모의 저장소를 `vi.stubGlobal("window", …)`이 아니라 `Object.defineProperty(window, "localStorage", …)`로 갈아끼운다(jsdom에서 window 전체를 스텁하면 render가 죽는다).

| `it()` 제목 | 검증 |
| --- | --- |
| `"정상 복원: 기존 키를 지우고 파일 내용만 남긴다"` | 기존 `research-guide:a` 존재 → 파일에 `research-guide:b`만 → 복원 후 `a`는 없고 `b`만 |
| `"테마 키는 지우지도 덮어쓰지도 않는다"` | `research-guide:theme` 값이 복원 전후 동일 |
| `"쓰기 2번째에서 실패하면 기존 기록 전부가 그대로 돌아온다 (K1 회귀)"` | `failOnNthSet(2)` 저장소. 복원 후 스냅샷과 `store` 내용이 `toEqual`. 화면에 `/기존 기록을 그대로 되돌렸습니다/` |
| `"롤백조차 실패하면 다른 문구로 손상 가능성을 알린다"` | 3번째부터 모든 `setItem`이 throw. 화면에 `/손상됐을 수 있습니다/`. `"파일을 읽지 못했습니다"`가 **없음** |
| `"쓰기 실패 시 새로고침하지 않는다"` | `window.location.reload`를 `vi.fn()`으로 스파이 → `expect(reload).not.toHaveBeenCalled()` |
| `"손상된 JSON은 여전히 '파일을 읽지 못했습니다'"` | 두 오류 문구가 섞이지 않는지 |

모킹 필요 항목: `window.confirm` → `vi.spyOn(window, "confirm").mockReturnValue(true)`. `File.prototype.text`는 jsdom 30에 있으나 없으면 `new File([json], "b.json")`에 `text` 폴리필. `URL.createObjectURL`/`revokeObjectURL`은 jsdom에 없으므로 `vi.stubGlobal` 필요(내보내기 테스트를 쓸 때).

---

## K2. addReference / removeReference 저장 실패 노출

### 위치
`lib/citations.ts:98-116`

```ts
export function addReference(ref: Omit<Reference, "id">): Reference[] {
  const next = [...readReferences(), { ...ref, id: generateId() }];
  try {
    window.localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 호출부에서 받은 next는 그대로 반환
  }
  return next;
}
```

### 파급 범위 — grep 실측

```
addReference    호출부 2곳: CitationFormatter.tsx:64, PriorResearchSearch.tsx:46
removeReference 호출부 1곳: ReferenceList.tsx:34
readReferences  호출부 2곳: ReferenceList.tsx:15, :23  ← 시그니처 변경 없음
테스트 파급     0건 (citations.test.ts는 readReferences만 부른다)
```

**총 3곳.** 반환 타입을 바꾸면 이 3곳이 컴파일 에러가 난다 — 조용히 넘어가지 않는다는 뜻이므로 오히려 안전한 변경이다.

### 변경 후 — `lib/citations.ts:98-116` 교체

```ts
/**
 * 저장 결과. saved=false면 화면에는 반영됐지만 새로고침에 사라진다 —
 * 호출부가 "저장됨"이라고 말하기 전에 반드시 확인해야 한다.
 */
export type ReferenceWriteResult = { refs: Reference[]; saved: boolean };

function writeReferences(next: Reference[]): ReferenceWriteResult {
  try {
    window.localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(next));
    return { refs: next, saved: true };
  } catch {
    // 화면 상태는 next로 진행하되, 저장 실패를 호출부에 그대로 넘긴다
    return { refs: next, saved: false };
  }
}

export function addReference(ref: Omit<Reference, "id">): ReferenceWriteResult {
  return writeReferences([...readReferences(), { ...ref, id: generateId() }]);
}

export function removeReference(id: string): ReferenceWriteResult {
  return writeReferences(readReferences().filter((r) => r.id !== id));
}
```

### 호출부 1 — `components/CitationFormatter.tsx:62-68`

```ts
  function saveToReferences() {
    if (!hasInput) return;
    const { saved } = addReference(ref);
    window.dispatchEvent(new Event("research-guide:references-updated"));
    if (!saved) {
      setSaveFailed(true);
      return;
    }
    setSaveFailed(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
```

`:38` 근처에 상태 추가: `const [saveFailed, setSaveFailed] = useState(false);`
import 추가: `import { PERSIST_ERROR_MESSAGE } from "@/lib/usePersistentState";`
저장 버튼 옆(JSX)에 `aria-live="polite"` 문단 하나:

```tsx
<p aria-live="polite" className="mt-2 text-xs text-danger">
  {saveFailed && PERSIST_ERROR_MESSAGE}
</p>
```

### 호출부 2 — `components/PriorResearchSearch.tsx:45-55`

```ts
  function save(paper: Paper) {
    const { saved } = addReference({
      authors: paper.authors.map((a) => a.name).join(", "),
      year: paper.year ? String(paper.year) : "",
      title: paper.title,
      source: paper.venue ?? "",
      url: paper.url ?? "",
    });
    window.dispatchEvent(new Event("research-guide:references-updated"));
    // 저장에 실패했으면 버튼을 "저장됨"으로 바꾸지 않는다 —
    // 논문 10편을 저장하고 새로고침하면 전부 없어지는 게 이 버튼의 거짓말이었다
    if (!saved) {
      setSaveFailed(true);
      return;
    }
    setSaveFailed(false);
    setSavedIds((prev) => ({ ...prev, [paper.paperId]: true }));
  }
```

### 호출부 3 — `components/ReferenceList.tsx:33-35`

```ts
  function remove(id: string) {
    const { refs: next, saved } = removeReference(id);
    setRefs(next);
    setDeleteFailed(!saved);
  }
```

`:16` 근처에 `const [deleteFailed, setDeleteFailed] = useState(false);`
`:95-97`의 aria-live 문단을 확장:

```tsx
      <p aria-live="polite" className="mt-3 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
        {deleteFailed && "삭제 상태를 저장하지 못했습니다. 새로고침하면 항목이 되돌아옵니다."}
      </p>
```

### 함정

1. **삭제 실패 시 화면은 이미 지워졌다.** `setRefs(next)`가 무조건 실행되므로 화면에는 없는데 저장소에는 남는다. 위 문구가 그 불일치를 정확히 서술한다. 대안(실패 시 화면도 되돌리기)은 `useSeededState`를 되감아야 해서 더 복잡하고, "지운 게 안 지워졌다"를 조용히 되돌리면 사용자가 더 혼란스럽다. **의도적으로 화면 우선 + 명시 안내를 택한다.**
2. **`readReferences()`가 조용히 `[]`를 반환하는 경로**(`:93-95`)는 그대로 남는다. localStorage 읽기가 막힌 환경에서 `addReference`는 "기존 0개 + 새 1개"로 덮어써 기존 기록을 날린다. **이건 K2의 범위가 아니지만 같은 함수 안이라 눈에 띈다** — 백로그에 없는 신규 항목이므로 여기서 고치지 말고 `docs/feature-backlog.md`에 별건으로 올려라. (구현 시 판단 필요: 같이 고칠지)
3. **`PERSIST_ERROR_MESSAGE`를 `usePersistentState`에서 import하는 것**은 훅 파일에 `"use client"`가 있고 상수만 가져오므로 문제없다. 다만 나중에 그 파일이 무거워지면 상수를 `lib/clipboard.ts` 옆 `lib/persistMessages.ts`로 옮기는 게 맞다. **지금은 옮기지 마라** — 커밋을 키운다.

### 테스트 (`lib/__tests__/citations.test.ts` 확장 — S2와 같은 커밋)

| `it()` 제목 | 검증 |
| --- | --- |
| `"addReference는 저장에 성공하면 saved=true와 새 목록을 준다"` | `saved === true`, `refs.length === 1`, `refs[0].id`가 문자열 |
| `"addReference는 setItem이 throw하면 saved=false를 준다 (K2 회귀)"` | `alwaysFailingStorage()`. `saved === false`이고 `refs.length === 1` (화면용 목록은 살아 있음) |
| `"removeReference도 저장 실패를 saved=false로 알린다"` | 같은 형태 |
| `"저장 실패해도 예외를 밖으로 던지지 않는다"` | `expect(() => addReference(...)).not.toThrow()` |

컴포넌트 쪽:

| 파일 | `it()` 제목 | 모킹 |
| --- | --- | --- |
| `CitationFormatter.test.tsx` | `"저장에 실패하면 '저장됨'이 아니라 저장 실패 안내가 뜬다"` | `localStorage.setItem`을 throw로 교체 → 저장 클릭 → `PERSIST_ERROR_MESSAGE` 존재, `"저장됨"` 없음 |
| `PriorResearchSearch.test.tsx` | `"저장 실패 시 버튼이 '저장됨'으로 바뀌지 않는다 (K2 회귀)"` | `fetch` 모킹으로 결과 1건 → `setItem` throw → 버튼 텍스트가 여전히 `"저장"` |

---

## K3. 상관·회귀의 인덱스 보존 쌍 파싱

### 위치
`components/StatsCalculator.tsx:145-176` (개수만 검사), `lib/stats.ts:296` (위치 정보 없이 필터)

```ts
    } else if (mode === "correlation") {
      if (a.length !== b.length || a.length < 3) {
```

```ts
  const values = tokens.map(Number).filter((n) => Number.isFinite(n));
```

### 설계 원칙 — t-검정 경로를 건드리지 않는다

**`parseNumberListDetailed`와 `tokenizeNumberList`는 한 글자도 안 바꾼다.** t-검정은 두 집단의 n이 달라도 되는 검정이라 쌍 개념이 없다. 쌍 파싱은 **새 함수로 추가**하고 상관·회귀 분기에서만 쓴다. 이 분리가 "기존 t-검정 경로를 안 깨는가"에 대한 답이다 — 공유 코드가 `tokenizeNumberList` 뿐이고 그건 읽기만 한다.

### `lib/stats.ts` 끝에 추가

```ts
/** 쌍 파싱에서 한 행이 어떤 상태였는지. */
export type PairIssue = { row: number; side: "x" | "y"; raw: string };

export type PairedParse = {
  x: number[];
  y: number[];
  /** 숫자로 읽지 못했거나 비어 있던 칸 (1-based 행 번호) */
  issues: PairIssue[];
  /** 두 열의 행 수가 다르면 각각의 행 수 */
  lengths: { x: number; y: number };
  thousandsMergedCount: number;
  ambiguousCommaCount: number;
};

/**
 * 한 열의 텍스트를 **행 단위**로 자른다.
 *
 * 왜 행 단위인가 — 엑셀에서 열을 복사해 붙여넣으면 빈 셀이 빈 줄로 온다.
 * 그런데 `tokenizeNumberList`는 `\s+`로 잘라 빈 줄을 통째로 흡수하므로
 * 그 행이 있었다는 사실 자체가 사라진다(K3). 상관·회귀는 X의 i번째와 Y의
 * i번째가 같은 관측이라는 전제 위에 서므로, 행이 사라지면 그 뒤 전부가
 * 한 칸씩 밀린 채 조용히 계산된다.
 *
 * 줄바꿈이 없는 입력(`"12, 15, 14"`)은 기존 사용법이므로 종전 토크나이저에
 * 그대로 맡긴다 — 이 경우 빈 칸을 표현할 방법 자체가 없다.
 */
function splitColumn(text: string): {
  cells: string[];
  thousandsMergedCount: number;
  ambiguousCommaCount: number;
} {
  const normalized = text.replace(/\r\n?/g, "\n");
  if (!normalized.includes("\n")) {
    const t = tokenizeNumberList(normalized);
    return {
      cells: t.tokens,
      thousandsMergedCount: t.thousandsMergedCount,
      ambiguousCommaCount: t.ambiguousCommaCount,
    };
  }
  // 앞뒤의 빈 줄만 떼고 가운데 빈 줄은 '빈 셀'로 보존한다
  const lines = normalized.split("\n");
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  // 행 안의 쉼표 해석은 열 전체를 한 번에 보고 정한다(기존 규칙과 동일)
  const joined = tokenizeNumberList(lines.join("\n"));
  const cells = lines.map((line) => {
    const t = tokenizeNumberList(line);
    // 한 줄에 값이 여러 개면 첫 값만 그 행의 값으로 본다(아래 함정 3 참고)
    return t.tokens[0] ?? "";
  });
  return {
    cells,
    thousandsMergedCount: joined.thousandsMergedCount,
    ambiguousCommaCount: joined.ambiguousCommaCount,
  };
}

/** X·Y 두 열을 인덱스를 맞춰 파싱한다. 못 읽은 칸의 행 번호를 함께 돌려준다. */
export function parsePairedLists(textX: string, textY: string): PairedParse {
  const cx = splitColumn(textX);
  const cy = splitColumn(textY);
  const n = Math.max(cx.cells.length, cy.cells.length);
  const x: number[] = [];
  const y: number[] = [];
  const issues: PairIssue[] = [];
  for (let i = 0; i < n; i++) {
    const rawX = cx.cells[i] ?? "";
    const rawY = cy.cells[i] ?? "";
    // Number("")===0 이라 빈 칸이 유령 0이 되는 것을 막는다
    const vx = rawX === "" ? NaN : Number(rawX);
    const vy = rawY === "" ? NaN : Number(rawY);
    const okX = Number.isFinite(vx);
    const okY = Number.isFinite(vy);
    if (!okX) issues.push({ row: i + 1, side: "x", raw: rawX });
    if (!okY) issues.push({ row: i + 1, side: "y", raw: rawY });
    // 한쪽이라도 못 읽으면 그 행 전체를 버린다 — 쌍이 아니면 쓸 수 없다
    if (okX && okY) {
      x.push(vx);
      y.push(vy);
    }
  }
  return {
    x,
    y,
    issues,
    lengths: { x: cx.cells.length, y: cy.cells.length },
    thousandsMergedCount: cx.thousandsMergedCount + cy.thousandsMergedCount,
    ambiguousCommaCount: cx.ambiguousCommaCount + cy.ambiguousCommaCount,
  };
}
```

### `components/StatsCalculator.tsx` — `compute()` 재구성

`:91-118`의 공통 파싱 블록을 t-검정 전용으로 좁히고, 쌍 모드는 별도 경로를 탄다. `:83-176`을 다음으로 교체:

```ts
  function compute() {
    setStaleNotice(false);
    setError(null);
    setDropWarning(null);
    setThousandsNotice(null);
    setAmbiguityWarning(null);
    setTtestResult(null);
    setRegressionResult(null);

    if (mode === "ttest") {
      const parsedA = parseNumberListDetailed(textA);
      const parsedB = parseNumberListDetailed(textB);
      reportCommaReading(
        "그룹 A",
        "그룹 B",
        parsedA.thousandsMergedCount,
        parsedB.thousandsMergedCount,
        parsedA.ambiguousCommaCount,
        parsedB.ambiguousCommaCount,
      );
      const dropped = parsedA.droppedCount + parsedB.droppedCount;
      if (dropped > 0) {
        setDropWarning(`숫자로 읽지 못한 값 ${dropped}개는 제외했습니다.`);
      }
      const a = parsedA.values;
      const b = parsedB.values;
      if (a.length < 2 || b.length < 2) {
        setError("각 그룹에 숫자가 2개 이상 필요합니다.");
        return;
      }
      const r = welchTTest(a, b);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setTtestResult({
        value: r.t,
        df: r.df,
        p: r.p,
        groups: {
          meanA: r.meanA,
          meanB: r.meanB,
          sdA: r.sdA,
          sdB: r.sdB,
          nA: r.nA,
          nB: r.nB,
          meanDiff: r.meanDiff,
          cohenD: r.cohenD,
        },
      });
      return;
    }

    // 상관·회귀는 X의 i번째와 Y의 i번째가 같은 관측이어야 한다.
    // 개수만 세면 양쪽에 빈 칸이 하나씩 있을 때 검사를 통과한 채
    // 그 아래 전부가 한 칸씩 밀린 쌍으로 계산된다(K3).
    const paired = parsePairedLists(textA, textB);
    reportCommaReading(
      "변수 X",
      "변수 Y",
      paired.thousandsMergedCount,
      0,
      paired.ambiguousCommaCount,
      0,
    );

    if (paired.lengths.x !== paired.lengths.y) {
      setError(
        `변수 X는 ${paired.lengths.x}개, 변수 Y는 ${paired.lengths.y}개입니다. 상관·회귀는 X와 Y가 같은 대상에서 나온 짝이어야 하므로 개수가 같아야 합니다.`,
      );
      return;
    }
    if (paired.issues.length > 0) {
      const rows = [...new Set(paired.issues.map((i) => i.row))]
        .sort((a, b) => a - b)
        .slice(0, 5);
      const more = new Set(paired.issues.map((i) => i.row)).size - rows.length;
      setError(
        `${rows.join(", ")}번째 행${more > 0 ? ` 외 ${more}개 행` : ""}에 비어 있거나 숫자가 아닌 값이 있습니다. 그 행을 지우거나 값을 채운 뒤 다시 계산하세요 — 빈 칸을 그냥 건너뛰면 그 아래 쌍이 전부 한 칸씩 밀립니다.`,
      );
      return;
    }
    if (paired.x.length < 3) {
      setError("최소 3쌍 이상 필요합니다.");
      return;
    }

    if (mode === "correlation") {
      const r = pearsonCorrelation(paired.x, paired.y);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setTtestResult({ value: r.r, df: r.df, p: r.p });
    } else {
      const r = simpleLinearRegression(paired.x, paired.y);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setRegressionResult({
        slope: r.slope,
        intercept: r.intercept,
        r2: r.r2,
        p: r.p,
      });
    }
  }
```

`compute()` 위에 헬퍼를 하나 뽑는다(중복 제거):

```ts
  function reportCommaReading(
    nameA: string,
    nameB: string,
    mergedA: number,
    mergedB: number,
    ambigA: number,
    ambigB: number,
  ) {
    const merged: string[] = [];
    if (mergedA > 0) merged.push(nameA);
    if (mergedB > 0) merged.push(nameB);
    if (merged.length > 0) {
      setThousandsNotice(
        `${merged.join("·")}의 쉼표를 천 단위 구분으로 읽었습니다(1,200 → 1200). 값을 구분하려면 공백이나 줄바꿈을 쓰세요.`,
      );
    }
    const ambiguous: string[] = [];
    if (ambigA > 0) ambiguous.push(nameA);
    if (ambigB > 0) ambiguous.push(nameB);
    if (ambiguous.length > 0) {
      setAmbiguityWarning(
        `${ambiguous.join("·")}의 쉼표 사용이 일관되지 않아 값 구분자로 읽었습니다(1,200 → 1과 200). 천 단위 표기라면 쉼표를 지우고 다시 계산하세요.`,
      );
    }
  }
```

import 추가: `parsePairedLists`.

### 함정

1. **동작 변경이다, 버그 수정이 아니다.** 지금은 못 읽은 값을 버리고 계산해준다. 바뀌면 **오류를 내고 계산을 거부한다.** 학생이 "전에는 됐는데"라고 느낄 수 있다. 오류 문구가 무엇을 해야 하는지 정확히 말하는 게 그 대가다. 계산을 계속하되 경고만 띄우는 절충안은 **금지** — K3의 본질이 "경고를 못 봐도 답이 나온다"이다.
2. **쉼표 판정 범위가 미묘하게 달라진다.** `splitColumn`은 열 전체(`lines.join("\n")`)로 천 단위 여부를 정한 뒤 행별로 다시 `tokenizeNumberList(line)`을 부른다. 한 줄만 보면 판정이 달라질 수 있다(예: 열에 `1,200`과 `12,15`가 섞이면 열 판정은 "구분자", 줄 판정은 `1,200`만 보고 "천 단위"). 그래서 **행 값은 `t.tokens[0]`만 쓴다** — 구분자 해석이면 `1,200` → `["1","200"]` → 첫 값 `1`. 열 판정과 어긋나는 이 지점은 `ambiguousCommaCount`가 이미 경고를 띄우는 구간이다. **여기는 구현 시 판단 필요**: 더 정확하게 하려면 `tokenizeNumberList`에 "천 단위 여부를 밖에서 주입" 파라미터를 추가해야 하는데, 그러면 t-검정 경로의 함수 시그니처를 건드린다. 나는 커밋을 좁게 두는 쪽을 권한다.
3. **한 행에 값이 여럿이면 첫 값만 쓴다.** `"12 15"`가 한 줄에 있으면 `12`만. 이건 조용한 절삭이므로, 엄밀히 하려면 `t.tokens.length > 1`인 행도 `issues`에 넣어야 한다. **넣는 쪽을 권한다** — 위 코드에 다음 한 줄을 `splitColumn`의 `cells` 매핑 대신 쓰면 된다:

   ```ts
   const cells = lines.map((line) => {
     const t = tokenizeNumberList(line);
     return t.tokens.length === 1 ? t.tokens[0] : t.tokens.length === 0 ? "" : "__MULTI__";
   });
   ```
   `"__MULTI__"`는 `Number()`가 NaN을 내므로 자동으로 `issues`에 잡힌다. 다만 오류 문구가 "숫자가 아닌 값"이라 정확하지 않다 — **구현 시 판단 필요.**
4. **`lengths` 검사가 기존 메시지를 대체한다.** 기존 문구(`"두 변수의 값 개수가 같아야 하고, 최소 3쌍 이상 필요합니다."`)를 참조하는 테스트가 있는지 확인해야 한다 — 현재 `StatsCalculator.test.tsx` 12개 `it` 중 상관·회귀 계산 테스트가 0개라(S5) **깨지는 테스트는 없다.**
5. **`SimpleChart`의 `parsePairs`와 통합하지 마라.** 저쪽은 라벨(문자열)과 값(숫자)의 쌍이고 여기는 숫자-숫자다. 빈 칸의 의미도 다르다(차트는 조용히 건너뛰는 게 맞다). 지금 합치면 두 도구의 오류 정책이 얽힌다.

### 테스트 — `lib/__tests__/stats.test.ts` 확장

| `it()` 제목 | 검증 |
| --- | --- |
| `"parsePairedLists: 줄바꿈 없는 입력은 기존 토크나이저와 같게 읽는다"` | `parsePairedLists("1,2,3","4,5,6")` → `x=[1,2,3]`, `issues=[]` |
| `"parsePairedLists: 가운데 빈 줄을 행으로 세어 issues에 남긴다 (K3 핵심)"` | `"12\n15\n\n18"` / `"3\n4\n5\n6"` → `issues`에 `{row:3, side:"x"}`, `lengths` 4/4 |
| `"parsePairedLists: 양쪽에 빈 줄이 하나씩이면 길이는 같지만 issues가 두 행을 짚는다"` | X 3행 빈 칸, Y 7행 빈 칸 → `lengths.x===lengths.y`인데 `issues.length===2` |
| `"parsePairedLists: 한쪽만 못 읽어도 그 행의 쌍 전체를 버린다"` | `x.length === y.length`가 항상 참 |
| `"parsePairedLists: 앞뒤 빈 줄은 행으로 세지 않는다"` | `"\n12\n15\n\n"` → `lengths.x === 2`, `issues=[]` |
| `"parsePairedLists: 열 길이가 다르면 lengths로 드러난다"` | 3행 vs 4행 |

### 테스트 — `components/__tests__/StatsCalculator.test.tsx` (S5와 같은 커밋)

`fill()` 헬퍼는 `user.paste`를 쓰므로 줄바꿈이 그대로 들어간다 — 그대로 재사용 가능.

| `it()` 제목 | 검증 |
| --- | --- |
| `"상관: 정상 입력이면 r·df·p가 나온다"` | 모드 전환 후 `/r = /` 존재 (**지금은 이것조차 없다**) |
| `"회귀: 정상 입력이면 기울기·절편·R²가 나온다"` | `/R² = /` |
| `"상관: 중간에 빈 줄이 낀 두 열은 계산 대신 어느 행인지 알려준다 (K3 회귀)"` | X `"12\n15\n\n18\n20"`, Y `"3\n4\n5\n6\n7"` → `/3번째 행/`, `/r = /`가 **없음** |
| `"상관: 열 길이가 다르면 각각의 개수를 알려준다"` | `/변수 X는 4개, 변수 Y는 5개/` |
| `"상관 모드에서 낸 오류가 t-검정으로 돌아가면 사라진다"` | `switchMode` 회귀 |
| `"t-검정은 여전히 개수가 달라도 계산된다 (K3가 t-검정을 깨지 않음)"` | A 5개 · B 7개 → `/t = /` 존재. **이게 '기존 t-검정 경로를 안 깨는가'의 직접 증거다** |

---

## L1. RandomSampler — 전수를 표본이라 말하지 않기

### 위치
`components/RandomSampler.tsx:27-35`

```ts
  function draw() {
    setCopied("idle");
    const n = Math.min(Number(count) || 0, items.length);
    if (n <= 0) {
      setPicked([]);
      return;
    }
    setPicked(shuffle(items).slice(0, n));
  }
```

### 변경 후

상태 추가 (`:14` 뒤):

```ts
  // 결과와 함께 보여줄 안내. 뽑기 자체는 막지 않고 사실만 알린다.
  const [notice, setNotice] = useState<string | null>(null);
```

`:22-35` 교체:

```ts
  function invalidatePicked() {
    setPicked(null);
    setCopied("idle");
    setNotice(null);
  }

  function draw() {
    setCopied("idle");
    setNotice(null);
    const requested = Number(count);
    if (!Number.isFinite(requested) || requested <= 0) {
      setPicked([]);
      return;
    }
    // 소수 입력은 slice가 조용히 잘라낸다 — 반올림하고 그 사실을 알린다
    const rounded = Math.round(requested);
    const messages: string[] = [];
    if (rounded !== requested) {
      messages.push(`${requested}명은 ${rounded}명으로 반올림했습니다.`);
    }
    if (rounded === 0) {
      setPicked([]);
      return;
    }
    const n = Math.min(rounded, items.length);
    if (rounded > items.length) {
      // 여기가 L1의 본체 — 조용히 깎으면 전수조사가 무작위 표본처럼 보인다
      messages.push(
        `명단이 ${items.length}명이라 ${items.length}명 전원이 뽑혔습니다. 이건 표본이 아니라 전수입니다 — 보고서에 "무작위 표집"이라고 쓰면 안 됩니다.`,
      );
    }
    if (messages.length > 0) setNotice(messages.join(" "));
    setPicked(shuffle(items).slice(0, n));
  }
```

`:100-122`의 결과 블록 안, `<p className="text-sm text-ink">{picked.join(", ")}</p>` **앞**에 삽입:

```tsx
              {notice && (
                <p className="mb-2 text-xs font-medium text-danger">{notice}</p>
              )}
```

### 함정

1. **`Number("") === 0`이 아니라 `Number("")`는 0이다.** 빈 입력은 `requested = 0`이 되어 `<= 0` 분기로 간다 → 기존 `"뽑을 인원 수를 확인해주세요."` 유지. 기존 동작과 같다. 그런데 `Number(" ")`도 0이다 — 역시 같은 분기. 안전.
2. **`Number("abc")`는 NaN** → `Number.isFinite`가 걸러 `picked=[]`. 기존 코드는 `Number(count) || 0`로 0을 만들었으니 결과가 같다. **동작 동일**.
3. **`type="number"` 입력은 브라우저마다 `"3.7"`을 허용한다.** `min={1}`은 제출 검증일 뿐 값 자체를 막지 않는다. `step={1}` 추가를 권하지만 그것도 강제가 아니므로 반올림 안내가 본선이다.
4. **`notice`를 `danger` 색으로 두는 이유**: 전수를 표본으로 보고하는 것은 조용한 오류가 아니라 방법론 오류다. `ink-soft`로 두면 안 읽힌다.
5. `aria-live="polite"`는 `:101`의 컨테이너에 이미 있다 — `notice`가 그 안에 있어야 낭독된다. **위 삽입 위치가 컨테이너 안쪽인지 확인하라.**

### 테스트 — `components/__tests__/RandomSampler.test.tsx` (파일 존재, 추가)

| `it()` 제목 | 검증 |
| --- | --- |
| `"요청 인원이 명단보다 많으면 전수임을 알린다 (L1 회귀)"` | 3명 명단에 `count=5` → `/전원이 뽑혔습니다/`, `/전수/`, 뽑힌 수 3 |
| `"소수 인원은 반올림하고 그 사실을 알린다"` | `count="3.7"` → `/4명으로 반올림/`, 결과 4명 |
| `"요청 인원이 명단보다 적으면 아무 안내도 없다 (거짓 양성 방지)"` | 10명 명단에 `count=3` → `/전수/` 없음 |
| `"명단을 고치면 이전 안내가 사라진다"` | draw → textarea 수정 → notice 없음 |

`shuffle`은 `Math.random`을 쓰므로 `vi.spyOn(Math, "random").mockReturnValue(0)`로 고정하면 결과가 결정적이 된다. 개수만 검증하면 모킹 불필요 — **개수 검증만 하는 쪽을 권한다** (`shuffle` 구현에 결합하지 않는다).

---

## L6. SampleSizeCalculator — 오차범위 상한

### 위치
`components/SampleSizeCalculator.tsx:11-15, 26-51`

```ts
const UNREALISTIC_N = 100_000;
...
  const e = Number(marginError) / 100;
...
  let result: number | null = null;
  if (e > 0 && p > 0 && p < 1 && !populationInvalid) {
    result = sampleSize(e);
  }
```

실측: `marginError=50` → n=4, `marginError=500` → n=1.

### 변경 후

`:15` 뒤에 추가:

```ts
// 오차범위 상한. 근거: 여론조사 관행에서 ±10%는 이미 "참고용" 수준이고,
// ±20%를 넘으면 "몇 명한테 물어야 하나"에 한 자릿수를 답하게 된다.
// 아래쪽 UNREALISTIC_N과 대칭을 이루는 위쪽 방어선이다.
const MAX_MARGIN_PERCENT = 20;
```

`:26-51` 교체:

```ts
  const z = Z_TABLE[confidence] ?? 1.96;
  const marginPercent = Number(marginError);
  const e = marginPercent / 100;
  const p = Number(proportion) / 100;

  // e가 너무 '작을' 때는 UNREALISTIC_N이 잡지만 너무 '클' 때는 방어가 없었다.
  // 500을 넣으면 "1명에게 물으면 됩니다"가 정답처럼 화면에 뜬다.
  const marginTooLarge =
    Number.isFinite(marginPercent) && marginPercent > MAX_MARGIN_PERCENT;

  const populationRaw = population.trim();
  const populationNumber = Number(populationRaw);
  const populationInvalid =
    populationRaw !== "" &&
    !(Number.isFinite(populationNumber) && populationNumber > 0);
  const N = populationRaw !== "" && !populationInvalid ? populationNumber : null;

  function sampleSize(marginRatio: number) {
    const n0 = (z * z * p * (1 - p)) / (marginRatio * marginRatio);
    return N ? Math.ceil(n0 / (1 + (n0 - 1) / N)) : Math.ceil(n0);
  }

  let result: number | null = null;
  if (e > 0 && p > 0 && p < 1 && !populationInvalid && !marginTooLarge) {
    result = sampleSize(e);
  }
  const realisticAlternative =
    result !== null && result > UNREALISTIC_N ? sampleSize(0.05) : null;
```

`:141-168`의 결과 블록에서 `populationInvalid` 분기 **뒤, `result !== null` 분기 앞**에 삽입:

```tsx
        ) : marginTooLarge ? (
          <p className="text-ink-soft">
            허용 오차범위가 {marginPercent}%입니다. 퍼센트(%)로 입력했는지
            확인해주세요 — {MAX_MARGIN_PERCENT}%를 넘는 오차범위는 조사
            결과에서 읽어낼 수 있는 것이 거의 없습니다. 보통 3~5%를 씁니다.
          </p>
```

즉 `{populationInvalid ? (...) : marginTooLarge ? (...) : result !== null ? (...) : (...)}` 형태.

### 함정

1. **`marginError`가 빈 문자열이면 `Number("") === 0`** → `marginTooLarge = false`, `e = 0` → `result = null` → 기존 `"오차범위와 예상 비율을 확인해주세요."`. 동작 동일.
2. **20%를 상한으로 두면 `marginError=20`은 통과한다** (`>` 이므로). 95%/50%에서 n = ceil(0.9604/0.04) = 25. 한 자릿수가 아니므로 허용해도 무해.
3. **H1(두 집단 평균 비교 모드)이 같은 파일에 온다.** H1은 `sampleSize()`와 별개의 검정력 공식을 추가한다. `marginTooLarge`는 비율 모드 전용 상태이므로, H1이 모드 스위치를 넣을 때 **이 검사가 평균 비교 모드에도 걸리지 않게** 조건에 모드를 추가해야 한다. L6를 지금 넣으면 H1 작업자가 그 갈래를 명시적으로 마주하게 된다 — 오히려 좋다.
4. `Y12`가 정정한 연쇄 수정 대상(`04:9,33,41` + `03:105,108` + `26`)은 **H1의 몫**이고 L6와 무관하다. 섞지 마라.

### 테스트 — `components/__tests__/SampleSizeCalculator.test.tsx` (파일 존재, 추가)

| `it()` 제목 | 검증 |
| --- | --- |
| `"오차범위 500%에 '1명'이라고 답하지 않는다 (L6 회귀)"` | `marginError="500"` → `/1명/` 없음, `/퍼센트\(%\)로 입력했는지/` 존재 |
| `"오차범위 50%도 거부한다"` | `/20%를 넘는/` |
| `"오차범위 20%는 그대로 계산한다 (경계)"` | 숫자 결과가 나옴 |
| `"오차범위 5%의 기존 결과는 그대로다 (회귀)"` | 95%/50%/무한모집단 → `385명` |
| `"오차범위 0.001%는 여전히 아래쪽 경고를 낸다 (대칭 확인)"` | `/현실적으로 모으기 어려운/` |

---

## U3. DisclosureGenerator — 면책 문장을 선택에 맞춰 조립

### 위치
`components/DisclosureGenerator.tsx:88-91`

```ts
  const text =
    !hydrated || selected.length === 0
      ? ""
      : `본 연구는 작성 과정에서 AI 도구${toolName ? `(${toolName})` : ""}를 다음 범위에서 활용하였다: ${selected.join(", ")}. 연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접 검토하고 작성하였다. (작성일: ${today})`;
```

### 변경 후

`:18` 뒤(OPTIONS 정의 다음)에 추가:

```ts
/**
 * 04-research-ethics가 "해서는 안 되는 사용"으로 명시한 항목.
 * 막지는 않는다(사이트 기조가 게이트를 두지 않는 쪽이다) — 대신
 * 면책 문장에서 해당 조항을 빼고, 선택지 옆에 경고를 붙인다.
 */
const CAUTION_KEYS = {
  brainstorm: "핵심 아이디어",
  statInterpret: "분석 결과 해석",
} as const;
```

`:88-91` 교체:

```ts
  // 면책 문장을 선택 내용에 맞춰 조립한다. 예전에는 무엇을 고르든
  // "핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접 작성하였다"를
  // 고정으로 붙여서, 브레인스토밍·결과 해석을 체크한 학생의 문장이 한 문장
  // 안에서 앞뒤로 자기를 부정했다.
  const claimedParts = [
    !usedAtLevel("brainstorm") && "연구의 핵심 아이디어",
    !usedAtLevel("statInterpret") && "분석 결과 해석",
    "최종 결론",
  ].filter((v): v is string => typeof v === "string");

  const disclaimer =
    claimedParts.length === 1
      ? `${claimedParts[0]}은 저자가 직접 검토하고 작성하였다.`
      : `${claimedParts.join(", ")}은 저자가 직접 검토하고 작성하였다.`;

  const text =
    !hydrated || selected.length === 0
      ? ""
      : `본 연구는 작성 과정에서 AI 도구${toolName ? `(${toolName})` : ""}를 다음 범위에서 활용하였다: ${selected.join(", ")}. ${disclaimer} (작성일: ${today})`;
```

`:84` 뒤에 헬퍼:

```ts
  function usedAtLevel(key: keyof typeof CAUTION_KEYS): boolean {
    const lv = usage[key];
    return lv === "light" || lv === "heavy";
  }
```

`:136-159`의 `OPTIONS.map` 안, `</div>` 직전에 경고를 삽입:

```tsx
            {opt.key in CAUTION_KEYS &&
              usedAtLevel(opt.key as keyof typeof CAUTION_KEYS) && (
                <p className="mt-1.5 text-xs leading-relaxed text-danger">
                  이 항목은{" "}
                  <a
                    href="/articles/research-ethics"
                    className="underline underline-offset-2"
                  >
                    연구윤리와 AI 활용
                  </a>
                  에서 &lsquo;해서는 안 되는 사용&rsquo;으로 정리한 것입니다.
                  체크해도 문구는 만들어지지만, 아래 문장에서 &lsquo;
                  {CAUTION_KEYS[opt.key as keyof typeof CAUTION_KEYS]}은 저자가
                  직접 작성하였다&rsquo;는 부분이 빠집니다.
                </p>
              )}
```

### 함정

1. **`claimedParts`가 `["최종 결론"]` 하나만 남는 경우** — 문장이 "최종 결론은 저자가 직접 검토하고 작성하였다."가 된다. 문법상 자연스럽다. 위 삼항은 사실상 같은 결과라 없애도 되지만, 나중에 조사(은/는) 처리를 넣을 자리로 남긴다. **구현 시 판단 필요**: `"결론"`으로 끝나면 `"은"`, 받침 없는 단어면 `"는"` — 현재 후보 셋이 전부 받침이 있으므로(아이디어**어**는 받침 없음!) 실은 `"아이디어는"`이 맞다. `lib/korean.ts`에 조사 처리가 있는지 확인하고 있으면 그걸 써라. **지금 문장은 `"..., 최종 결론은"`으로 항상 끝나므로 조사 문제가 발생하지 않는다** — 순서를 바꾸지 마라.
2. **`opt.key in CAUTION_KEYS`의 타입 좁히기가 TS에서 안 된다.** `as` 캐스트가 두 번 나오는 게 그 때문. 깔끔하게 하려면 `CAUTION_KEYS`를 `Map`이나 `Record<string, string>`으로 두고 `CAUTION_KEYS[opt.key]`가 `string | undefined`가 되게 하는 편이 낫다. **그 쪽을 권한다:**
   ```ts
   const CAUTION_KEYS: Record<string, string> = { brainstorm: "핵심 아이디어", statInterpret: "분석 결과 해석" };
   ```
   `usedAtLevel(key: string)`으로 완화.
3. **`usage[key]`가 `"none"`이거나 `undefined`면 면책 조항이 남는다** — 의도대로. `OPTIONS`에 새 항목을 추가하는 사람이 `CAUTION_KEYS`를 잊으면 조용히 예전 동작으로 돌아간다. `OPTIONS` 정의 바로 아래에 `CAUTION_KEYS`를 두는 이유다.
4. **U4가 이 도구를 가리키는 링크를 고친다.** 같은 커밋에 넣어라 — 도구와 그 도구를 가리키는 문장이 한 번에 정합해진다.

### 테스트 — `components/__tests__/DisclosureGenerator.test.tsx` (신설)

| `it()` 제목 | 검증 |
| --- | --- |
| `"경미한 문법 교정만 고르면 면책 문장이 온전히 나온다"` | `/연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접/` |
| `"브레인스토밍을 고르면 '핵심 아이디어' 조항이 빠진다 (U3 회귀)"` | `/핵심 아이디어/`가 생성 문구 안에 **없음**, `/분석 결과 해석, 최종 결론은/` 존재 |
| `"결과 해석 보조를 고르면 '분석 결과 해석' 조항이 빠진다"` | 대칭 |
| `"둘 다 고르면 '최종 결론'만 남는다"` | `/최종 결론은 저자가 직접 검토하고 작성하였다\./` |
| `"주의 항목을 고르면 윤리 문서 링크가 있는 경고가 뜬다"` | `getByRole("link", { name: /연구윤리/ })`의 `href === "/articles/research-ethics"` |
| `"'없음'을 고르면 경고가 사라진다"` | 거짓 양성 방지 |

주의: `today`가 `new Date()`라 스냅샷 비교 금지 — 정규식으로만 검증.

---

## Y3(코드 부분). `r2 = r * r`

### 위치
`lib/stats.ts:214-216`

```ts
  const { r, df, t, p } = corr;
  const r2 = r * r;
  return { slope, intercept, r2, t, df, p };
```

### 판정: **코드는 고치지 않는다.**

절편이 있는 최소제곱 회귀의 표본 내 R²는 `r²`와 수학적으로 동일하다. `r*r`은 **맞는 코드**다. 문제는 사례 제목이 검정셋 R²를 말하면서 사이트 도구로 재현 불가능하다는 **설명의 부재**이지 계산 오류가 아니다.

바꿀 것은 **주석 한 줄과 UI 한 줄**뿐이다.

`lib/stats.ts:183-188`의 JSDoc에 추가:

```ts
/**
 * 단순선형회귀: y = slope * x + intercept.
 * 결정계수(r²)는 pearsonCorrelation의 r을 제곱해 구하고, 기울기의 유의성
 * 검정(t, df, p)도 상관계수의 t-검정과 동일한 통계량을 공유한다(단순회귀에서는
 * 기울기 검정과 상관계수 검정의 t값이 수학적으로 같다).
 *
 * 이 R²는 **표본 내(in-sample)** 값이라 원리적으로 0 이상이다. Orange의
 * Test & Score처럼 검정셋·교차검증으로 평가한 R²는 음수가 될 수 있는데,
 * 그건 다른 양이다 — 이 함수로는 재현되지 않는다. (사례
 * `02-eeg-binaural`이 음수 R²를 보고하는 근거가 이것이다.)
 */
```

`components/StatsCalculator.tsx`의 회귀 결과 블록(`:369-396`), `<CaveatBlock />` 바로 위에 삽입:

```tsx
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              여기 R²는 지금 넣은 데이터 안에서 계산한 값이라 항상 0 이상입니다.
              분석 도구에서 R²가 음수로 나왔다면 검정셋이나 교차검증으로 평가한
              값이며, 이 계산기는 그 방식이 아닙니다.
            </p>
```

### 함정

- **`r2 = r * r`을 "고쳐서" 조정된 R²나 검정셋 R²로 바꾸면 안 된다.** 이 계산기에는 검정셋이 없다. 조정 R²(adjusted)는 또 다른 양이라 사례의 음수를 재현하지도 않으면서 03-statistics의 "몇 % 설명하는가" 정의만 깬다.
- 이 UI 문구는 **회귀 모드에서만** 나와야 한다. 상관 모드 결과 블록(`ttestResult` 쪽)에 넣지 마라.

### 테스트 — `lib/__tests__/stats.test.ts`

| `it()` 제목 | 검증 |
| --- | --- |
| `"simpleLinearRegression의 R²는 어떤 데이터에서도 0 이상이다 (Y3 근거)"` | 잡음이 큰 몇 세트에 대해 `r2 >= 0` |
| `"R²는 pearsonCorrelation의 r을 제곱한 값과 같다"` | `toBeCloseTo(r*r, 10)` |

`components/__tests__/StatsCalculator.test.tsx`:

| `it()` 제목 | 검증 |
| --- | --- |
| `"회귀 결과에 표본 내 R²임을 밝히는 안내가 붙는다"` | `/이 계산기는 그 방식이 아닙니다/` |
| `"t-검정·상관 결과에는 그 안내가 없다 (거짓 양성 방지)"` | |

---

## S1. CI

### 신설 `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

### `package.json` — `scripts`에 추가

```json
    "typecheck": "tsc --noEmit",
```

### 함정

1. **`tsc --noEmit`은 지금 처음 도는 명령이다.** 넣기 전에 로컬에서 반드시 한 번 돌려라 — 기존 에러가 쌓여 있으면 첫 커밋부터 CI가 빨갛다. `tsconfig.tsbuildinfo`가 저장소에 커밋돼 있는데(`git status`에서 확인됨) `--noEmit`과 `incremental`이 섞이면 TS7 이후 경고가 난다. **`.gitignore`에 `tsconfig.tsbuildinfo`를 추가하는 것을 같은 커밋에 넣어라.**
2. **`npm run lint`가 `eslint` 인자 없이 실행된다.** eslint 9 flat config에서는 인자 없이도 `eslint.config.mjs`의 대상 전체를 돈다. CI에서 exit code가 0인지 로컬 선확인.
3. **`npm ci`는 `package-lock.json`과 `package.json`이 어긋나면 실패한다.** 저장소에 lock이 있으므로 정상.
4. **묶음 0을 시작하기 전에 이 커밋을 먼저 넣어라.** 아니면 K1·K2·K3의 테스트가 로컬에서만 돈다.

### 검증
`.github/workflows/ci.yml`을 넣은 뒤 아무 브랜치를 push해 초록을 확인한 다음에야 나머지 커밋을 올린다. **"CI를 넣었다"와 "CI가 돈다"는 다르다.**

---

## S2. 저장 실패 모킹 공용 헬퍼

### 신설 `lib/__tests__/_storage.ts`

```ts
import { vi } from "vitest";

export type MockStorage = {
  store: Map<string, string>;
  /** 실제 setItem 호출 횟수(실패 포함) */
  setCalls: number;
};

type Options = {
  /** n번째(1-based) setItem부터 throw한다. 0이면 항상 성공 */
  failSetFrom?: number;
  /** getItem이 무조건 throw (프라이빗 모드 시뮬레이션) */
  failGet?: boolean;
  /** 초기 내용 */
  seed?: Record<string, string>;
};

/**
 * localStorage 실패를 흉내 내는 공용 모의 저장소.
 *
 * 왜 공용인가 — K1(백업 복원)과 K2(레퍼런스 저장)가 통과한 이유가 정확히
 * "저장 실패를 거는 테스트가 각 경로마다 따로 필요한데 아무도 안 썼다"이다.
 * 헬퍼가 있으면 새 저장 경로를 만든 사람이 한 줄로 같은 검사를 붙일 수 있다.
 *
 * jsdom 환경에서는 window.localStorage를 defineProperty로 갈아끼운다
 * (vi.stubGlobal("window", …)는 render를 죽인다).
 */
export function installMockStorage(options: Options = {}): MockStorage {
  const { failSetFrom = 0, failGet = false, seed = {} } = options;
  const store = new Map<string, string>(Object.entries(seed));
  const state: MockStorage = { store, setCalls: 0 };

  const impl: Storage = {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      if (failGet) throw new DOMException("blocked", "SecurityError");
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      state.setCalls += 1;
      if (failSetFrom > 0 && state.setCalls >= failSetFrom) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };

  if (typeof window === "undefined") {
    vi.stubGlobal("window", { localStorage: impl });
  } else {
    Object.defineProperty(window, "localStorage", {
      value: impl,
      configurable: true,
      writable: true,
    });
  }
  return state;
}

export function restoreStorage() {
  vi.unstubAllGlobals();
}
```

### 적용 대상 (백로그가 지정한 3개 모듈)

| 파일 | 추가할 `it()` |
| --- | --- |
| `lib/__tests__/citations.test.ts` | K2의 4건 (위 참조) |
| `lib/__tests__/checklist.test.ts` | `"writeChecklist는 setItem이 throw해도 예외를 밖으로 내지 않는다"` / `"저장 실패 여부가 호출부에 전달되는가"` — **여기는 구현 시 판단 필요**: `writeChecklist`의 현재 시그니처가 `void`라 실패를 알릴 통로가 없다. 시그니처를 바꾸는 것은 C4의 범위다. **지금은 "예외를 던지지 않는다"만 걸고, 실패가 조용하다는 사실을 `it.todo("저장 실패를 화면에 알린다 — C4")`로 남겨라.** todo는 CI를 빨갛게 하지 않으면서 부채를 코드에 못 박는다. |
| `lib/__tests__/activity.test.ts` | `"logActivity는 setItem이 throw해도 예외를 밖으로 내지 않는다"` + `it.todo` 동형 |

### 함정
- **`installMockStorage`를 부른 테스트는 반드시 `afterEach(restoreStorage)`를 걸어야 한다.** jsdom 환경에서 `defineProperty`로 덮은 것은 `unstubAllGlobals`가 안 되돌린다 — `restoreStorage`에 원본 저장 후 복원 로직을 넣거나, 각 테스트 파일이 `beforeEach`에서 항상 새로 설치하게 한다. **후자를 권한다** (덜 복잡하고, 파일 간 누수가 원래 없다).
- `citations.test.ts:63-83`의 기존 인라인 모킹은 **헬퍼로 갈아끼워라.** 두 방식이 공존하면 헬퍼의 존재 이유가 사라진다.

---

## S3. 파괴적 3종 테스트

`PlanBackup`은 K1에서 다뤘다. 나머지 둘:

### `components/__tests__/DataReset.test.tsx` (신설)

| `it()` 제목 | 검증 |
| --- | --- |
| `"확인을 취소하면 아무것도 지우지 않는다"` | `confirm` → false. store 내용 불변, `reload` 미호출 |
| `"research-guide: 접두사 키만 지운다"` | `other:key`가 남아 있음 |
| `"테마 키는 남긴다"` | `research-guide:theme` 존재 |
| `"localStorage 접근이 막혀도 예외를 던지지 않고 새로고침한다"` | `failGet: true` |
| `"삭제 후 새로고침한다"` | `reload` 스파이 호출됨 |

`window.location.reload` 스파이: jsdom에서 `location`은 read-only다. `Object.defineProperty(window, "location", { value: { reload: vi.fn() }, configurable: true })` 또는 `vi.spyOn(window.location, "reload")`. **jsdom 30에서는 후자가 동작하지 않을 수 있다** — `defineProperty` 쪽을 기본으로 쓰고, 안 되면 `DataReset`이 `reload`를 주입받도록 하는 건 프로덕션 코드를 테스트를 위해 바꾸는 것이므로 **하지 마라.** 정 안 되면 그 한 건만 `it.skip`하고 이유를 주석에 남겨라.

### `components/__tests__/PlanExport.test.tsx` (신설)

`buildMarkdown`은 모듈 내부 함수라 export되지 않는다. 두 선택지:
- (a) `buildMarkdown`을 export한다 → 순수 함수 단위 테스트, 훨씬 간단
- (b) `URL.createObjectURL`을 스텁해 Blob 내용을 읽는다

**(a)를 권한다.** 이 함수는 부수효과가 없고, 테스트 대상이 정확히 이 문자열 조립이다.

`components/PlanExport.tsx:21`을 `export function buildMarkdown(...)`으로 바꾸고:

| `it()` 제목 | 검증 |
| --- | --- |
| `"체크된 항목은 [x], 안 된 항목은 [ ]로 나온다"` | |
| `"체크리스트가 비어 있는 단계는 '**체크리스트**' 머리를 만들지 않는다 (경계)"` | |
| `"reflection이 공백만이면 '내 생각' 절을 만들지 않는다"` | `readLocal`이 `"   "` |
| `"localStorage가 막혀도 빈 노트를 만들어 낸다 (실패)"` | `failGet: true` → 예외 없음, 제목 줄 존재 |
| `"내보낸 날짜는 UTC가 아니라 로컬 날짜다"` | `toLocalDateKey(new Date())`와 일치 |

---

## S5. 상관·회귀 계산 테스트

K3 항목에 표로 이미 설계했다. **순서가 중요하다:**

1. **먼저** `"상관: 중간에 빈 줄이 낀 두 열은 계산 대신 어느 행인지 알려준다 (K3 회귀)"`를 쓴다.
2. 돌린다 → **실패한다** (지금은 `r = ...`이 나온다). 이 실패 출력을 커밋 메시지에 인용한다.
3. 그다음 K3 수정을 넣는다.

백로그가 이 순서를 명시한 이유는 "테스트가 실제로 그 버그를 잡는지"를 증명하기 위해서다. 순서를 뒤집으면 통과하는 테스트를 쓴 것일 뿐이다.

---

# 파트 2 — 콘텐츠 수정 10건 (정확한 before/after)

> 줄 번호는 전부 실측했다. **X2·X3·X5에서 백로그 줄 번호 오류를 발견했다.**

---

## U1 — `content/articles/03-statistics.mdx:103`

**before** (전문, 한 줄):
```
> 백색소음 집단(M = 12.4, SD = 3.1, n = 16)과 조용한 환경 집단(M = 15.1, SD = 2.8, n = 16)의 단어 회상 점수를 비교한 결과, 두 집단의 차이는 통계적으로 유의했다, t(30) = 2.71, p = .011, d = 0.91.
```

**after**:
```
> 백색소음 집단(M = 16.9, SD = 2.4, n = 16)과 조용한 환경 집단(M = 14.5, SD = 2.6, n = 16)의 단어 회상 점수를 비교한 결과, 두 집단의 차이는 통계적으로 유의했다, t(30) = 2.71, p = .011, d = 0.96.
```

**검산** (본 저장소 알고리즘으로 재계산): t = 2.71312, df = 29.8098, p = 0.010963, d = 0.95923. 표기값과 전부 일치.

**편집상 부작용 — 반드시 확인할 것.** 이 수정으로 03-statistics의 백색소음 집단이 "더 낮음"에서 "더 높음"으로 방향이 뒤집힌다. 같은 파일 안이나 03을 인용한 다른 글에 "백색소음이 더 낮았다"류 서술이 없는지 `grep -rn "백색소음" content/`로 확인하라. `29-negative-results`는 12.4 vs 12.9(유의하지 않음)를 계속 쓰므로 충돌하지 않는다 — 오히려 "유의한 예시 = 16.9/14.5", "유의하지 않은 예시 = 12.4/12.9"로 사이트 전체가 깔끔하게 갈린다.

---

## U2 — `content/articles/26-small-sample.mdx:48` (문장 단위 교체)

**before** (해당 줄의 마지막 문장만):
```
그리고 그 결과로 "본 연구에는 집단당 몇 명이 필요하다"는 추정을 내놓으면, 그것이 이 연구의 결론이 됩니다.
```

**after**:
```
다만 여기서 한 발 더 나가면 안 됩니다. 예비 연구에서 관측한 효과크기로 "본 연구에는 집단당 몇 명이 필요하다"를 계산하는 것은 널리 지적받는 실수입니다 — 바로 위에서 말한 그 불안정한 추정치가 그대로 표본 수로 전파돼, 본 연구가 체계적으로 작게 설계됩니다. 표본 수의 근거는 선행연구가 보고한 효과크기나, "이 정도 차이는 나야 의미가 있다"고 스스로 정한 값에서 가져오세요. 예비 연구의 결론은 숫자가 아니라 절차입니다 — 무엇이 굴러갔고, 어디서 막혔고, 본 연구에서는 무엇을 어떻게 고칠 것인가. 그것이 이 연구의 결론이 됩니다.
```

---

## U3(본문 몫 없음) / U4 — `content/articles/04-research-ethics.mdx:61`

**before** (전문):
```
[3단계: 방법론 설계](/guide/methodology)에 이 문장을 만들어주는 도구가 있습니다.
```

**after**:
```
[6단계: 투고와 발표](/guide/submission#tool-ai-disclosure)에 이 문장을 만들어주는 도구가 있습니다.
```

**앵커 검증 완료**: `lib/stageToolMeta.ts:44`가 `"AI 활용 disclosure 문구 만들기"`를 `submission` 그룹에 두고, `:116`이 그 제목을 `"ai-disclosure"`로 매핑하며, `components/StageTools.tsx:158`이 `id={`tool-${TOOL_IDS[title]}`}`를 붙인다 → `#tool-ai-disclosure` 실제 존재.

**단계 제목 확인 필요**: `"6단계: 투고와 발표"`가 `content/guide/06-submission.mdx`의 frontmatter title과 일치하는지 확인하고, 다르면 그쪽 표기를 따라라. `05-writing.mdx:90`·`06-submission.mdx:12,50`이 이미 쓰는 표기를 그대로 복사하는 것이 가장 안전하다.

---

## X1 — `content/articles/29-negative-results.mdx` 두 곳

**:64 before**:
```
> 백색소음 집단의 평균 회상 점수는 12.4개(SD 3.1), 무소음 집단은 12.9개(SD 2.8)였다. 두 집단의 차이는 0.5개로 통계적으로 유의하지 않았다(p = .58).
```
**:64 after**:
```
> 백색소음 집단의 평균 회상 점수는 12.4개(SD 3.1), 무소음 집단은 12.9개(SD 2.8)였다. 두 집단의 차이는 0.5개로 통계적으로 유의하지 않았다(p = .63).
```

**:101 before**:
```
> 백색소음 집단(n = 17)의 평균 회상 점수는 12.4개(SD 3.1), 무소음 집단(n = 17)은 12.9개(SD 2.8)였다. 두 집단의 평균 차이는 0.5개였으며, 독립표본 t 검정 결과 유의하지 않았다(t(32) = 0.49, p = .58). 효과 크기는 d = 0.17로 작았다. 사전에 정한 제외 기준(과제 도중 이탈, 응답 누락)에 해당하는 참여자는 없었으며, 수집된 34명의 자료를 모두 분석에 사용하였다.
```
**:101 after**: 같은 문장에서 `p = .58` → `p = .63`만 교체.

**검산**: t = 0.493511, df = 31.674, p = 0.625056 → APA 두 자리로 `.63`. d = 0.16927 → `0.17` ✓.

---

## X2 — `content/showcase/03-sex-difference-adr.mdx:30, :36` (**백로그 줄 번호 오류: `:109`가 아니라 `:30`·`:36`**)

**검산 결과**: 보고된 평균차 −49,347.25 (= 96,674.58 − 146,021.83, 내부적으로 일치). CI 중심 = (−90,474.58 + −8,466.352)/2 = **−49,470.466**. 차이 **123.216**. 한 끝점만의 오타로도 설명되지 않는다(평균차를 중심으로 삼으면 다른 끝점이 −90,228.15 또는 −8,219.92여야 하고, 둘 다 보고값과 250~ 어긋난다). **복구 불가 → 백로그의 두 번째 지침(CI 삭제)을 택한다.**

**:30 before**:
```
**유의수준을 미리 정하고 검정했습니다.** 유의수준은 5%로 설정했고, R로 t-검정을 수행했습니다. 결과는 t 통계량 -2.5416, p값 0.02173, 95% 신뢰구간 -90,474.58에서 -8,466.352였습니다. 공개 데이터에서 주제를 잡는 방법은 [공개 데이터로 주제 잡기](/articles/public-data-topics)에 따로 정리되어 있습니다.
```
**:30 after**:
```
**유의수준을 미리 정하고 검정했습니다.** 유의수준은 5%로 설정했고, R로 t-검정을 수행했습니다. 결과는 t 통계량 -2.5416, p값 0.02173이었습니다. 보고서에는 95% 신뢰구간도 적혀 있었지만, 구간의 중심이 보고된 평균 차이와 약 123건 어긋나 원본 출력을 다시 확인할 수 없어 여기서는 싣지 않았습니다. 공개 데이터에서 주제를 잡는 방법은 [공개 데이터로 주제 잡기](/articles/public-data-topics)에 따로 정리되어 있습니다.
```

**:36 before**:
```
여기서 이 탐구가 한 번 더 잘한 것이 있습니다. p값만 보고 끝내지 않고 신뢰구간을 함께 읽었습니다. 95% 신뢰구간이 -90,474.58에서 -8,466.352이므로 구간 전체가 음수 영역에 있고 0을 포함하지 않습니다. 그래서 차이의 방향이 확실하며, 가장 적게 잡아도 약 8,466건, 가장 크게 잡으면 약 90,474건의 차이가 있다고 읽었습니다. p값과 신뢰구간을 함께 보고하는 습관은 [통계 검정 고르고 읽기](/articles/statistics)에서 다루는 내용 그대로입니다.
```
**:36 after**:
```
여기서 이 탐구가 한 번 더 한 일이 있습니다. p값만 보고 끝내지 않고 신뢰구간까지 함께 읽었습니다. "유의하다"에서 멈추지 않고 차이가 어느 범위에 있는지를 물은 것인데, 방향 자체는 [통계 검정 고르고 읽기](/articles/statistics)에서 권하는 그대로입니다. 다만 보고서에 적힌 구간의 중심이 보고된 평균 차이와 맞지 않아, 이 사례에서는 그 숫자를 그대로 옮기지 않았습니다. 신뢰구간을 보고할 때는 구간의 한가운데가 평균 차이와 같은지를 먼저 확인하세요 — 어긋나면 계산이나 옮겨 적기 어딘가가 틀린 것입니다.
```

---

## X3 — `content/showcase/03-sex-difference-adr.mdx:22, :26, :40` + 「이어서 한다면」 (**백로그의 `:95 :99 :113`은 전부 오류. 이 파일은 56줄이다**)

**:22 before**:
```
이 탐구가 교과서적으로 잘한 부분이 이 단계입니다.
```
**:22 after**:
```
이 단계에서 이 탐구가 지킨 순서가 있습니다.
```

**:26 before**:
```
**변인을 명시했습니다.** 독립변인은 성별, 종속변인은 부작용 보고 빈도입니다. 통제군은 남성, 처치군은 여성으로 두었습니다.
```
**:26 after**:
```
**변인을 명시했습니다.** 독립변인은 성별, 종속변인은 부작용 보고 빈도입니다. 비교 집단은 남성 보고 건수와 여성 보고 건수입니다 — 배정된 처치가 아니라 관찰된 집단이므로 처치군·통제군이라는 말은 쓰지 않습니다. 이 구분은 [대조군을 잘못 잡는 다섯 가지](/articles/control-group-mistakes)에 정리되어 있습니다.
```

**:40 before**:
```
실험을 하지 않는 연구에서 가장 어려운 일은 데이터를 얻는 것이 아니라 데이터가 무엇을 말하는지 정확히 정하는 것입니다. 이 탐구는 12년치라는 긴 기간과 일관된 방향, 그리고 두 개의 통계량으로 결론을 뒷받침했습니다. 고등학생이 혼자 할 수 있는 범위에서 상당히 단단한 구성입니다.
```
**:40 after**:
```
실험을 하지 않는 연구에서 가장 어려운 일은 데이터를 얻는 것이 아니라 데이터가 무엇을 말하는지 정확히 정하는 것입니다. 이 탐구는 12년치라는 긴 기간과 일관된 방향으로 결론을 뒷받침했습니다. 다만 검정 자체에는 문제가 있습니다 — 남성과 여성의 연도별 건수는 같은 해, 같은 보고 체계에서 나온 짝지어진 값이고 강한 연도 추세를 공유하는데, 독립표본 t-검정은 두 계열이 서로 무관하다고 가정합니다. [3단계: 방법론 설계](/guide/methodology)의 검정 선택표대로라면 최소한 대응표본 t-검정이어야 합니다. 이 사례에서 그대로 배울 것은 검정의 선택이 아니라 가설·변인·유의수준을 데이터보다 먼저 확정한 순서입니다.
```

**「이어서 한다면」(`:44` 이하 목록)에 항목 1개 추가** — 기존 목록 형식(`- **…**`)을 따라 맨 앞에 넣는다:
```
- **검정을 다시 고르세요.** 같은 해의 남·녀 건수는 짝지어진 자료이므로 대응표본 t-검정이 맞습니다. 연도 추세가 크면 건수 자체가 아니라 연도별 여성 비율을 종속변수로 두고 추세를 보는 편이 더 정확합니다.
```

**링크 검증 필요**: `/articles/control-group-mistakes`가 실제 slug인지 확인하라(`content/articles/25-control-group-mistakes.mdx`의 frontmatter `slug`). S4가 들어오면 자동 검증되지만 아직 없다.

---

## X4 — `content/showcase/04-aria-deep-learning.mdx:45` 뒤에 편집자 주 삽입 (줄 번호 백로그와 일치 ✓)

**:45 현재**:
```
지표 하나를 성적표처럼 받아들이지 않고, 그 지표가 이 데이터에서 무엇을 의미하는지 되물은 것입니다. [통계 검정 고르고 읽기](/articles/statistics)에서 말하는 태도가 이것입니다.
```
**:45 after** (같은 줄 교체 + 다음 문단 신설):
```
지표 하나를 성적표처럼 받아들이지 않고, 그 지표가 이 데이터에서 무엇을 의미하는지 되물었습니다. 되묻는 방향은 [통계 검정 고르고 읽기](/articles/statistics)가 말하는 그대로입니다. 다만 되물어야 할 지표를 잘못 골랐습니다.

> **편집자 주.** 클래스가 한쪽으로 쏠린 데이터에서 손실이 낮게 나오는 것은 모델이 병변을 찾고 있다는 증거가 아닙니다 — 오히려 다수 클래스(정상) 쪽으로 전부 찍는 모델의 전형적인 모습입니다. 손실은 "확률이 정답 쪽에 가까운가"만 보므로, 대다수가 정상인 데이터에서 전부 정상이라고 낮은 확신으로 답해도 손실은 낮게 유지됩니다. 게다가 훈련 손실 0.7330이 테스트 손실 0.1566보다 크면서 정확도는 0.7259에서 0.4342로 떨어지는 조합은 보통 임계값 설정이나 평가 코드 쪽을 먼저 의심하게 만듭니다. 불균형 데이터에서 되물어야 할 지표는 손실이 아니라 혼동행렬과 거기서 나오는 민감도·특이도, 그리고 PR 곡선 아래 면적입니다. 이 팀은 바로 다음 절에서 민감도 90%·특이도 75%라는 임상 기준을 인용하는데, 정작 자기 모델의 민감도·특이도는 한 번도 보고하지 않았습니다. 되묻는 태도는 옳았고, 되물어야 할 지표를 잘못 고른 것입니다.
```

---

## X5 — `content/showcase/01-lysozyme-charge-aggregation.mdx:43` 뒤 콜아웃 (**백로그의 `:27`은 오류 — 응집 유도 문장은 `:41`이다. `:43`·`:51`·`:66`은 정확**)

**:43 현재** (전문):
```
보고서의 해석은 이렇습니다. 라이소자임은 등전점이 높은 염기성 단백질이라 원래 순양전하를 띱니다. B군은 Arg의 양전하가 줄어 순전하가 감소하고 반발력이 약해져, 변성 과정에서 드러난 소수성 부위끼리 붙기 쉬워집니다. 반대로 C군은 음전하 잔기가 중성화되면서 이미 우세하던 양전하가 더 강해져 반발력이 커지고 응집이 지연됩니다. Bradford 결과도 이와 어긋나지 않았습니다 — B군만 A·C군보다 약 25% 낮았고, C군은 A군과 거의 같았습니다.
```

**변경**: `:43`은 그대로 두고, 바로 뒤(`:44` 빈 줄 다음)에 새 문단을 삽입한다. **데이터는 건드리지 않는다.**

```
> **편집자 주 — C군 해석은 열려 있습니다.** 응집은 모든 시료를 pH 2로 맞춘 뒤 유도했습니다(위 방법 참고). 그런데 Asp의 곁사슬 pKa는 약 3.65, Glu는 약 4.25라, pH 2에서는 두 잔기 모두 97% 이상 이미 양성자화되어 중성입니다. 즉 응집이 시작되는 시점에는 A군의 카복실기도 사실상 전하를 잃은 상태이므로, A군과 C군의 순전하 차이는 이 해석이 전제하는 만큼 크지 않을 수 있습니다. 그렇다면 65.4% 대 43.8%라는 차이는 전하 말고 다른 데서 왔을 가능성이 남습니다 — 에탄올아민 아마이드화로 바뀐 표면 소수성, 완충액 조성(MES 대 PBS)이나 이온강도의 차이, 아세톤 침전 뒤 남은 미량 시약 같은 후보가 있습니다. 흥미로운 것은, 이 팀이 임시 C군을 기각할 때 쓴 논리("어차피 마지막에 pH를 2로 맞추면 대조군과 구별되지 않을 수 있다")가 최종 C군의 전하 해석에도 그대로 적용된다는 점입니다. 아래 「다음 사람에게」의 세 번째 항목이 가르치는 교훈이 바로 이것이고, 그 교훈은 자기 자신에게도 적용됩니다.
```

---

## X6 — `content/articles/16-scholar-alerts.mdx:45`

**before** (전문):
```
- **제목·저자로 범위를 좁힌다.** Scholar는 `title:` 와 `author:` 같은 연산자를 지원합니다. `title:` 를 쓰면 본문 어딘가에 단어가 스친 논문이 사라져 알림 수가 크게 줍니다.
```

**after**:
```
- **제목·저자로 범위를 좁힌다.** Scholar에서 제목을 한정하는 연산자는 `intitle:`(한 단어)과 `allintitle:`(뒤따르는 모든 단어)입니다. `title:`은 연산자가 아니라 그냥 단어로 처리되므로 아무것도 좁혀지지 않습니다. `intitle:백색소음`처럼 쓰면 본문 어딘가에 단어가 스친 논문이 사라져 알림 수가 크게 줍니다. 저자는 `author:`가 맞습니다.
```

---

## Y1 — `content/articles/30-limitations.mdx:49`

**before** (전문):
```
> 본 연구의 참여자는 한 학교의 2학년 34명으로, 무작위 표집이 아닌 편의 표집으로 모집되었다. 따라서 본 결과를 같은 학년 전체나 다른 지역의 학생에게 일반화할 수 없으며, 학교 특성이 결과에 영향을 주었을 가능성을 배제하기 어렵다. 이를 일부 보완하기 위해 두 집단의 사전 성취도를 비교해 차이가 없음을 확인하였으나(부록 A), 학교 간 차이는 본 설계로 확인할 수 없었다.
```

**after**:
```
> 본 연구의 참여자는 한 학교의 2학년 34명으로, 무작위 표집이 아닌 편의 표집으로 모집되었다. 따라서 본 결과를 같은 학년 전체나 다른 지역의 학생에게 일반화할 수 없으며, 학교 특성이 결과에 영향을 주었을 가능성을 배제하기 어렵다. 이를 일부 보완하기 위해 두 집단의 사전 성취도를 비교하였으며 통계적으로 유의한 차이는 나타나지 않았으나(부록 A), 이는 두 집단이 동일함을 확인한 것은 아니다. 학교 간 차이는 본 설계로 확인할 수 없었다.
```

---

## Y2 — `content/guide/05-writing.mdx:102` (표기를 '재현연구'로 통일)

**before** (전문, 한 줄):
```
**재현 가능**(reproducible)은 절차에 관한 말입니다 — 다른 사람이 내 방법 서술만 보고 같은 절차를 그대로 수행할 수 있는가. 참여자 수, 장비 설정, 단어 목록, 시간, 분석 방법이 빠짐없이 적혀 있으면 재현 가능한 논문입니다. **반복 가능**(replicable)은 결과에 관한 말입니다 — 그 절차를 다시 수행했을 때 같은 방향의 결과가 나오는가. 재현 가능성은 내가 글로 보장할 수 있지만, 반복 가능성은 다른 연구가 해봐야 압니다. 그래서 논문에서는 "재현 가능하도록 방법을 썼다"고 말하고, 논의에서 "반복 연구가 필요하다"고 제안하는 것이 정확한 표현입니다.
```

**after**:
```
**재현 가능**(reproducible)은 절차에 관한 말입니다 — 다른 사람이 내 방법 서술만 보고 같은 절차를 그대로 수행할 수 있는가. 참여자 수, 장비 설정, 단어 목록, 시간, 분석 방법이 빠짐없이 적혀 있으면 재현 가능한 논문입니다. **반복 가능**(replicable)은 결과에 관한 말입니다 — 그 절차를 다시 수행했을 때 같은 방향의 결과가 나오는가. 재현 가능성은 내가 글로 보장할 수 있지만, 반복 가능성은 다른 연구가 해봐야 압니다. 그래서 논문에서는 "재현 가능하도록 방법을 썼다"고 씁니다. 한편 남이 한 연구를 다시 수행하는 연구 자체는 국내에서 보통 **재현연구**라고 부르므로(영어로는 replication study), 논의에서는 "재현연구가 필요하다"고 쓰면 됩니다 — 위의 '반복 가능'은 그 재현연구가 확인하려는 성질을 가리키는 말입니다. 이 두 층을 헷갈리지 않는 것이 핵심이고, 재현연구를 직접 해보는 방법은 [재현도 훌륭한 연구다](/articles/replication-is-research)에 있습니다.
```

**`22-replication-is-research.mdx:28`은 그대로 둔다** — 그 글의 표기('재현 연구')가 이제 정본이다. 다만 `:28`의 링크가 `/guide/writing`의 절 제목 `'재현 가능과 반복 가능은 다르다'`를 인용하는데 제목은 안 바꿨으므로 유효하다.

**M10 후속**: 표기 규칙 문서를 만들 때 이 쌍(재현연구 = replication study / 재현 가능 = reproducible / 반복 가능 = replicable)을 반드시 넣어라. 백로그에 이미 적혀 있다.

---

## Y3(본문 몫) — `content/showcase/02-eeg-binaural.mdx:37` + `content/articles/03-statistics.mdx:83`

**`02-eeg-binaural.mdx:37` before** (전문):
```
피어슨 상관계수는 아홉 칸 모두 음수였고 절댓값도 작았습니다. 더 분명한 신호는 결정계수 쪽입니다. 베타파 유도 집단을 제외한 여섯 모델에서 결정계수가 음수로 나왔습니다. 결정계수가 음수라는 것은 세운 회귀 모델이 그냥 전체 평균으로 예측하는 것보다도 못하다는 뜻입니다. 베타 조건의 양수 값도 0.114가 최대입니다.
```
**after**:
```
피어슨 상관계수는 아홉 칸 모두 음수였고 절댓값도 작았습니다. 더 분명한 신호는 결정계수 쪽입니다. 베타파 유도 집단을 제외한 여섯 모델에서 결정계수가 음수로 나왔습니다. 결정계수가 음수라는 것은 세운 회귀 모델이 그냥 전체 평균으로 예측하는 것보다도 못하다는 뜻입니다. 베타 조건의 양수 값도 0.114가 최대입니다.

여기서 한 가지 짚어둘 것이 있습니다. 회귀에 쓴 그 데이터로 그대로 계산한 R²는 원리적으로 음수가 될 수 없습니다. 음수가 나온 것은 이 팀이 Orange의 Test & Score로 **모델을 만들 때 쓰지 않은 데이터에 대고** 예측을 평가했기 때문입니다. 이 사이트의 '간이 통계 계산기'는 그 방식이 아니어서, 같은 숫자를 넣어도 음수 R²는 나오지 않습니다. 사례를 따라 해보려는 분은 이 차이를 먼저 알아두세요 — 음수 R²는 계산 오류가 아니라 "새 데이터에서는 이 모델이 평균만도 못하다"는 평가 결과입니다.
```

**`03-statistics.mdx:83` before**:
```
- **R²**: 회귀에서 "이 변수가 결과의 변동을 몇 % 설명하는가"입니다. 0.3이면 30%입니다.
```
**after**:
```
- **R²**: 회귀에서 "이 변수가 결과의 변동을 몇 % 설명하는가"입니다. 0.3이면 30%입니다. 회귀에 쓴 데이터 그대로 계산하면 0에서 1 사이지만, 모델을 만들 때 쓰지 않은 데이터로 평가하면 음수가 나올 수도 있습니다 — 그건 "새 데이터에서는 이 모델이 평균으로 찍는 것보다 못하다"는 뜻입니다.
```

---

# 파트 3 — U1의 회귀 방지선 설계

## 대상 4곳 (실측)

| # | 파일 | 위치 | 표면 형태 |
| --- | --- | --- | --- |
| 1 | `content/guide/05-writing.mdx` | `:53` | `M = 16.9, SD = 2.4, n = 16` / `t(30) = 2.71, p = .011, d = 0.96` |
| 2 | `content/guide/05-writing.mdx` | `:68` (표) | `t(30) = 2.71, p = .011` — **M/SD/n이 같은 줄에 없다** |
| 3 | `content/articles/03-statistics.mdx` | `:103` | #1과 같은 형태 (U1 수정 후) |
| 4 | `content/articles/29-negative-results.mdx` | `:101` | `12.4개(SD 3.1)` · `(n = 17)` 분리 · `t(32) = 0.49, p = .63, d = 0.17` — **완전히 다른 형태** |
| 5 | `app/example/page.tsx` | `:273-279` | `M=16.9, SD=2.4` — **공백 없음, n 없음, JSX 줄바꿈으로 문장이 쪼개짐** |

## 두 방식 비교

### 방식 A — 정규식으로 MDX에서 추출

**장점**
- 새 예시를 본문에 추가하면 테스트가 자동으로 그것도 검사한다. 케이스 등록을 잊을 수 없다.
- 테스트 파일이 짧다.

**단점 (치명적)**
1. **표면 형태가 5가지다.** `M = 16.9`(공백 있음) vs `M=16.9`(없음), `SD = 3.1` vs `SD 3.1`, `n`이 같은 괄호 안 vs 다른 괄호 안 vs 아예 없음. 하나의 정규식으로 못 잡고, 파일별 정규식을 5개 쓰면 "일반성"이라는 장점이 사라진다.
2. **부분 케이스가 정규식을 오염시킨다.** `:68`은 t·p만 있고 M/SD/n이 없다. 순진한 스윕은 "M/SD/n을 못 찾음"으로 조용히 건너뛰거나 앞줄의 M/SD를 잘못 끌어온다.
3. **`/example`은 TSX다.** 문장이 `d = 0.96, 평균 차이의 95% CI [0.6, 4.2].` 앞에서 JSX 줄바꿈과 들여쓰기로 쪼개져 있다. 소스 텍스트에 정규식을 걸면 개행·공백을 전부 관용해야 하고, 그러면 정규식이 너무 느슨해져 다른 숫자를 물어온다.
4. **가장 나쁜 실패 모드: 조용한 무매치.** 누가 예시 문장을 다듬어 `M = 16.9`를 `M=16.9`로 바꾸면 정규식이 0건을 잡고, **테스트는 초록으로 통과한다.** U1이 통과한 것과 **정확히 같은 구조의 실패**를 방지선 안에 다시 심는 것이다.

방어책으로 "최소 N건은 매치돼야 한다"를 걸 수 있지만, 그러면 결국 개수를 하드코딩하는 것이고 방식 B의 절반만 하는 셈이다.

### 방식 B — 케이스를 테스트 파일에 하드코딩 + 원문 리터럴 존재 검증

**장점**
1. **5가지 표면 형태를 전부 다룬다.** 각 케이스가 자기 파일의 문장을 리터럴로 들고 있다.
2. **무매치가 불가능하다.** `content.includes(literal)`은 못 찾으면 **빨갛게 실패**한다. 조용한 통과 경로가 없다.
3. **본문을 고치면 반드시 테스트도 고치게 된다.** 이게 비용이 아니라 목적이다 — U1은 "숫자를 고치면서 짝을 안 고쳤다"는 사고였고, 이 구조는 숫자를 고칠 때 테스트를 마주 보게 만든다.
4. **부분 케이스를 자연스럽게 표현한다.** `:68`은 `expects: { t, p }`만 두고 `d`를 생략하면 된다.

**단점**
- 예시를 새로 쓰는 사람이 케이스 등록을 잊을 수 있다. → **완화책**: `expect(CASES.length).toBe(5)`를 걸고, 각 대상 파일에서 `/t\(\d+\)\s*=/` 발생 횟수를 세어 케이스 수와 대조한다. 이건 "새 예시가 생겼는지"만 보는 느슨한 스윕이라 정규식의 정밀도 문제를 물려받지 않는다.

## 결정: **방식 B**

정규식의 유일한 장점(자동 발견)은 "발생 횟수 대조"라는 훨씬 단순한 검사로 90% 회수된다. 반면 정규식의 단점(조용한 무매치)은 회수 불가능하고, **U1과 같은 종류의 사고를 방지선 자체에 재생산한다.**

## 구현 — `lib/__tests__/mdxStatsExamples.test.ts` (신설)

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { welchTTest } from "../stats";

/**
 * 본문의 통계 예시가 스스로 모순되지 않는지 검사한다.
 *
 * 왜 있는가 — 03-statistics의 t-검정 예시는 05-writing의 문장을 복사해
 * M/SD만 바꾸고 d만 다시 계산한 뒤 t·p를 그대로 뒀다(t=2.71이 아니라 2.585,
 * p=.011이 아니라 .0149였다). 29-negative-results도 같은 종류로 p가 .58이
 * 아니라 .63이었다. **사람 눈으로는 안 잡히는 오류다** — 문장은 완벽히
 * 자연스럽고 숫자도 그럴듯하다.
 *
 * 왜 정규식으로 본문을 훑지 않는가 — 표면 형태가 다섯 가지다
 * ("M = 16.9" / "M=16.9" / "12.4개(SD 3.1)" / n이 다른 괄호에 있거나 없음 /
 * JSX 줄바꿈으로 쪼개짐). 하나의 정규식으로는 못 잡고, 느슨하게 만들면
 * 문장을 조금만 다듬어도 0건을 매치한 채 초록으로 통과한다 — 그건 이 테스트가
 * 막으려는 사고를 방지선 안에 다시 심는 것이다. 그래서 케이스를 여기 적고,
 * 원문 문장 조각이 실제로 파일에 있는지를 includes로 못 박는다.
 * 본문 숫자를 고치면 이 파일도 고쳐야 한다 — 그게 비용이 아니라 목적이다.
 */

type Group = { mean: number; sd: number; n: number };
type Case = {
  name: string;
  file: string;
  /** 그 파일에 반드시 그대로 들어 있어야 하는 문장 조각 */
  literal: string;
  a: Group;
  b: Group;
  /** 본문이 보고한 값. 생략한 항목은 그 문장에 없다는 뜻이다 */
  reported: { t?: number; df?: number; p?: number; d?: number };
};

const ROOT = process.cwd();

const CASES: Case[] = [
  {
    name: "05-writing:53 결과 문장 (사이트 정본)",
    file: "content/guide/05-writing.mdx",
    literal:
      "백색소음 집단(M = 16.9, SD = 2.4, n = 16)이 조용한 환경 집단(M = 14.5, SD = 2.6, n = 16)보다 유의하게 높았다, t(30) = 2.71, p = .011, d = 0.96.",
    a: { mean: 16.9, sd: 2.4, n: 16 },
    b: { mean: 14.5, sd: 2.6, n: 16 },
    reported: { t: 2.71, df: 30, p: 0.011, d: 0.96 },
  },
  {
    name: "05-writing:68 보고 항목 표 (t·p만 있는 부분 케이스)",
    file: "content/guide/05-writing.mdx",
    literal: "| 검정 통계량·자유도·p값 | t(30) = 2.71, p = .011 |",
    a: { mean: 16.9, sd: 2.4, n: 16 },
    b: { mean: 14.5, sd: 2.6, n: 16 },
    reported: { t: 2.71, df: 30, p: 0.011 },
  },
  {
    name: "03-statistics:103 t-검정 예시 (U1이 틀렸던 자리)",
    file: "content/articles/03-statistics.mdx",
    literal:
      "백색소음 집단(M = 16.9, SD = 2.4, n = 16)과 조용한 환경 집단(M = 14.5, SD = 2.6, n = 16)의 단어 회상 점수를 비교한 결과, 두 집단의 차이는 통계적으로 유의했다, t(30) = 2.71, p = .011, d = 0.96.",
    a: { mean: 16.9, sd: 2.4, n: 16 },
    b: { mean: 14.5, sd: 2.6, n: 16 },
    reported: { t: 2.71, df: 30, p: 0.011, d: 0.96 },
  },
  {
    name: "29-negative-results:101 결과 절 (X1이 틀렸던 자리)",
    file: "content/articles/29-negative-results.mdx",
    literal:
      "독립표본 t 검정 결과 유의하지 않았다(t(32) = 0.49, p = .63). 효과 크기는 d = 0.17로 작았다.",
    a: { mean: 12.4, sd: 3.1, n: 17 },
    b: { mean: 12.9, sd: 2.8, n: 17 },
    reported: { t: 0.49, df: 32, p: 0.63, d: 0.17 },
  },
  {
    name: "/example 5단계 도구 출력",
    file: "app/example/page.tsx",
    // JSX 줄바꿈이 끼므로 한 줄로 닫히는 조각만 고른다
    literal: "t = 2.713, df = 29.8, p = 0.0110",
    a: { mean: 16.9, sd: 2.4, n: 16 },
    b: { mean: 14.5, sd: 2.6, n: 16 },
    reported: { t: 2.713, df: 29.8, p: 0.011 },
  },
];

/** 보고된 자릿수까지만 비교한다 — 본문은 반올림해서 적기 때문이다. */
function matchesAtReportedPrecision(actual: number, reported: number): boolean {
  const decimals = (String(reported).split(".")[1] ?? "").length;
  return Number(Math.abs(actual).toFixed(decimals)) === Math.abs(reported);
}

describe("본문 통계 예시의 자체 정합성 (U1·X1 회귀)", () => {
  it("검사 대상이 5건이다 — 예시를 늘렸으면 여기도 늘려야 한다", () => {
    expect(CASES.length).toBe(5);
  });

  for (const c of CASES) {
    describe(c.name, () => {
      const raw = fs.readFileSync(path.join(ROOT, c.file), "utf-8");

      it("본문에 그 문장이 그대로 있다 (조용한 무매치 방지)", () => {
        expect(raw).toContain(c.literal);
      });

      it("M·SD·n으로 다시 계산한 t·p·d가 본문 표기와 맞는다", () => {
        const r = welchTTest(
          synth(c.a),
          synth(c.b),
        );
        expect("error" in r).toBe(false);
        if ("error" in r) return;

        if (c.reported.t !== undefined) {
          expect(matchesAtReportedPrecision(r.t, c.reported.t)).toBe(true);
        }
        if (c.reported.d !== undefined) {
          expect(matchesAtReportedPrecision(r.cohenD, c.reported.d)).toBe(true);
        }
        if (c.reported.p !== undefined) {
          expect(matchesAtReportedPrecision(r.p, c.reported.p)).toBe(true);
        }
      });

      it("보고한 자유도가 Welch 자유도 또는 n1+n2-2와 맞는다", () => {
        if (c.reported.df === undefined) return;
        const r = welchTTest(synth(c.a), synth(c.b));
        if ("error" in r) throw new Error("계산 불가");
        const pooledDf = c.a.n + c.b.n - 2;
        const ok =
          matchesAtReportedPrecision(r.df, c.reported.df) ||
          c.reported.df === pooledDf;
        expect(ok).toBe(true);
      });
    });
  }
});
```

### 남은 조각 — `synth()`

`welchTTest`는 원자료 배열을 받는데 본문에는 M·SD·n밖에 없다. **정확히 그 평균과 표본표준편차를 갖는 배열을 합성해야 한다.**

```ts
/**
 * 주어진 (mean, sd, n)을 정확히 재현하는 표본을 만든다.
 *
 * 대칭 편차를 쓴다: n이 짝수면 ±k를 n/2쌍, 홀수면 가운데 하나를 평균에 둔다.
 * 그 뒤 실제 표본표준편차로 나누고 목표 sd를 곱해 정확히 맞춘다.
 * (welchTTest는 평균·표본분산·n만 쓰므로 분포 모양은 결과에 영향이 없다.)
 */
function synth({ mean, sd, n }: Group): number[] {
  if (n < 2) throw new Error("n은 2 이상이어야 한다");
  const base: number[] = [];
  for (let i = 0; i < n; i++) base.push(i - (n - 1) / 2);
  const m = base.reduce((s, v) => s + v, 0) / n; // 정확히 0
  const varBase =
    base.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1);
  const scale = sd / Math.sqrt(varBase);
  return base.map((v) => mean + v * scale);
}
```

**부동소수 주의**: `synth`가 만든 배열의 표본 SD는 목표값과 1e-13 수준으로 일치한다. `matchesAtReportedPrecision`이 소수 2~4자리까지만 보므로 문제없다. 다만 `p`의 경우 `0.011`을 소수 3자리로 비교하면 `0.010963 → "0.011"` ✓, `0.0110`(자릿수 4)은 `0.0110` ✓, `.63`은 `0.625056 → "0.63"` ✓. **전부 통과한다 — 위 값은 실제로 돌려 확인했다.**

**`p = .011` 파싱 주의**: 케이스에 `p: 0.011`로 쓰지 `.011`로 쓰지 마라. JS에서 `.011`은 유효하지만 `String(0.011).split(".")[1]`이 `"011"`이라 decimals=3으로 잡힌다 — 의도대로다.

### 느슨한 스윕(보조 검사) — 같은 파일 끝에 추가

```ts
it("대상 파일의 t(df)= 표기 개수가 등록된 케이스 수와 같다", () => {
  const counts = new Map<string, number>();
  for (const c of CASES) {
    if (counts.has(c.file)) continue;
    const raw = fs.readFileSync(path.join(ROOT, c.file), "utf-8");
    counts.set(c.file, (raw.match(/t\(\d+(?:\.\d+)?\)\s*=/g) ?? []).length);
  }
  const expected = new Map<string, number>();
  for (const c of CASES) {
    expected.set(c.file, (expected.get(c.file) ?? 0) + 1);
  }
  // /example은 "t = 2.713" 형태라 t(df)= 표기가 아니므로 제외한다
  for (const [file, n] of counts) {
    if (file.endsWith(".tsx")) continue;
    expect(`${file}: ${n}`).toBe(`${file}: ${expected.get(file)}`);
  }
});
```

**여기는 구현 시 판단 필요**: `/example`의 `t = 2.713`은 `t(df)=` 패턴이 아니라 위 스윕에서 제외했다. `.tsx` 예외를 두는 대신 패턴을 `/t\s*(?:\(\d+(?:\.\d+)?\))?\s*=/`로 넓히면 `/example` 본문 다른 곳의 `t`도 물어올 수 있다. 나는 제외 쪽을 권한다 — 스윕은 "새 예시가 MDX에 생겼는지"만 보면 충분하다.

### 이 테스트가 잡는 것 / 못 잡는 것

**잡는다**: 다른 곳에서 복사해 M/SD만 바꾸고 t·p를 안 고침(U1). p만 손으로 잘못 씀(X1). n을 바꾸고 df를 안 바꿈. d 계산 실수.

**못 잡는다**: 검정 자체가 잘못 선택된 경우(X3), 상관·회귀 예시(케이스가 t-검정 전용), CI(`welchTTest`에 CI가 없다 — H2가 들어오면 X2류도 여기서 잡을 수 있게 확장하라).

---

# 파트 4 — 커밋 분할

**8개 커밋.** 순서에 의존성이 있다.

### 커밋 1 — `ci: GitHub Actions + typecheck 스크립트 (S1)`
- `.github/workflows/ci.yml` 신설
- `package.json`에 `"typecheck": "tsc --noEmit"`
- `.gitignore`에 `tsconfig.tsbuildinfo`
- **이유**: 나머지 7개가 이 파이프라인 위에서 검증된다. 방지선 없이 치명 결함을 고치면 다음 사람이 같은 결함을 되돌린다. **반드시 첫 번째.**
- **게이트**: push 후 초록을 눈으로 확인하기 전에는 커밋 2로 넘어가지 마라.

### 커밋 2 — `test: localStorage 실패 모킹 공용 헬퍼 (S2)`
- `lib/__tests__/_storage.ts` 신설
- `citations.test.ts:63-83`의 인라인 모킹을 헬퍼로 교체
- `checklist.test.ts`·`activity.test.ts`에 "예외를 밖으로 내지 않는다" + `it.todo("… — C4")`
- **이유**: 커밋 3·4·5가 전부 이 헬퍼를 쓴다. 헬퍼가 없으면 세 커밋에 같은 모킹이 세 벌 복붙되고, 그게 S2가 지적한 상태 그 자체다.
- **주의**: 이 시점에서 `addReference` 관련 테스트는 아직 안 넣는다(커밋 4에서 시그니처가 바뀐다).

### 커밋 3 — `fix: 백업 복원 실패 시 기존 기록을 롤백한다 (K1, S3-PlanBackup)`
- `components/PlanBackup.tsx` 수정
- `components/__tests__/PlanBackup.test.tsx` 신설
- **이유**: 가장 심각한 데이터 손실. 다른 어떤 파일과도 겹치지 않아 병렬 가능하지만, **혼자 나가야 리뷰가 된다.**

### 커밋 4 — `fix: 레퍼런스 저장 실패를 "저장됨"으로 덮지 않는다 (K2, S2)`
- `lib/citations.ts` — `ReferenceWriteResult` 도입
- `components/CitationFormatter.tsx`, `PriorResearchSearch.tsx`, `ReferenceList.tsx` — 호출부 3곳
- `lib/__tests__/citations.test.ts` — K2 4건 추가 (커밋 2의 헬퍼 사용)
- 컴포넌트 테스트 2건
- **이유**: 타입 변경이 3곳에 파급되므로 한 커밋 안에서 컴파일이 닫혀야 한다. 쪼개면 중간 커밋이 빨갛다.

### 커밋 5 — `fix: 상관·회귀에서 X·Y 쌍이 어긋난 채 계산되던 문제 (K3, S5, Y3-코드)`
- `lib/stats.ts` — `parsePairedLists`·`splitColumn` 추가, `simpleLinearRegression` JSDoc 보강(Y3)
- `components/StatsCalculator.tsx` — `compute()` 재구성, `reportCommaReading` 추출, 회귀 R² 안내 문구(Y3)
- `lib/__tests__/stats.test.ts` — 쌍 파싱 6건 + R² 2건
- `components/__tests__/StatsCalculator.test.tsx` — 상관·회귀 6건
- **작업 순서**: S5의 회귀 테스트를 **먼저** 쓰고 빨간 것을 확인한 뒤 K3 코드를 넣는다. 커밋은 하나지만 커밋 메시지에 그 실패 출력을 인용한다.
- **이유**: Y3의 코드 몫(주석 + UI 한 줄)이 같은 두 파일이라 여기 붙인다. 따로 내면 `StatsCalculator.tsx`를 두 번 만진다.

### 커밋 6 — `fix: 도구 3종이 조용히 잘못된 답을 내던 문제 (L1, L6, U3, U4)`
- `components/RandomSampler.tsx` (L1) + 테스트 4건
- `components/SampleSizeCalculator.tsx` (L6) + 테스트 5건
- `components/DisclosureGenerator.tsx` (U3) + 테스트 6건 신설
- `content/articles/04-research-ethics.mdx:61` (U4)
- **이유**: 서로 독립적인 작은 수정 셋. 커밋을 셋으로 쪼개도 되지만, **U3와 U4는 반드시 같은 커밋**이어야 한다(도구와 그 도구를 가리키는 문장). 나머지 둘은 규모가 작아 함께 두는 편이 리뷰 부담이 적다. 쪼개고 싶으면 `L1+L6` / `U3+U4` 둘로 나눠라.

### 커밋 7 — `fix: 본문 통계 예시의 숫자 불일치 + 회귀 방지선 (U1, X1)`
- `content/articles/03-statistics.mdx:103` (U1)
- `content/articles/29-negative-results.mdx:64,:101` (X1)
- `lib/__tests__/mdxStatsExamples.test.ts` 신설 (5케이스)
- **이유**: 방지선과 수정이 한 커밋에 있어야 "이 테스트가 이 버그를 잡았다"가 이력에 남는다. **커밋 5 뒤여야 한다** — `welchTTest`를 쓰는데 커밋 5가 `lib/stats.ts`를 만지므로 충돌을 피한다.
- **작업 순서**: 테스트를 먼저 쓰고 03-statistics·29 수정 전에 돌려 **빨간 것을 확인**한다.

### 커밋 8 — `docs: 사례·자료실의 방법론 오류와 낡은 서술 정정 (U2, X2~X6, Y1, Y2, Y3-본문)`
- `content/articles/26-small-sample.mdx:48` (U2)
- `content/showcase/03-sex-difference-adr.mdx:22,26,30,36,40` + 「이어서 한다면」 (X2, X3)
- `content/showcase/04-aria-deep-learning.mdx:45` (X4)
- `content/showcase/01-lysozyme-charge-aggregation.mdx:43` 뒤 (X5)
- `content/articles/16-scholar-alerts.mdx:45` (X6)
- `content/articles/30-limitations.mdx:49` (Y1)
- `content/guide/05-writing.mdx:102` (Y2)
- `content/showcase/02-eeg-binaural.mdx:37`, `content/articles/03-statistics.mdx:83` (Y3-본문)
- **이유**: 순수 콘텐츠. 코드 파급 0. 마지막에 몰아서 내는 편이 코드 커밋의 diff를 깨끗하게 유지한다.
- **주의**: `03-statistics.mdx`를 커밋 7(`:103`)과 커밋 8(`:83`)에서 두 번 만진다. 순서를 지키면 충돌 없다.
- **분할 옵션**: 사례 파일이 무겁다면 `X2~X5`(사례 5곳)를 따로 떼 9번째 커밋으로. 하지만 전부 "본문이 틀린 것을 고친다"는 한 종류라 하나로 두는 것을 권한다.

### 커밋 3~6은 서로 독립이다

파일 교집합이 없으므로 병렬 작업 가능:
- 커밋 3: `PlanBackup.tsx`
- 커밋 4: `citations.ts` + 3 컴포넌트
- 커밋 5: `stats.ts` + `StatsCalculator.tsx`
- 커밋 6: `RandomSampler` / `SampleSizeCalculator` / `DisclosureGenerator` + 1 mdx

**단, 커밋 1·2가 먼저 들어가 있어야 한다.**

---

# 파트 5 — 불확실한 지점 (얼버무리지 않고 명시)

1. **K3의 "한 행에 값 여럿"** — `"12 15"` 한 줄을 `issues`로 잡을지 첫 값만 쓸지. 잡는 쪽을 권하지만 오류 문구가 부정확해진다. **구현 시 판단 필요.**
2. **K3의 행별 쉼표 판정** — 열 전체 판정과 행 단위 재파싱이 어긋날 수 있는 좁은 구간이 있다. 정확히 하려면 `tokenizeNumberList`에 주입 파라미터가 필요하고 그건 t-검정 경로를 건드린다. **커밋을 좁게 유지하는 쪽을 권했으나 판단 필요.**
3. **`checklist.ts`·`activity.ts`의 저장 실패 통로** — 시그니처가 `void`라 실패를 알릴 방법이 없다. C4의 범위. `it.todo`로 못 박고 넘어가라고 설계했으나, 지금 함께 고칠지는 **운영자 판단.**
4. **X2의 CI 복구** — 원본 R 출력을 구할 수 있으면 삭제 대신 정정이 맞다. 지금 설계는 "구할 수 없다"를 전제한 폴백이다. **투고자에게 물을 수 있으면 물어라.**
5. **U1의 방향 뒤집기** — 03-statistics의 백색소음 집단이 "낮음"에서 "높음"으로 바뀐다. `grep -rn "백색소음" content/ app/`로 부작용을 전수 확인하고 나서 커밋하라. **아직 확인 안 했다.**
6. **`DataReset` 테스트의 `window.location.reload` 스파이** — jsdom 30에서 동작 여부를 실제로 확인하지 않았다. 안 되면 그 한 건만 `it.skip` + 사유 주석. **프로덕션 코드를 테스트 편의로 바꾸지 마라.**
7. **`tsc --noEmit`의 기존 에러 유무** — 확인하지 않았다. 커밋 1 전에 반드시 로컬 실행.
8. **U4의 단계 제목 표기** — `"6단계: 투고와 발표"`가 실제 frontmatter title과 같은지 확인 필요. `05-writing.mdx:90`의 기존 표기를 복사하는 것이 안전.agentId: acacef29239a98326 (use SendMessage with to: 'acacef29239a98326', summary: '<5-10 word recap>' to continue this agent)
<usage>subagent_tokens: 220036
tool_uses: 31
duration_ms: 757425</usage>