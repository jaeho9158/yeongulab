import { beforeEach, describe, it, expect, vi } from "vitest";

const store = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  },
});

import { getActivityByDay, getStageDurations, toLocalDateKey } from "../activity";

const LOG_KEY = "research-guide:activity-log";

// 로컬 시간대 기준으로 만든 ISO 시각 — toLocalDateKey와 어긋나지 않게 한다
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h).toISOString();

function seed(entries: { refId: string; occurredAt: string }[]) {
  store.set(
    LOG_KEY,
    JSON.stringify(entries.map((e) => ({ type: "NOTE", ...e }))),
  );
}

beforeEach(() => store.clear());

describe("toLocalDateKey", () => {
  it("로컬 날짜를 YYYY-MM-DD로 만든다 (0 패딩 포함)", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("getActivityByDay", () => {
  it("같은 날 항목을 합산한다", () => {
    seed([
      { refId: "topic:a", occurredAt: at(2026, 8, 1) },
      { refId: "topic:b", occurredAt: at(2026, 8, 1) },
      { refId: "topic:c", occurredAt: at(2026, 8, 2) },
    ]);
    expect(getActivityByDay()).toEqual({ "2026-08-01": 2, "2026-08-02": 1 });
  });
  it("손상된 항목은 걸러지고 정상 항목만 집계된다 (실패 격리)", () => {
    store.set(
      LOG_KEY,
      JSON.stringify([
        { type: "NOTE", refId: "topic:a", occurredAt: at(2026, 8, 1) },
        { type: "NOTE", refId: 123, occurredAt: at(2026, 8, 1) },
        { refId: "topic:b" },
        { type: "NOTE", refId: "topic:c", occurredAt: "not-a-date" },
        "garbage",
      ]),
    );
    expect(getActivityByDay()).toEqual({ "2026-08-01": 1 });
  });

  it("저장값이 없거나 손상돼도 빈 결과 (실패)", () => {
    expect(getActivityByDay()).toEqual({});
    store.set(LOG_KEY, "{bad");
    expect(getActivityByDay()).toEqual({});
  });
});

describe("getStageDurations", () => {
  it("같은 날 시작·종료면 1일 (경계 — '0일' 버그 회귀 방지)", () => {
    seed([
      { refId: "topic:a", occurredAt: at(2026, 8, 1, 9) },
      { refId: "topic:b", occurredAt: at(2026, 8, 1, 18) },
    ]);
    expect(getStageDurations([{ slug: "topic" }]).topic.days).toBe(1);
  });
  it("첫날·마지막날 포함 달력 일수로 센다 (8/1~8/3 → 3일)", () => {
    seed([
      { refId: "topic:a", occurredAt: at(2026, 8, 1) },
      { refId: "topic:b", occurredAt: at(2026, 8, 3) },
    ]);
    expect(getStageDurations([{ slug: "topic" }]).topic.days).toBe(3);
  });
  it("기록 없는 단계는 null이고, 다른 단계 기록에 오염되지 않는다", () => {
    seed([{ refId: "writing:a", occurredAt: at(2026, 8, 1) }]);
    const r = getStageDurations([{ slug: "topic" }, { slug: "writing" }]);
    expect(r.topic).toEqual({ firstAt: null, lastAt: null, days: null });
    expect(r.writing.days).toBe(1);
  });
});
