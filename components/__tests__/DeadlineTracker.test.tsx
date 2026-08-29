// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeadlineTracker } from "../DeadlineTracker";

const KEY = "research-guide:deadlines";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("DeadlineTracker", () => {
  it("저장된 마감일을 마운트 후 보여준다 (정상)", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([{ id: "1", name: "과학전람회", date: "2099-01-01" }]),
    );
    render(<DeadlineTracker />);
    expect(screen.getByText("과학전람회")).toBeTruthy();
  });

  it("추가하면 저장되고 목록에 나타난다", async () => {
    const user = userEvent.setup();
    render(<DeadlineTracker />);
    await user.type(screen.getByPlaceholderText("대회·저널 이름"), "저널 투고");
    await user.type(screen.getByLabelText("마감일"), "2099-12-31");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("저널 투고")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(KEY)!)[0]).toMatchObject({
      name: "저널 투고",
      date: "2099-12-31",
    });
  });

  it("이름·날짜 없이 추가하면 오류를 보여준다 (실패)", async () => {
    const user = userEvent.setup();
    render(<DeadlineTracker />);
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("이름과 날짜를 모두 입력해주세요.")).toBeTruthy();
  });

  it("손상된 항목은 걸러지고 정상 항목만 렌더된다 (경계 — #9)", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: "1", name: "정상", date: "2099-01-01" },
        { id: 2, name: "아이디가 숫자" },
        "garbage",
        null,
      ]),
    );
    render(<DeadlineTracker />);
    expect(screen.getByText("정상")).toBeTruthy();
    expect(screen.queryByText("아이디가 숫자")).toBeNull();
  });
});
