/**
 * 단계 체크리스트(및 연구윤리 체크리스트) 저장소.
 *
 * 저장 형태 v2: `{ v: 2, done: string[] }` — 체크된 항목의 "문구"를 그대로 담는다.
 * 문구가 곧 안정적인 id이므로 MDX에서 항목 하나를 고쳐 써도 그 항목의 체크만
 * 풀리고, 순서를 바꿔도 체크가 엉뚱한 항목에 붙지 않는다.
 *
 * 구버전(boolean[])은 읽을 때 길이가 맞으면 v2로 바꿔 저장하고, 길이가 다르면
 * 어느 항목의 체크였는지 알 수 없으므로 모두 미체크로 본다.
 */

export const CHECKLIST_EVENT = "research-guide:checklist-updated";

type Kind = "checklist" | "ethics";

export function checklistKey(slug: string, kind: Kind = "checklist"): string {
  return `research-guide:${kind}:${slug}`;
}

type StoredV2 = { v: 2; done: string[] };

function isStoredV2(value: unknown): value is StoredV2 {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { v?: unknown }).v === 2 &&
    Array.isArray((value as { done?: unknown }).done)
  );
}

function toStored(items: string[], checked: boolean[]): StoredV2 {
  return { v: 2, done: items.filter((_, i) => checked[i] === true) };
}

function readByKey(key: string, items: string[]): boolean[] {
  const empty = () => Array<boolean>(items.length).fill(false);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty();
    const parsed: unknown = JSON.parse(raw);

    if (isStoredV2(parsed)) {
      const done = new Set(parsed.done.filter((d) => typeof d === "string"));
      return items.map((text) => done.has(text));
    }

    // 구버전 boolean[] — 길이가 맞을 때만 믿고, 그 자리에서 v2로 옮긴다
    if (Array.isArray(parsed) && parsed.length === items.length) {
      const checked = parsed.map((v) => v === true);
      try {
        window.localStorage.setItem(key, JSON.stringify(toStored(items, checked)));
      } catch {
        // 저장 실패해도 읽은 값은 그대로 쓴다
      }
      return checked;
    }

    return empty();
  } catch {
    return empty();
  }
}

function writeByKey(key: string, items: string[], checked: boolean[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(toStored(items, checked)));
  } catch {
    // 저장 실패해도 화면 상태는 유지
  }
  try {
    window.dispatchEvent(new Event(CHECKLIST_EVENT));
  } catch {
    // 이벤트 전파 실패는 무시
  }
}

/** 항목 문구 배열과 같은 길이의 boolean[]을 돌려준다. 예외를 던지지 않는다. */
export function readChecklist(
  slug: string,
  items: string[],
  kind: Kind = "checklist",
): boolean[] {
  return readByKey(checklistKey(slug, kind), items);
}

export function countDone(
  slug: string,
  items: string[],
  kind: Kind = "checklist",
): number {
  return readChecklist(slug, items, kind).filter(Boolean).length;
}

/** v2 형태로 저장하고, 같은 페이지의 구독자에게 변경을 알린다. */
export function writeChecklist(
  slug: string,
  items: string[],
  checked: boolean[],
  kind: Kind = "checklist",
): void {
  writeByKey(checklistKey(slug, kind), items, checked);
}

/**
 * 같은 페이지의 저장 이벤트 + 다른 탭의 storage 변경을 구독한다.
 * 반환값을 호출하면 구독이 해제된다.
 */
export function subscribeChecklist(cb: () => void): () => void {
  window.addEventListener(CHECKLIST_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHECKLIST_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
