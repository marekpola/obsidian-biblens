import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";
import { getBuiltInAbbreviationMap } from "../src/books";

describe("DEFAULT_SETTINGS", () => {
  it("has preferredTranslation 'cep'", () => {
    expect(DEFAULT_SETTINGS.preferredTranslation).toBe("cep");
  });
});

describe("getBuiltInAbbreviationMap", () => {
  it("maps English abbreviations to USFM book ids", () => {
    const map = getBuiltInAbbreviationMap();
    expect(map["Gen"]).toBe("GEN");
    expect(map["Matt"]).toBe("MAT");
    expect(map["Rev"]).toBe("REV");
  });

  it("covers all 66 canonical books", () => {
    const map = getBuiltInAbbreviationMap();
    expect(Object.keys(map)).toHaveLength(66);
  });

  it("returns a new object on each call (no shared state)", () => {
    const a = getBuiltInAbbreviationMap();
    const b = getBuiltInAbbreviationMap();
    expect(a).not.toBe(b);
  });
});
