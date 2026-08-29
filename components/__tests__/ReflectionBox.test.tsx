// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReflectionBox } from "../ReflectionBox";

const QUESTIONS = ["이 단계에서 배운 것은?"];
const key = (slug: string) => `research-guide:reflection:${slug}`;

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ReflectionBox", () => {
  it("저장된 메모를 마운트 후 보여준다 (정상)", () => {
    window.localStorage.setItem(key("topic"), "저장된 메모");
    render(<ReflectionBox slug="topic" questions={QUESTIONS} />);
    expect(screen.getByRole("textbox")).toHaveProperty("value", "저장된 메모");
  });

  it("입력하면 즉시 저장된다", async () => {
    const user = userEvent.setup();
    render(<ReflectionBox slug="topic" questions={QUESTIONS} />);
    await user.type(screen.getByRole("textbox"), "메모");
    expect(window.localStorage.getItem(key("topic"))).toBe("메모");
  });

  it("slug가 바뀌면 저장값이 없어도 초기화된다 (경계 — 단계 간 오염 방지)", () => {
    window.localStorage.setItem(key("topic"), "1단계 메모");
    const { rerender } = render(<ReflectionBox slug="topic" questions={QUESTIONS} />);
    expect(screen.getByRole("textbox")).toHaveProperty("value", "1단계 메모");
    rerender(<ReflectionBox slug="writing" questions={QUESTIONS} />);
    expect(screen.getByRole("textbox")).toHaveProperty("value", "");
  });

  it("questions가 비면 렌더하지 않는다 (실패/경계)", () => {
    const { container } = render(<ReflectionBox slug="topic" questions={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
