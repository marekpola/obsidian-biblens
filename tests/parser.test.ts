import { describe, it, expect } from "vitest";
import { parseCzechBibleRef, scanRefs, buildRefScanner, formatRef } from "../src/parser";
import { BOOK_ALIASES, BUILT_IN_FORMAT_RULES } from "../src/books";

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

describe("buildRefScanner – strict mode (BUILT_IN_FORMAT_RULES)", () => {
  const scanner = buildRefScanner(BOOK_ALIASES, BUILT_IN_FORMAT_RULES, 'strict');

  it("detects Matt 1:3", () => {
    const matches = scanner.scan("Matt 1:3");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "MAT", chapterStart: 1, verseStart: 3 });
  });

  it("detects Gen 22:1-19", () => {
    const matches = scanner.scan("Gen 22:1-19");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "GEN", chapterStart: 22, verseStart: 1, verseEnd: 19 });
  });

  it("does NOT detect Matt 1,3 in strict mode", () => {
    const matches = scanner.scan("Matt 1,3");
    expect(matches).toHaveLength(0);
  });
});

describe("buildRefScanner – extended mode", () => {
  const scanner = buildRefScanner(BOOK_ALIASES, BUILT_IN_FORMAT_RULES, 'extended');

  it("detects Matt 1:3", () => {
    const matches = scanner.scan("Matt 1:3");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref.bookId).toBe("MAT");
  });

  it("additionally detects Matt 1,3", () => {
    const matches = scanner.scan("Matt 1,3");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "MAT", chapterStart: 1, verseStart: 3 });
  });

  it("additionally detects Gen 22,1-19", () => {
    const matches = scanner.scan("Gen 22,1-19");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "GEN", chapterStart: 22, verseStart: 1, verseEnd: 19 });
  });

  it("skips blockquote lines", () => {
    expect(scanner.scan("> Matt 1:3")).toHaveLength(0);
  });
});

describe("formatRef with BUILT_IN_FORMAT_RULES", () => {
  it('produces "Gen 1:1" for GEN 1,1', () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 }, BUILT_IN_FORMAT_RULES)).toBe("Gen 1:1");
  });

  it('produces "Matt 1:3" for MAT 1,3', () => {
    expect(formatRef({ bookId: "MAT", chapterStart: 1, verseStart: 3 }, BUILT_IN_FORMAT_RULES)).toBe("Matt 1:3");
  });

  it('produces "Gen 22:1-19" for range', () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 22, verseStart: 1, verseEnd: 19 }, BUILT_IN_FORMAT_RULES)).toBe("Gen 22:1-19");
  });

  it("falls back to Czech notation when no refFormat given", () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 })).toBe("Gn 1,1");
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