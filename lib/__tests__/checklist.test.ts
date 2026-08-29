import { beforeEach, describe, it, expect, vi } from "vitest";

// lib/checklist는 window.localStorage를 직접 쓰므로 node 환경에 최소 스텁을 깐다
function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    _store: store,
  };
}

const ls = makeLocalStorage();
vi.stubGlobal("window", {
  localStorage: ls,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
});

import { countDone, readChecklist, writeChecklist } from "../checklist";

const ITEMS = ["첫 항목", "둘째 항목", "셋째 항목"];
const KEY = "research-guide:checklist:topic";

beforeEach(() => ls._store.clear());

describe("readChecklist", () => {
  it("저장값 없으면 전부 false (정상 초기 상태)", () => {
    expect(readChecklist("topic", ITEMS)).toEqual([false, false, false]);
  });

  it("v2 문구 기반 저장을 읽는다 — 순서를 바꿔도 체크가 따라온다", () => {
    ls.setItem(KEY, JSON.stringify({ v: 2, done: ["둘째 항목"] }));
    expect(readChecklist("topic", ITEMS)).toEqual([false, true, false]);
    const reordered = ["셋째 항목", "둘째 항목", "첫 항목"];
    expect(readChecklist("topic", reordered)).toEqual([false, true, false]);
  });

  it("구버전 boolean[]은 길이가 맞으면 읽고 v2로 마이그레이션한다 (경계)", () => {
    ls.setItem(KEY, JSON.stringify([true, false, true]));
    expect(readChecklist("topic", ITEMS)).toEqual([true, false, true]);
    expect(JSON.parse(ls.getItem(KEY)!)).toEqual({
      v: 2,
      done: ["첫 항목", "셋째 항목"],
    });
  });

  it("구버전 길이 불일치·손상 JSON은 전부 미체크 (실패)", () => {
    ls.setItem(KEY, JSON.stringify([true, false]));
    expect(readChecklist("topic", ITEMS)).toEqual([false, false, false]);
    ls.setItem(KEY, "{broken");
    expect(readChecklist("topic", ITEMS)).toEqual([false, false, false]);
  });
});

describe("writeChecklist / countDone", () => {
  it("쓴 것을 그대로 되읽고 개수를 센다 (round-trip)", () => {
    writeChecklist("topic", ITEMS, [true, true, false]);
    expect(readChecklist("topic", ITEMS)).toEqual([true, true, false]);
    expect(countDone("topic", ITEMS)).toBe(2);
  });

  it("kind=ethics는 별도 키에 저장된다", () => {
    writeChecklist("topic", ITEMS, [true, false, false], "ethics");
    expect(countDone("topic", ITEMS)).toBe(0);
    expect(countDone("topic", ITEMS, "ethics")).toBe(1);
  });
});
