// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PriorResearchSearch } from "../PriorResearchSearch";

const PAPER = {
  paperId: "p1",
  title: "White noise and memory",
  abstract: null,
  year: 2020,
  venue: "Test Journal",
  url: "https://example.org/p1",
  authors: [{ name: "Kim" }],
};

/** aria-live 영역(sr-only)만 골라낸다 — 눈에 보이는 문구와 구분하기 위해서다. */
function liveRegion(): HTMLElement {
  const el = document.querySelector('[aria-live="polite"]');
  if (!el) throw new Error("aria-live 영역이 없습니다");
  return el as HTMLElement;
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PriorResearchSearch 검색 결과 알림", () => {
  it("결과가 있으면 aria-live 영역이 건수를 알린다 (정상)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [PAPER], source: "semantic-scholar" }),
      }),
    );
    const user = userEvent.setup();
    render(<PriorResearchSearch />);
    await user.type(screen.getByLabelText("검색 키워드 (영어)"), "noise");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(liveRegion().textContent).toContain("1건");
    });
  });

  it("결과가 없으면 aria-live 영역이 '결과 없음'을 알린다 (경계)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], source: "semantic-scholar" }),
      }),
    );
    const user = userEvent.setup();
    render(<PriorResearchSearch />);
    await user.type(screen.getByLabelText("검색 키워드 (영어)"), "noise");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(liveRegion().textContent).toContain("검색 결과가 없습니다");
    });
  });

  it("오류는 role=alert로 알린다 (실패)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    );
    const user = userEvent.setup();
    render(<PriorResearchSearch />);
    await user.type(screen.getByLabelText("검색 키워드 (영어)"), "noise");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("요청이 많이");
    });
  });
});
