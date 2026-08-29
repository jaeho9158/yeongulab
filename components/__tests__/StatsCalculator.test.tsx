// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsCalculator } from "../StatsCalculator";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

// user.type은 한 글자씩 쳐서 병렬 실행에서 느리다 — 붙여넣기로 대체
async function fill(user: ReturnType<typeof userEvent.setup>, a: string, b: string) {
  const boxes = screen.getAllByRole("textbox");
  await user.clear(boxes[0]);
  await user.click(boxes[0]);
  await user.paste(a);
  await user.clear(boxes[1]);
  await user.click(boxes[1]);
  await user.paste(b);
}

describe("StatsCalculator", () => {
  it("t-검정: 계산하면 t·df·p와 판정 문구가 나온다 (정상)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1 2 3 4 5", "2 3 4 5 6");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    // t=-1.000, df=8.0, p=0.3466 (lib/stats 테스트와 같은 데이터)
    expect(screen.getByText(/t = -1\.000/)).toBeTruthy();
    expect(screen.getByText(/유의하지 않습니다/)).toBeTruthy();
  });

  it("그룹당 2개 미만이면 오류 안내 (실패)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1", "2 3");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText("각 그룹에 숫자가 2개 이상 필요합니다.")).toBeTruthy();
  });

  it("숫자 아닌 토큰은 제외 경고를 보여준다 (경계)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1 2 abc 3", "2 3 4");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText("숫자로 읽지 못한 값 1개는 제외했습니다.")).toBeTruthy();
  });

  it("모드 전환 시 이전 결과가 지워진다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1 2 3 4 5", "2 3 4 5 6");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText(/t = -1\.000/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /상관분석/ }));
    expect(screen.queryByText(/t = -1\.000/)).toBeNull();
  });

  it("입력값이 localStorage에 유지된다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "7 8 9", "1 2 3");
    const saved = JSON.parse(
      window.localStorage.getItem("research-guide:tool:stats-calculator")!,
    );
    expect(saved.textA).toBe("7 8 9");
  });
});
