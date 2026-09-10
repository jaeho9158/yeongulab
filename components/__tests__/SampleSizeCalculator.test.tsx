// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SampleSizeCalculator } from "../SampleSizeCalculator";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

// 한 글자씩 치면 느려서 붙여넣기로 채운다
async function fillPopulation(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const box = screen.getByLabelText("전체 모집단 크기 (모르면 비워두기)");
  await user.clear(box);
  await user.click(box);
  await user.paste(value);
}

async function fillMargin(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const box = screen.getByLabelText("허용 오차범위 (%)");
  await user.clear(box);
  await user.click(box);
  await user.paste(value);
}

// 입력값은 localStorage에서 복원되므로, number 입력칸에 직접 칠 수 없는
// 값(문자열 등)도 화면에 올라올 수 있다 — 그 경로를 재현한다
// 숫자와 "명"이 별도 텍스트 노드로 쪼개지므로 <strong> 전체 텍스트로 확인한다
function expectAnswer(text: string) {
  expect(
    screen.getByText(
      (_content, el) => el?.tagName === "STRONG" && el.textContent === text,
    ),
  ).toBeTruthy();
}

function seed(form: Record<string, string>) {
  window.localStorage.setItem(
    "research-guide:tool:sample-size",
    JSON.stringify({
      confidence: "95",
      marginError: "5",
      population: "",
      proportion: "50",
      ...form,
    }),
  );
}

describe("SampleSizeCalculator", () => {
  it("기본값 95/5/50/모집단 빈칸이면 385명 (정상)", () => {
    render(<SampleSizeCalculator />);
    expectAnswer("385명");
  });

  it("모집단 300이면 유한모집단 보정으로 169명 (정상)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillPopulation(user, "300");
    expectAnswer("169명");
  });

  it("모집단 30이면 28명 (기존 계산 유지)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillPopulation(user, "30");
    expectAnswer("28명");
  });

  it("모집단이 음수면 결과 대신 안내를 보여준다 (실패)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillPopulation(user, "-100");
    expect(screen.queryByText(/385/)).toBeNull();
    expect(
      screen.getByText("모집단 크기를 숫자로 입력해주세요. 모르면 비워두시면 됩니다."),
    ).toBeTruthy();
  });

  it("모집단이 숫자가 아니면 결과 대신 안내를 보여준다 (실패)", () => {
    seed({ population: "abc" });
    render(<SampleSizeCalculator />);
    expect(screen.queryByText(/385/)).toBeNull();
    expect(
      screen.getByText("모집단 크기를 숫자로 입력해주세요. 모르면 비워두시면 됩니다."),
    ).toBeTruthy();
  });

  it("단위가 섞인 모집단('300명')도 안내로 막는다 (경계)", () => {
    seed({ population: "300명" });
    render(<SampleSizeCalculator />);
    expect(screen.queryByText(/385/)).toBeNull();
    expect(
      screen.getByText("모집단 크기를 숫자로 입력해주세요. 모르면 비워두시면 됩니다."),
    ).toBeTruthy();
  });

  it("오차범위 0.001이면 값은 보여주되 경고와 대안을 함께 띄운다 (경계)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillMargin(user, "0.001");
    expectAnswer("9,604,000,000명");
    expect(screen.getByText(/사실상 모으기 힘든 인원이에요/)).toBeTruthy();
    expect(screen.getByText(/오차범위를 5%로\s*잡으면 약 385명/)).toBeTruthy();
  });

  it("현실적인 규모에는 경고를 띄우지 않는다 (경계)", () => {
    render(<SampleSizeCalculator />);
    expect(screen.queryByText(/사실상 모으기 힘든 인원이에요/)).toBeNull();
  });

  it("큰 결과에 천 단위 구분이 적용된다", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillMargin(user, "0.05");
    expectAnswer("3,841,600명");
  });

  it("오차범위가 0이면 기존 안내가 그대로 나온다 (실패)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await fillMargin(user, "0");
    expect(screen.getByText("오차범위와 예상 비율을 확인해주세요.")).toBeTruthy();
  });
});

// § L6 — 오차범위가 너무 '클' 때 방어가 없어 "1명"이 정답처럼 나왔다.
describe("오차범위 상한 (L6)", () => {
  async function setMargin(
    user: ReturnType<typeof userEvent.setup>,
    value: string,
  ) {
    const margin = screen.getByLabelText(/오차범위/);
    await user.clear(margin);
    await user.type(margin, value);
  }

  it("오차범위 500%에 '1명'이라고 답하지 않는다 (L6 회귀)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await setMargin(user, "500");
    expect(
      await screen.findByText(/퍼센트\(%\)가 아니라\s*소수로 입력하신 건 아닌가요/),
    ).toBeTruthy();
    expect(screen.queryByText(/1명/)).toBeNull();
  });

  it("오차범위 50%도 거부한다", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await setMargin(user, "50");
    expect(await screen.findByText(/20%가 넘으면/)).toBeTruthy();
  });

  it("오차범위 20%는 그대로 계산한다 (경계)", async () => {
    const user = userEvent.setup();
    render(<SampleSizeCalculator />);
    await setMargin(user, "20");
    expect(await screen.findByText(/응답을 받으면/)).toBeTruthy();
  });
});
