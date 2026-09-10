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
    expect(screen.getByText("값이 바뀌었으니 다시 계산해주세요.")).toBeTruthy();
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

// § S5 — 상관·회귀 모드를 계산까지 돌리는 테스트가 하나도 없었다.
// K3(빈 셀 하나에 그 아래 쌍이 전부 밀림)가 통과한 이유가 정확히 이것이다.
describe("상관·회귀 (S5, K3)", () => {
  async function switchTo(
    user: ReturnType<typeof userEvent.setup>,
    name: RegExp,
  ) {
    await user.click(screen.getByRole("button", { name }));
  }

  it("상관분석이 실제로 계산된다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await switchTo(user, /상관분석/);
    await fill(user, "1\n2\n3\n4\n5", "2\n4\n6\n8\n10");
    await user.click(screen.getByRole("button", { name: /계산하기/ }));
    // 완전한 양의 선형관계 → r = 1.00
    expect(await screen.findByText(/r = 1\.00/)).toBeTruthy();
  });

  it("중간에 빈 칸이 있으면 계산하지 않고 몇 번째 행인지 알린다 (K3 회귀)", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await switchTo(user, /상관분석/);
    // 예전에는 양쪽 길이가 4로 같아져 검사를 통과하고
    // (1,10) (3,20) (4,40)처럼 어긋난 쌍이 조용히 계산됐다
    await fill(user, "1\n\n3\n4", "10\n20\n\n40");
    await user.click(screen.getByRole("button", { name: /계산하기/ }));
    expect(await screen.findByText(/2, 3번째 행/)).toBeTruthy();
    expect(screen.queryByText(/r = /)).toBeNull();
  });

  it("행 수가 다르면 각각 몇 개인지 알린다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await switchTo(user, /상관분석/);
    await fill(user, "1\n2\n3", "10\n20");
    await user.click(screen.getByRole("button", { name: /계산하기/ }));
    expect(
      await screen.findByText(/변수 X는 3개, 변수 Y는 2개/),
    ).toBeTruthy();
  });

  it("회귀도 계산된다", async () => {
    const user = userEvent.setup();
    render(<StatsCalculator />);
    await switchTo(user, /회귀/);
    await fill(user, "1\n2\n3\n4\n5", "3\n5\n7\n9\n11");
    await user.click(screen.getByRole("button", { name: /계산하기/ }));
    // y = 2x + 1
    expect(await screen.findByText(/기울기/)).toBeTruthy();
  });
});
