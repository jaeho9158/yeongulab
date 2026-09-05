import { describe, expect, it } from "vitest";
import {
  STAGE_TOOL_TITLES,
  TOOL_IDS,
  getTotalUniqueToolCount,
  type ToolTitle,
} from "@/lib/stageToolMeta";

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

describe("TOOL_IDS", () => {
  const allTitles = Object.values(STAGE_TOOL_TITLES).flat() as ToolTitle[];
  const uniqueTitles = Array.from(new Set(allTitles));

  it("has an id for every ToolTitle", () => {
    for (const title of uniqueTitles) {
      expect(TOOL_IDS[title]).toBeDefined();
    }
  });

  it("uses lowercase-hyphen ids only", () => {
    for (const title of uniqueTitles) {
      expect(TOOL_IDS[title]).toMatch(ID_PATTERN);
    }
  });

  it("has globally unique ids across titles", () => {
    const ids = uniqueTitles.map((title) => TOOL_IDS[title]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has as many distinct ids as unique tools sitewide", () => {
    const ids = uniqueTitles.map((title) => TOOL_IDS[title]);
    expect(new Set(ids).size).toBe(getTotalUniqueToolCount());
  });
});
