// @vitest-environment jsdom
//
// 상태 변화가 화면낭독기에 전달되는지에 대한 회귀 테스트.
// 여기 있는 aria-live가 사라지면 사용자는 계산·판정 결과를 알 수 없게 된다.
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResearchQuestionQuiz } from "../ResearchQuestionQuiz";
import { SpeechTimer } from "../SpeechTimer";
import { ChecklistCard } from "../ChecklistCard";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

function liveRegions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[aria-live="polite"]'));
}

describe("ResearchQuestionQuiz", () => {
  it("판정 결과가 aria-live 영역 안에 나타난다", async () => {
    const user = userEvent.setup();
    render(<ResearchQuestionQuiz />);
    await user.click(screen.getByRole("button", { name: "결과 보기" }));

    const region = liveRegions().find((el) =>
      el.textContent?.includes("조사형에 가깝습니다"),
    );
    expect(region).toBeTruthy();
  });

  it("결과를 보기 전에도 aria-live 영역 자체는 존재한다 (경계)", () => {
    render(<ResearchQuestionQuiz />);
    expect(liveRegions().length).toBeGreaterThan(0);
  });
});

describe("SpeechTimer", () => {
  it("예상 발표 시간이 aria-live 영역 안에 있다", async () => {
    const user = userEvent.setup();
    render(<SpeechTimer />);
    await user.type(screen.getByLabelText("발표 대본 입력"), "가나다라마");

    const region = liveRegions().find((el) =>
      el.textContent?.includes("예상 발표 시간"),
    );
    expect(region).toBeTruthy();
    expect(region!.textContent).toContain("5자");
  });
});

describe("ChecklistCard", () => {
  it("진행도 표시가 aria-live 영역이고 체크하면 갱신된다", async () => {
    const user = userEvent.setup();
    render(<ChecklistCard slug="topic" items={["가", "나"]} />);

    const region = liveRegions().find((el) =>
      el.textContent?.includes("완료"),
    );
    expect(region).toBeTruthy();
    expect(region!.textContent).toContain("0 / 2");

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(region!.textContent).toContain("1 / 2");
  });
});

describe("DeadlineTracker", () => {
  it("추가·삭제를 aria-live로 알린다", async () => {
    const { DeadlineTracker } = await import("../DeadlineTracker");
    const user = userEvent.setup();
    render(<DeadlineTracker />);

    await user.type(screen.getByLabelText("대회·저널 이름"), "저널 투고");
    await user.type(screen.getByLabelText("마감일"), "2099-12-31");
    await user.click(screen.getByRole("button", { name: "추가" }));

    let region = liveRegions().find((el) =>
      el.textContent?.includes("추가했습니다"),
    );
    expect(region).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "저널 투고 삭제" }));
    region = liveRegions().find((el) =>
      el.textContent?.includes("삭제했습니다"),
    );
    expect(region).toBeTruthy();
    // 삭제 후 포커스가 <body>로 날아가지 않고 이름 입력으로 옮겨진다
    expect(document.activeElement).toBe(screen.getByLabelText("대회·저널 이름"));
  });
});
