// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { SiteNav } from "../SiteNav";
import { GLOSSARY } from "@/lib/site";

beforeEach(() => {
  cleanup();
  nav.pathname = "/";
});

describe("SiteNav", () => {
  it("내부 3개 + 논문용어사전 = 4개 항목을 보여준다 (정상)", () => {
    render(<SiteNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    // 좁은 화면 축약형이 항상 남는 부분이라 이 글자로 찾는다
    expect(screen.getByText(/가이드/)).toBeTruthy();
    expect(screen.getByText(/예시/)).toBeTruthy();
    expect(screen.getByText(/기록/)).toBeTruthy();
    expect(screen.getByText(/용어사전/)).toBeTruthy();
  });

  it("용어사전은 외부 주소로 새 창에서 열리고 rel 보호가 붙는다", () => {
    render(<SiteNav />);
    const glossary = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === GLOSSARY.url);
    if (!glossary) throw new Error("용어사전 링크가 없다");
    expect(glossary.getAttribute("target")).toBe("_blank");
    expect(glossary.getAttribute("rel")).toBe("noopener noreferrer");
    // 새 창으로 열린다는 사실을 스크린리더에도 알린다
    expect(glossary.textContent).toContain("새 창에서 열림");
  });

  it("현재 페이지는 aria-current=page, 하위 경로는 true (경계)", () => {
    nav.pathname = "/guide";
    const { unmount } = render(<SiteNav />);
    expect(
      screen.getByRole("link", { name: /가이드/ }).getAttribute("aria-current"),
    ).toBe("page");
    unmount();

    nav.pathname = "/guide/topic";
    render(<SiteNav />);
    expect(
      screen.getByRole("link", { name: /가이드/ }).getAttribute("aria-current"),
    ).toBe("true");
  });

  it("외부 링크에는 현재 위치 표시가 붙지 않는다 (실패 방지)", () => {
    nav.pathname = "/guide";
    render(<SiteNav />);
    const glossary = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === GLOSSARY.url);
    expect(glossary?.hasAttribute("aria-current")).toBe(false);
  });
});
