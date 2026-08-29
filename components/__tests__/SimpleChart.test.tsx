// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SimpleChart } from "../SimpleChart";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("SimpleChart", () => {
  it("기본값(A~D 막대)으로 막대 4개를 그린다 (정상)", () => {
    const { container } = render(<SimpleChart />);
    // 배경 rect 1개 제외
    const bars = [...container.querySelectorAll("svg rect")].filter(
      (r) => r.getAttribute("width") !== "640",
    );
    expect(bars).toHaveLength(4);
  });

  it("원형으로 바꾸면 조각 path를 그린다", async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleChart />);
    await user.click(screen.getByRole("button", { name: "원형" }));
    expect(container.querySelectorAll("svg path").length).toBeGreaterThanOrEqual(4);
  });

  it("가로막대에서 음수는 제외하고 안내한다 (경계)", async () => {
    const user = userEvent.setup();
    const { container } = render(<SimpleChart />);
    const values = container.querySelector("#chart-values") as HTMLTextAreaElement;
    await user.clear(values);
    await user.type(values, "5, -3, 8, 2");
    await user.click(screen.getByRole("button", { name: "가로막대" }));
    const bars = [...container.querySelectorAll("svg rect")].filter(
      (r) => r.getAttribute("width") !== "640",
    );
    expect(bars).toHaveLength(3);
  });
});
