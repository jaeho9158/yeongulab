// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanBackup } from "../PlanBackup";
import { installMockStorage } from "../../lib/__tests__/_storage";

/**
 * K1 회귀 방지선.
 *
 * 복원은 "기존 기록을 전부 지우고 파일 내용을 쓴다"인데, 쓰기가 중간에
 * 실패하면 한 학기 기록이 사라진 채 "파일을 읽지 못했습니다"라는 엉뚱한
 * 안내만 남았다. 아래 세 번째 테스트가 그 상태를 잡는다.
 */

const RECORD = "research-guide:checklist:topic";
const OTHER = "research-guide:reflection:topic";
const THEME = "research-guide:theme";

function backupFile(data: Record<string, string>) {
  const json = JSON.stringify({ version: 1, data });
  const file = new File([json], "backup.json", { type: "application/json" });
  // jsdom 30에는 File.prototype.text가 있으나, 없는 환경을 위해 보강한다
  if (typeof file.text !== "function") {
    Object.defineProperty(file, "text", { value: async () => json });
  }
  return file;
}

async function importFile(file: File) {
  const user = userEvent.setup();
  // 보이는 버튼은 숨은 input을 대신 클릭할 뿐이라, 테스트는 input에 직접 올린다
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, file);
}

let reload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  reload = vi.fn();
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PlanBackup 복원 (K1)", () => {
  it("정상 복원: 기존 키를 지우고 파일 내용만 남긴다", async () => {
    const { store } = installMockStorage({
      seed: { [RECORD]: "old", [THEME]: "dark" },
    });
    render(<PlanBackup />);
    await importFile(backupFile({ [OTHER]: "new" }));

    await waitFor(() => expect(store.get(OTHER)).toBe("new"));
    expect(store.has(RECORD)).toBe(false);
  });

  it("테마 키는 지우지도 덮어쓰지도 않는다", async () => {
    const { store } = installMockStorage({
      seed: { [RECORD]: "old", [THEME]: "dark" },
    });
    render(<PlanBackup />);
    await importFile(backupFile({ [OTHER]: "new", [THEME]: "light" }));

    await waitFor(() => expect(store.get(OTHER)).toBe("new"));
    expect(store.get(THEME)).toBe("dark");
  });

  it("쓰기 2번째에서 실패하면 기존 기록 전부가 그대로 돌아온다 (K1 회귀)", async () => {
    // 롤백 쓰기는 성공해야 하므로 failSetFrom(그 뒤 전부 실패)이 아니라
    // failSetOn으로 복원 루프의 두 번째 쓰기 하나만 터뜨린다.
    const { store } = installMockStorage({
      seed: { [RECORD]: "old", [OTHER]: "keep" },
      failSetOn: [2],
    });
    render(<PlanBackup />);
    await importFile(
      backupFile({ "research-guide:a": "1", "research-guide:b": "2" }),
    );

    expect(
      await screen.findByText(/기존 기록을 그대로 되돌렸습니다/),
    ).toBeTruthy();
    // 실패했으므로 원래 두 키가 살아 있어야 한다
    expect(store.get(RECORD)).toBe("old");
    expect(store.get(OTHER)).toBe("keep");
  });

  it("쓰기 실패 시 새로고침하지 않는다", async () => {
    installMockStorage({ seed: { [RECORD]: "old" }, failSetFrom: 1 });
    render(<PlanBackup />);
    await importFile(backupFile({ "research-guide:a": "1" }));

    await screen.findByText(/되돌렸습니다|손상됐을 수 있습니다/);
    expect(reload).not.toHaveBeenCalled();
  });

  it("손상된 JSON은 여전히 '파일을 읽지 못했습니다'", async () => {
    installMockStorage();
    render(<PlanBackup />);
    // accept="application/json"이라 userEvent가 타입 없는 파일을 거부한다
    const bad = new File(["{not json"], "backup.json", {
      type: "application/json",
    });
    if (typeof bad.text !== "function") {
      Object.defineProperty(bad, "text", { value: async () => "{not json" });
    }
    await importFile(bad);

    expect(await screen.findByText(/파일을 읽지 못했습니다/)).toBeTruthy();
    expect(screen.queryByText(/손상됐을 수 있습니다/)).toBeNull();
  });
});
