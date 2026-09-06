// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DisclosureGenerator } from "../DisclosureGenerator";

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

/**
 * U3 회귀 방지선.
 *
 * 예전에는 무엇을 고르든 "연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은
 * 저자가 직접 작성하였다"가 고정으로 붙었다. 윤리 문서가 "해서는 안 되는
 * 사용"으로 명시한 두 항목을 체크해도 그 문장이 그대로 붙어, 한 문장 안에서
 * 앞뒤가 서로를 부정했다.
 */
async function choose(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  level: string,
) {
  await user.selectOptions(screen.getByLabelText(label), level);
}

describe("DisclosureGenerator 면책 문장 (U3)", () => {
  it("문법 교정만 고르면 면책 문장이 온전히 나온다", async () => {
    const user = userEvent.setup();
    render(<DisclosureGenerator />);
    await choose(user, /문법·맞춤법 교정 활용 정도/, "light");
    expect(
      await screen.findByText(
        /연구의 핵심 아이디어, 분석 결과 해석, 최종 결론은 저자가 직접/,
      ),
    ).toBeTruthy();
  });

  it("브레인스토밍을 고르면 '핵심 아이디어' 조항이 빠진다 (U3 회귀)", async () => {
    const user = userEvent.setup();
    render(<DisclosureGenerator />);
    await choose(user, /아이디어 브레인스토밍 보조 활용 정도/, "heavy");
    const out = await screen.findByText(/본 연구는 작성 과정에서/);
    expect(out.textContent).toMatch(/분석 결과 해석, 최종 결론은 저자가 직접/);
    expect(out.textContent).not.toMatch(/연구의 핵심 아이디어는? 저자가/);
  });

  it("결과 해석 보조를 고르면 '분석 결과 해석' 조항이 빠진다", async () => {
    const user = userEvent.setup();
    render(<DisclosureGenerator />);
    await choose(user, /통계 분석 결과 해석 보조 활용 정도/, "light");
    const out = await screen.findByText(/본 연구는 작성 과정에서/);
    expect(out.textContent).toMatch(
      /연구의 핵심 아이디어, 최종 결론은 저자가 직접/,
    );
  });

  it("둘 다 고르면 '최종 결론'만 남는다", async () => {
    const user = userEvent.setup();
    render(<DisclosureGenerator />);
    await choose(user, /아이디어 브레인스토밍 보조 활용 정도/, "heavy");
    await choose(user, /통계 분석 결과 해석 보조 활용 정도/, "heavy");
    const out = await screen.findByText(/본 연구는 작성 과정에서/);
    expect(out.textContent).toMatch(
      /최종 결론은 저자가 직접 검토하고 작성하였다\./,
    );
    expect(out.textContent).not.toMatch(/분석 결과 해석, 최종 결론/);
  });

  it("주의 항목을 고르면 윤리 문서 링크가 있는 경고가 뜬다", async () => {
    const user = userEvent.setup();
    render(<DisclosureGenerator />);
    await choose(user, /아이디어 브레인스토밍 보조 활용 정도/, "light");
    const link = await screen.findByRole("link", { name: /연구윤리/ });
    expect(link.getAttribute("href")).toBe("/articles/research-ethics");
  });
});
