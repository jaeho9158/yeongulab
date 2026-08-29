// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChecklistCard } from "../ChecklistCard";

const ITEMS = ["항목 하나", "항목 둘", "항목 셋"];
const KEY = "research-guide:checklist:topic";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ChecklistCard", () => {
  it("저장값이 없으면 전부 미체크로 렌더 (정상)", () => {
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(3);
    expect(boxes.every((b) => !(b as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByText("0 / 3 완료")).toBeTruthy();
  });

  it("저장된 체크를 마운트 후 반영한다", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 2, done: ["항목 둘"] }));
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false]);
    expect(screen.getByText("1 / 3 완료")).toBeTruthy();
  });

  it("체크하면 저장되고 활동기록이 남는다", async () => {
    const user = userEvent.setup();
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual({
      v: 2,
      done: ["항목 하나"],
    });
    const log = JSON.parse(
      window.localStorage.getItem("research-guide:activity-log")!,
    );
    expect(log[0]).toMatchObject({ type: "STAGE_ITEM_DONE", refId: "topic:0" });
  });

  it("체크 해제 시 활동기록은 추가되지 않는다 (경계)", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 2, done: ["항목 하나"] }));
    const user = userEvent.setup();
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(window.localStorage.getItem("research-guide:activity-log")).toBeNull();
  });

  it("items가 비면 렌더하지 않는다 (실패/경계)", () => {
    const { container } = render(<ChecklistCard slug="topic" items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("손상된 저장값이어도 미체크로 렌더 (실패)", () => {
    window.localStorage.setItem(KEY, "{broken");
    render(<ChecklistCard slug="topic" items={ITEMS} />);
    expect(screen.getByText("0 / 3 완료")).toBeTruthy();
  });
});
