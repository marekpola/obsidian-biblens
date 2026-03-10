import { describe, it, expect } from "vitest";
import { parseCzechBibleRef, scanRefs, buildRefScanner, formatRef } from "../src/parser";
import { BOOK_ALIASES, BUILT_IN_FORMAT_RULES } from "../src/books";
import type { ReferenceFormatRules } from "../src/types";
import type { AbbreviationMap } from "../src/books";

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

  it("parses Gn 1-2 as chapter range", () => {
    const r = parseCzechBibleRef("Gn 1-2");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({ bookId: "GEN", chapterStart: 1, chapterEnd: 2 });
    }
  });

  it("parses Gn 1,1-2,20 as cross-chapter range", () => {
    const r = parseCzechBibleRef("Gn 1,1-2,20");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({
        bookId: "GEN",
        chapterStart: 1,
        verseStart: 1,
        chapterEnd: 2,
        verseEnd: 20,
      });
    }
  });

  it("parses Abd 2-3 as verse range in single-chapter book", () => {
    const r = parseCzechBibleRef("Abd 2-3");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({
        bookId: "OBA",
        chapterStart: 1,
        verseStart: 2,
        verseEnd: 3,
      });
    }
  });

  it("parses Abd 5 as single verse in single-chapter book", () => {
    const r = parseCzechBibleRef("Abd 5");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({
        bookId: "OBA",
        chapterStart: 1,
        verseStart: 5,
      });
    }
  });

  it("parses Abd 1,2 (explicit form) as verse in single-chapter book", () => {
    const r = parseCzechBibleRef("Abd 1,2");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ref).toEqual({
        bookId: "OBA",
        chapterStart: 1,
        verseStart: 2,
      });
    }
  });
});

describe("buildRefScanner – strict mode (BUILT_IN_FORMAT_RULES)", () => {
  const scanner = buildRefScanner(BOOK_ALIASES, BUILT_IN_FORMAT_RULES, "strict");

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

  it("detects Gen 1-2", () => {
    const matches = scanner.scan("Gen 1-2");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "GEN", chapterStart: 1, chapterEnd: 2 });
  });

  it("detects Gen 1:1-2:20", () => {
    const matches = scanner.scan("Gen 1:1-2:20");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({
      bookId: "GEN",
      chapterStart: 1,
      verseStart: 1,
      chapterEnd: 2,
      verseEnd: 20,
    });
  });

  it("does NOT detect Matt 1,3 in strict mode", () => {
    const matches = scanner.scan("Matt 1,3");
    expect(matches).toHaveLength(0);
  });

  it("detects Obad 5 as single verse in single-chapter book", () => {
    const matches = scanner.scan("Obad 5");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "OBA", chapterStart: 1, verseStart: 5 });
  });

  it("detects Obad 2-3 as verse range in single-chapter book", () => {
    const matches = scanner.scan("Obad 2-3");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "OBA", chapterStart: 1, verseStart: 2, verseEnd: 3 });
  });

  it("detects Jude 4 as single verse in single-chapter book", () => {
    const matches = scanner.scan("Jude 4");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "JUD", chapterStart: 1, verseStart: 4 });
  });
});

describe("buildRefScanner – extended mode", () => {
  const scanner = buildRefScanner(BOOK_ALIASES, BUILT_IN_FORMAT_RULES, "extended");

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

  it("detects Gen 1-2", () => {
    const matches = scanner.scan("Gen 1-2");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({ bookId: "GEN", chapterStart: 1, chapterEnd: 2 });
  });

  it("detects Gen 1,1-2,20", () => {
    const matches = scanner.scan("Gen 1,1-2,20");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref).toEqual({
      bookId: "GEN",
      chapterStart: 1,
      verseStart: 1,
      chapterEnd: 2,
      verseEnd: 20,
    });
  });

  it("skips blockquote lines", () => {
    expect(scanner.scan("> Matt 1:3")).toHaveLength(0);
  });
});

describe("formatRef with BUILT_IN_FORMAT_RULES", () => {
  it('produces "Gen 1:1"', () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 }, BUILT_IN_FORMAT_RULES)).toBe("Gen 1:1");
  });

  it('produces "Matt 1:3"', () => {
    expect(formatRef({ bookId: "MAT", chapterStart: 1, verseStart: 3 }, BUILT_IN_FORMAT_RULES)).toBe("Matt 1:3");
  });

  it('produces "Gen 22:1-19"', () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 22, verseStart: 1, verseEnd: 19 }, BUILT_IN_FORMAT_RULES)).toBe("Gen 22:1-19");
  });

  it('produces "Gen 1-2" for chapter range', () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, chapterEnd: 2 }, BUILT_IN_FORMAT_RULES)).toBe("Gen 1-2");
  });

  it('produces "Gen 1:1-2:20" for cross-chapter range', () => {
    expect(
      formatRef(
        { bookId: "GEN", chapterStart: 1, verseStart: 1, chapterEnd: 2, verseEnd: 20 },
        BUILT_IN_FORMAT_RULES
      )
    ).toBe("Gen 1:1-2:20");
  });

  it('produces "Obad 2-3" for single-chapter book', () => {
    expect(
      formatRef(
        { bookId: "OBA", chapterStart: 1, verseStart: 2, verseEnd: 3 },
        BUILT_IN_FORMAT_RULES
      )
    ).toBe("Obad 2-3");
  });

  it("falls back to default format", () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 })).toBe("Gen 1:1");
  });
});

describe("scanRefs – blockquote exclusion", () => {
  it("detects reference on normal line", () => {
    const matches = scanRefs("Ex 1,1");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.ref.bookId).toBe("EXO");
  });

  it("skips reference on blockquote line", () => {
    const matches = scanRefs("> Ex 1,1 — text");
    expect(matches).toHaveLength(0);
  });

  it("skips blockquote but detects following reference", () => {
    const text = "Ex 1,1\n> Ex 1,1 — inserted\nMt 5,3";
    const matches = scanRefs(text);
    expect(matches).toHaveLength(2);
    expect(matches[0]!.ref.bookId).toBe("EXO");
    expect(matches[1]!.ref.bookId).toBe("MAT");
  });
});

const CS_FORMAT: ReferenceFormatRules = {
  chapterVerseSeparator: ",",
  rangeSeparator: "-",
  bookChapterSeparator: " ",
  books: { GEN: "Gn", MAT: "Mt", ISA: "Iz" },
};

describe("buildRefScanner – multi-word alias in extended mode", () => {
  const multiWordMap: AbbreviationMap = { "1. mojžíšova": "GEN" };
  const scanner = buildRefScanner(multiWordMap, CS_FORMAT, "extended");

  it('detects "1. Mojžíšova 1,1"', () => {
    const m = scanner.scan("1. Mojžíšova 1,1");
    expect(m).toHaveLength(1);
    expect(m[0]!.ref).toEqual({ bookId: "GEN", chapterStart: 1, verseStart: 1 });
  });

  it('detects "1 Mojžíšova 1,1"', () => {
    expect(scanner.scan("1 Mojžíšova 1,1")).toHaveLength(1);
  });

  it('detects "1.Mojžíšova 1,1"', () => {
    expect(scanner.scan("1.Mojžíšova 1,1")).toHaveLength(1);
  });

  it('detects "1 Mojzisova 1,1" without diacritics', () => {
    expect(scanner.scan("1 Mojzisova 1,1")).toHaveLength(1);
  });

  it('does not match "1. Mojžíšova1,1"', () => {
    expect(scanner.scan("1. Mojžíšova1,1")).toHaveLength(0);
  });
});

describe("buildRefScanner – case sensitivity", () => {
  const strict = buildRefScanner(BOOK_ALIASES, CS_FORMAT, "strict");
  const extended = buildRefScanner(BOOK_ALIASES, CS_FORMAT, "extended");

  it("strict accepts canonical case", () => {
    expect(strict.scan("Mt 1,3")).toHaveLength(1);
  });

  it("strict rejects lowercase", () => {
    expect(strict.scan("mt 1,3")).toHaveLength(0);
  });

  it("extended accepts lowercase", () => {
    expect(extended.scan("mt 1,3")).toHaveLength(1);
  });

  it("extended accepts uppercase", () => {
    expect(extended.scan("MT 1,3")).toHaveLength(1);
  });
});

describe("buildRefScanner – separator enforcement", () => {
  const strict = buildRefScanner(BOOK_ALIASES, CS_FORMAT, "strict");
  const extended = buildRefScanner(BOOK_ALIASES, CS_FORMAT, "extended");

  it("strict requires comma", () => {
    expect(strict.scan("Gn 1,1")).toHaveLength(1);
  });

  it("strict rejects colon", () => {
    expect(strict.scan("Gn 1:1")).toHaveLength(0);
  });

  it("extended accepts colon", () => {
    expect(extended.scan("Gn 1:1")).toHaveLength(1);
  });

  it("extended accepts period", () => {
    expect(extended.scan("Gn 1.1")).toHaveLength(1);
  });

  it("detects cross-chapter range", () => {
    const m = extended.scan("Gn 1,1-2,20");
    expect(m).toHaveLength(1);
    expect(m[0]!.ref).toEqual({
      bookId: "GEN",
      chapterStart: 1,
      verseStart: 1,
      chapterEnd: 2,
      verseEnd: 20,
    });
  });
});