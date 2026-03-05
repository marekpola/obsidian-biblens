import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";
import { buildAbbreviationMap } from "../src/books";

describe("DEFAULT_SETTINGS", () => {
  it("has preferredTranslation 'cep'", () => {
    expect(DEFAULT_SETTINGS.preferredTranslation).toBe("cep");
  });

  it("has empty customAbbreviations", () => {
    expect(DEFAULT_SETTINGS.customAbbreviations).toEqual({});
  });

  it("has verseInsertionFormat 'inline'", () => {
    expect(DEFAULT_SETTINGS.verseInsertionFormat).toBe("inline");
  });
});

describe("buildAbbreviationMap", () => {
  it("includes built-in abbreviations", () => {
    const map = buildAbbreviationMap({});
    expect(map["mt"]).toBe("MAT");
    expect(map["gn"]).toBe("GEN");
    expect(map["iz"]).toBe("ISA");
  });

  it("merges custom abbreviations", () => {
    const map = buildAbbreviationMap({ abc: "REV" });
    expect(map["abc"]).toBe("REV");
  });

  it("custom abbreviations win over built-in on conflict", () => {
    const map = buildAbbreviationMap({ mt: "MRK" });
    expect(map["mt"]).toBe("MRK");
  });

  it("does not mutate built-in map when custom is applied", () => {
    buildAbbreviationMap({ mt: "MRK" });
    const mapDefault = buildAbbreviationMap({});
    expect(mapDefault["mt"]).toBe("MAT");
  });

  it("returns empty-custom map identical to built-in for known keys", () => {
    const map = buildAbbreviationMap({});
    expect(map["jan"]).toBe("JHN");
    expect(map["zj"]).toBe("REV");
  });
});
