// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { ToolAccordion } from "../StageTools";

beforeEach(() => {
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

describe("ToolAccordion", () => {
  it("해시가 없으면 첫 도구가 펼쳐진다 (정상)", async () => {
    render(<ToolAccordion slug="topic" />);
    await waitFor(() => {
      expect(document.querySelectorAll("details").length).toBeGreaterThan(0);
    });
    const details = document.querySelectorAll("details");
    expect(details[0].open).toBe(true);
    expect(details[1].open).toBe(false);
  });

  it("#tool-sample-size로 진입하면 해당 도구가 펼쳐진다 (data-collection)", async () => {
    window.location.hash = "#tool-sample-size";
    render(<ToolAccordion slug="data-collection" />);

    await waitFor(() => {
      const details = document.querySelectorAll("details");
      const target = document.getElementById("tool-sample-size") as HTMLDetailsElement | null;
      expect(target?.open).toBe(true);
      // 나머지는 닫혀 있어야 한다
      details.forEach((d) => {
        if (d.id !== "tool-sample-size") expect(d.open).toBe(false);
      });
    });
  });

  it("기본 상태에서는 첫 도구의 본문만 렌더된다 (접힌 도구는 제목만)", async () => {
    render(<ToolAccordion slug="writing" />);
    await waitFor(() => {
      expect(document.querySelectorAll("details").length).toBeGreaterThan(1);
    });
    const details = [...document.querySelectorAll("details")];
    expect(details[0].querySelector(".tool-embed")).not.toBeNull();
    details.slice(1).forEach((d) => {
      // 앵커와 제목은 남아야 딥링크·색인이 산다
      expect(d.id).not.toBe("");
      expect(d.querySelector("h3")).not.toBeNull();
      expect(d.querySelector(".tool-embed")).toBeNull();
    });
  });

  it("해시로 진입하면 그 도구의 본문이 렌더된다", async () => {
    window.location.hash = "#tool-sample-size";
    render(<ToolAccordion slug="data-collection" />);
    await waitFor(() => {
      const target = document.getElementById("tool-sample-size");
      expect(target?.querySelector(".tool-embed")).not.toBeNull();
    });
  });

  it("다른 도구를 열면 그 본문이 붙고, 먼저 열린 도구의 본문도 남는다", async () => {
    render(<ToolAccordion slug="writing" />);
    await waitFor(() => {
      expect(document.querySelectorAll("details").length).toBeGreaterThan(2);
    });
    const details = [...document.querySelectorAll("details")];
    const second = details[1];
    expect(second.querySelector(".tool-embed")).toBeNull();

    // jsdom은 summary 클릭으로 details를 토글하지 않으므로 직접 열고 이벤트를 쏜다
    await act(async () => {
      second.open = true;
      second.dispatchEvent(new Event("toggle"));
    });
    await waitFor(() => {
      expect(second.querySelector(".tool-embed")).not.toBeNull();
    });
    // 먼저 열려 있던 첫 도구는 그대로 남는다(재마운트 없음 = 입력 보존)
    expect(details[0].querySelector(".tool-embed")).not.toBeNull();

    // 다시 접어도 본문은 유지된다
    await act(async () => {
      second.open = false;
      second.dispatchEvent(new Event("toggle"));
    });
    expect(second.querySelector(".tool-embed")).not.toBeNull();
  });
});
