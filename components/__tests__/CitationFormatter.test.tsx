// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitationFormatter } from "../CitationFormatter";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";

/** navigator.clipboard는 jsdom에 없어서 테스트마다 심는다. */
function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CitationFormatter 복사", () => {
  it("복사에 실패하면 안내를 띄운다", async () => {
    const user = userEvent.setup();
    stubClipboard(() => Promise.reject(new Error("denied")));
    render(<CitationFormatter />);

    await user.type(screen.getByLabelText("제목"), "백색소음과 암기");
    const [apaCopy] = screen.getAllByRole("button", { name: "복사" });
    await user.click(apaCopy);

    expect(await screen.findByText(COPY_FAILED_MESSAGE)).toBeTruthy();
    // 실패했는데 성공 표시가 뜨면 안 된다
    expect(screen.queryByText("복사됨")).toBeNull();
  });

  it("복사에 성공하면 실패 안내가 없다", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CitationFormatter />);

    await user.type(screen.getByLabelText("제목"), "백색소음과 암기");
    const [apaCopy] = screen.getAllByRole("button", { name: "복사" });
    await user.click(apaCopy);

    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByText("복사됨")).toBeTruthy();
    expect(screen.queryByText(COPY_FAILED_MESSAGE)).toBeNull();
  });
});
