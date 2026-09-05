// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RandomSampler } from "../RandomSampler";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

const ROSTER = Array.from({ length: 20 }, (_, i) => `${i + 1}번`).join("\n");

async function fillRoster(user: ReturnType<typeof userEvent.setup>) {
  const box = screen.getByRole("textbox", { name: "전체 명단 입력" });
  await user.clear(box);
  await user.click(box);
  await user.paste(ROSTER);
}

describe("RandomSampler", () => {
  it("추첨하면 요청한 인원 수만큼 뽑힌다 (정상)", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    await fillRoster(user);
    await user.click(screen.getByRole("button", { name: "추첨하기" }));
    const result = screen.getByRole("button", { name: "결과 복사" })
      .previousElementSibling as HTMLElement;
    expect(result.textContent!.split(", ")).toHaveLength(5);
  });

  it("인원 수를 바꾸면 이전 추첨 결과가 지워진다", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    await fillRoster(user);
    await user.click(screen.getByRole("button", { name: "추첨하기" }));
    expect(screen.getByRole("button", { name: "결과 복사" })).toBeTruthy();

    const countInput = screen.getByLabelText("뽑을 인원 수");
    await user.clear(countInput);
    await user.type(countInput, "3");
    // 5명 목록이 남아 있으면 복사도 5명을 복사한다
    expect(screen.queryByRole("button", { name: "결과 복사" })).toBeNull();
  });

  it("명단을 고치면 이전 추첨 결과가 지워진다", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    await fillRoster(user);
    await user.click(screen.getByRole("button", { name: "추첨하기" }));
    expect(screen.getByRole("button", { name: "결과 복사" })).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: "전체 명단 입력" }), "\n21번");
    expect(screen.queryByRole("button", { name: "결과 복사" })).toBeNull();
  });
});
