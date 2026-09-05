// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PERSIST_ERROR_MESSAGE,
  usePersistentState,
} from "../usePersistentState";

const KEY = "research-guide:tool:test-key";

/** 훅을 최소 형태로 감싼 테스트 전용 컴포넌트. */
function Probe() {
  const [value, setValue, saveError] = usePersistentState("test-key", "초기값");
  return (
    <div>
      <p data-testid="value">{value}</p>
      <button type="button" onClick={() => setValue("바뀐 값")}>
        바꾸기
      </button>
      <p data-testid="error">{saveError ?? ""}</p>
    </div>
  );
}

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePersistentState", () => {
  it("저장된 값을 마운트 후 복원한다", () => {
    window.localStorage.setItem(KEY, JSON.stringify("저장돼 있던 값"));
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("저장돼 있던 값");
  });

  it("값을 바꾸면 localStorage에 저장한다", async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByRole("button", { name: "바꾸기" }));
    expect(screen.getByTestId("value").textContent).toBe("바뀐 값");
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify("바뀐 값"));
  });

  it("setItem이 던지면 저장 실패를 노출한다", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    render(<Probe />);
    expect(screen.getByTestId("error").textContent).toBe("");

    await user.click(screen.getByRole("button", { name: "바꾸기" }));

    // 화면 상태는 유지하되, 새로고침하면 사라진다는 걸 알려야 한다
    expect(screen.getByTestId("value").textContent).toBe("바뀐 값");
    expect(screen.getByTestId("error").textContent).toBe(
      PERSIST_ERROR_MESSAGE,
    );
  });

  it("읽기가 실패해도 초기값으로 정상 렌더된다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("초기값");
    // 읽기 실패는 "저장된 게 없는 정상 상태"와 구분되지 않아 경고하지 않는다
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("손상된 저장값(형태 불일치)은 무시하고 초기값을 쓴다", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ 엉뚱한: "객체" }));
    render(<Probe />);
    expect(screen.getByTestId("value").textContent).toBe("초기값");
  });
});
