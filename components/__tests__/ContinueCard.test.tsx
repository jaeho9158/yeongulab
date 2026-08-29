// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContinueCard } from "../ContinueCard";

const STAGES = [
  { order: 1, slug: "topic", title: "주제 선정", checklist: ["a", "b"] },
  { order: 2, slug: "prior", title: "선행연구", checklist: ["c", "d"] },
];

const key = (slug: string) => `research-guide:checklist:${slug}`;

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ContinueCard", () => {
  it("진행 기록이 없으면 렌더하지 않는다 (신규 방문자)", () => {
    const { container } = render(<ContinueCard stages={STAGES} />);
    expect(container.innerHTML).toBe("");
  });

  it("진행 중이면 다음 미완료 단계를 안내한다 (정상)", () => {
    window.localStorage.setItem(key("topic"), JSON.stringify({ v: 2, done: ["a", "b"] }));
    render(<ContinueCard stages={STAGES} />);
    expect(screen.getByText("다음: 2. 선행연구")).toBeTruthy();
  });

  it("일부만 체크한 단계가 다음 단계다 (경계)", () => {
    window.localStorage.setItem(key("topic"), JSON.stringify({ v: 2, done: ["a"] }));
    render(<ContinueCard stages={STAGES} />);
    expect(screen.getByText("다음: 1. 주제 선정")).toBeTruthy();
  });

  it("전부 완료면 완료 문구를 보여준다", () => {
    window.localStorage.setItem(key("topic"), JSON.stringify({ v: 2, done: ["a", "b"] }));
    window.localStorage.setItem(key("prior"), JSON.stringify({ v: 2, done: ["c", "d"] }));
    render(<ContinueCard stages={STAGES} />);
    expect(screen.getByText("6단계를 모두 체크했어요")).toBeTruthy();
  });
});
