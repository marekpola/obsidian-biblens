import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";

describe("DEFAULT_SETTINGS", () => {
  it("has empty translationOrder", () => {
    expect(DEFAULT_SETTINGS.translationOrder).toEqual({});
  });
  it("has empty translationAbbreviations", () => {
    expect(DEFAULT_SETTINGS.translationAbbreviations).toEqual({});
  });
});
