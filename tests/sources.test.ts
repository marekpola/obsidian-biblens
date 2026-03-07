import { describe, it, expect } from "vitest";
import { isCatalogStale } from "../src/sources/catalogUtils";
import { getAdapter } from "../src/sources/adapters";

describe("isCatalogStale", () => {
  it("returns true when catalogLastUpdated is empty", () => {
    expect(isCatalogStale("")).toBe(true);
  });

  it("returns true when catalogLastUpdated is invalid", () => {
    expect(isCatalogStale("not-a-date")).toBe(true);
  });

  it("returns true when last update is older than 7 days", () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isCatalogStale(old)).toBe(true);
  });

  it("returns false when last update is within 7 days", () => {
    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isCatalogStale(recent)).toBe(false);
  });

  it("returns false when last update is today", () => {
    expect(isCatalogStale(new Date().toISOString())).toBe(false);
  });
});

describe("getAdapter", () => {
  it("throws for unknown adapter type", () => {
    expect(() => getAdapter("unknown-adapter")).toThrow(
      'BibLens: unknown adapter type "unknown-adapter"'
    );
  });
});
