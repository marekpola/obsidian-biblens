import { describe, it, expect } from "vitest";
import { parseCzechBibleRef, scanRefs } from "../src/parser";

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

describe("scanRefs – blockquote exclusion", () => {
  it("detects reference on a normal line", () => {
    const matches = scanRefs("Ex 1,1");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref.bookId).toBe("EXO");
  });

  it("skips reference on a blockquote line", () => {
    const matches = scanRefs("> Ex 1,1 — text");
    expect(matches).toHaveLength(0);
  });

  it("skips blockquote line but detects reference on normal line in same text", () => {
    const text = "Ex 1,1\n> Ex 1,1 — inserted\nMt 5,3";
    const matches = scanRefs(text);
    expect(matches).toHaveLength(2);
    expect(matches[0]!.ref.bookId).toBe("EXO");
    expect(matches[1]!.ref.bookId).toBe("MAT");
  });
});