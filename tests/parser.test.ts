import { describe, it, expect } from "vitest";
import { parseCzechBibleRef } from "../src/parser";

describe("parseCzechBibleRef", () => {
  it("parses Mt 1,3", () => {
    const r = parseCzechBibleRef("Mt 1,3");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({ bookId: "MAT", chapterStart: 1, verseStart: 3 });
    }
  });

  it("parses Gn 22,1-19", () => {
    const r = parseCzechBibleRef("Gn 22,1-19");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({
        bookId: "GEN",
        chapterStart: 22,
        verseStart: 1,
        verseEnd: 19,
      });
    }
  });

  it("parses Iz 11", () => {
    const r = parseCzechBibleRef("Iz 11");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({ bookId: "ISA", chapterStart: 11 });
    }
  });
});