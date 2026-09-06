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
 *
 * **호출한 테스트 파일은 beforeEach에서 항상 새로 설치하라.** jsdom에서
 * defineProperty로 덮은 것은 unstubAllGlobals가 되돌리지 못한다.
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
