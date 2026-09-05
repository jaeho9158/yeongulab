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

  it("입력을 고치면 옛 결과가 사라지고 재계산 안내가 나온다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "12 15 14", "22 19 25");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText(/t = -4\.287/)).toBeTruthy();
    // 그룹 B만 고친다 — 옛 t·p가 남아 있으면 새 결과로 오인된다
    await fill(user, "12 15 14", "13 14 15");
    expect(screen.queryByText(/t = -4\.287/)).toBeNull();
    expect(screen.queryByRole("button", { name: "결과 복사" })).toBeNull();
    expect(screen.getByText("입력이 바뀌었습니다. 다시 계산하세요.")).toBeTruthy();
  });

  it("아주 작은 p는 .0000이 아니라 p < .001로 나온다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1 2 3 4 5", "100 101 102 103 104");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText(/p < \.001/)).toBeTruthy();
    expect(screen.queryByText(/0\.0000/)).toBeNull();
  });

  it("보통 크기의 p는 소수 셋째 자리로 표시된다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "12 15 14", "22 19 25");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.getByText(/p = \.024/)).toBeTruthy();
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
  it("엑셀에서 붙여넣은 천 단위 쉼표를 합쳐 읽고 안내한다 (재현 사례)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1,200 1,500 1,350", "1,100 1,250 1,180");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    // 1과 200으로 쪼개지면 n=6, 평균 175.5가 된다 — n=3·평균 1350대여야 한다
    expect(screen.getByText(/n = 3/)).toBeTruthy();
    expect(screen.getByText(/M = 1350\.00/)).toBeTruthy();
    expect(
      screen.getByText(/쉼표를 천 단위 구분으로 읽었습니다/),
    ).toBeTruthy();
  });

  it("쉼표 사용이 섞이면 값 구분자로 읽었다고 경고한다 (경계)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "1,200 12,15", "3 4 5 6");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(
      screen.getByText(/쉼표 사용이 일관되지 않아 값 구분자로 읽었습니다/),
    ).toBeTruthy();
  });

  it("쉼표 없는 평범한 입력에는 아무 안내도 뜨지 않는다 (거짓 양성 방지)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await fill(user, "12 15 14", "22 19 25");
    await user.click(screen.getByRole("button", { name: "계산하기" }));
    expect(screen.queryByText(/천 단위 구분으로 읽었습니다/)).toBeNull();
    expect(screen.queryByText(/일관되지 않아/)).toBeNull();
  });
});
