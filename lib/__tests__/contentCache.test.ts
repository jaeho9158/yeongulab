import { afterEach, describe, expect, it } from "vitest";
import { buildOnlyCache } from "../contentCache";

const ORIGINAL_ENV = process.env.NODE_ENV;

/** NODE_ENV는 읽기 전용 타입이라 테스트에서만 우회해서 바꾼다. */
function setNodeEnv(value: string) {
  (process.env as Record<string, string>).NODE_ENV = value;
}

afterEach(() => setNodeEnv(ORIGINAL_ENV ?? "test"));

describe("buildOnlyCache", () => {
  it("프로덕션에서는 디스크를 한 번만 읽는다", () => {
    setNodeEnv("production");
    let reads = 0;
    const get = buildOnlyCache(() => {
      reads += 1;
      return ["a", "b"];
    });

    expect(get()).toEqual(["a", "b"]);
    expect(get()).toEqual(["a", "b"]);
    expect(get()).toEqual(["a", "b"]);
    expect(reads).toBe(1);
  });

  it("개발 모드에서는 매번 다시 읽는다 — MDX 수정이 즉시 반영되어야 한다", () => {
    setNodeEnv("development");
    // 디스크의 MDX가 중간에 바뀌는 상황을 흉내 낸다
    const disk = ["처음 내용"];
    let reads = 0;
    const get = buildOnlyCache(() => {
      reads += 1;
      return [...disk];
    });

    expect(get()).toEqual(["처음 내용"]);
    disk[0] = "고친 내용";
    expect(get()).toEqual(["고친 내용"]);
    expect(reads).toBe(2);
  });

  it("테스트 환경도 캐시하지 않는다", () => {
    setNodeEnv("test");
    let reads = 0;
    const get = buildOnlyCache(() => {
      reads += 1;
      return [reads];
    });
    expect(get()).toEqual([1]);
    expect(get()).toEqual([2]);
  });

  it("프로덕션에서도 매번 새 배열을 돌려줘 호출부 변형이 캐시를 오염시키지 않는다", () => {
    setNodeEnv("production");
    const get = buildOnlyCache(() => ["a", "b"]);

    const first = get();
    const second = get();
    expect(first).not.toBe(second);

    first.sort((x, y) => (x < y ? 1 : -1)); // 호출부가 제자리 정렬해도
    expect(get()).toEqual(["a", "b"]); // 캐시는 그대로
  });
});
