// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
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
});
