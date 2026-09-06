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

// § L1 — 요청 인원이 명단보다 많으면 조용히 깎아 전수를 표본처럼 보여줬다.
describe("요청 인원 처리 (L1)", () => {
  it("요청 인원이 명단보다 많으면 전수임을 알린다 (L1 회귀)", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    const boxes = screen.getAllByRole("textbox");
    await user.click(boxes[0]);
    await user.paste("가\n나\n다");
    const count = screen.getByRole("spinbutton");
    await user.clear(count);
    await user.type(count, "5");
    await user.click(screen.getByRole("button", { name: /추첨하기/ }));
    expect(await screen.findByText(/전원이 뽑혔습니다/)).toBeTruthy();
    expect(screen.getByText(/전수입니다/)).toBeTruthy();
  });

  it("소수 인원은 반올림하고 그 사실을 알린다", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    const boxes = screen.getAllByRole("textbox");
    await user.click(boxes[0]);
    await user.paste("가\n나\n다\n라\n마\n바");
    const count = screen.getByRole("spinbutton");
    await user.clear(count);
    await user.type(count, "3.7");
    await user.click(screen.getByRole("button", { name: /추첨하기/ }));
    expect(await screen.findByText(/4명으로 반올림/)).toBeTruthy();
  });

  it("요청 인원이 명단보다 적으면 전수 안내가 없다 (거짓 양성 방지)", async () => {
    const user = userEvent.setup();
    render(<RandomSampler />);
    const boxes = screen.getAllByRole("textbox");
    await user.click(boxes[0]);
    await user.paste("가\n나\n다\n라\n마\n바\n사\n아\n자\n차");
    await user.click(screen.getByRole("button", { name: /추첨하기/ }));
    expect(await screen.findByRole("button", { name: /결과 복사/ })).toBeTruthy();
    expect(screen.queryByText(/전수입니다/)).toBeNull();
  });
});
