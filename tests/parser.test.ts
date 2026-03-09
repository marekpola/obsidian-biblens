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

  it("falls back to English notation (BUILT_IN_FORMAT_RULES) when no refFormat given", () => {
    expect(formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 })).toBe("Gen 1:1");
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

// ── Task 39 – D026: alias alternation and per-mode regex ──────────────────────

// Minimal comma-notation format used as a fixture throughout these tests.
// bookChapterSeparator: " " (single space), chapterVerseSeparator: ","
const CS_FORMAT: ReferenceFormatRules = {
  chapterVerseSeparator: ',',
  rangeSeparator: '-',
  bookChapterSeparator: ' ',
  books: { GEN: 'Gn', MAT: 'Mt', ISA: 'Iz' },
};

describe("buildRefScanner – 39a: multi-word alias in extended mode", () => {
  // Normalized key matches the pattern produced by normalizeBookKey("1. Mojžíšova")
  const multiWordMap: AbbreviationMap = { '1. mojžíšova': 'GEN' };
  const scanner = buildRefScanner(multiWordMap, CS_FORMAT, 'extended');

  it('detects "1. Mojžíšova 1,1"', () => {
    const m = scanner.scan('1. Mojžíšova 1,1');
    expect(m).toHaveLength(1);
    expect(m[0]!.ref).toEqual({ bookId: 'GEN', chapterStart: 1, verseStart: 1 });
  });

  it('detects "1. MOJŽÍŠOVA 1,1" (uppercase – case-insensitive)', () => {
    const m = scanner.scan('1. MOJŽÍŠOVA 1,1');
    expect(m).toHaveLength(1);
    expect(m[0]!.ref.bookId).toBe('GEN');
  });

  it('does not match "1. Mojžíšova1,1" (no book-chapter space)', () => {
    expect(scanner.scan('1. Mojžíšova1,1')).toHaveLength(0);
  });
});

describe("buildRefScanner – 39b: case insensitivity in extended mode", () => {
  // BOOK_ALIASES contains normalizeBookKey("Mt") = "mt" → MAT
  const scanner = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'extended');

  it('detects "Mt 1,3" (title case)', () => {
    expect(scanner.scan('Mt 1,3')).toHaveLength(1);
  });

  it('detects "mt 1,3" (lowercase)', () => {
    expect(scanner.scan('mt 1,3')).toHaveLength(1);
  });

  it('detects "MT 1,3" (uppercase)', () => {
    expect(scanner.scan('MT 1,3')).toHaveLength(1);
  });

  it('detects "mT 1,3" (mixed case)', () => {
    expect(scanner.scan('mT 1,3')).toHaveLength(1);
  });
});

describe("buildRefScanner – 39c: case sensitivity in strict mode", () => {
  // CS_FORMAT.books has MAT: 'Mt' → canonical abbreviation is exactly "Mt"
  const scanner = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'strict');

  it('detects "Mt 1,3" (exact canonical case)', () => {
    expect(scanner.scan('Mt 1,3')).toHaveLength(1);
  });

  it('does NOT detect "mt 1,3" (lowercase)', () => {
    expect(scanner.scan('mt 1,3')).toHaveLength(0);
  });

  it('does NOT detect "MT 1,3" (uppercase)', () => {
    expect(scanner.scan('MT 1,3')).toHaveLength(0);
  });
});

describe("buildRefScanner – 39d: bookChapterSeparator enforced in strict mode", () => {
  const strict   = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'strict');
  const extended = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'extended');

  it('strict: "Gn 1,1" (single space) → matches', () => {
    expect(strict.scan('Gn 1,1')).toHaveLength(1);
  });

  it('strict: "Gn  1,1" (double space) → no match', () => {
    expect(strict.scan('Gn  1,1')).toHaveLength(0);
  });

  it('extended: "Gn  1,1" (double space) → matches (\\s+ relaxed)', () => {
    expect(extended.scan('Gn  1,1')).toHaveLength(1);
  });
});

describe("buildRefScanner – 39e: CV separator enforcement", () => {
  // CS_FORMAT: chapterVerseSeparator ","
  const strict   = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'strict');
  const extended = buildRefScanner(BOOK_ALIASES, CS_FORMAT, 'extended');

  it('strict: "Gn 1,1" (comma) → matches', () => {
    expect(strict.scan('Gn 1,1')).toHaveLength(1);
  });

  it('strict: "Gn 1:1" (colon) → no match', () => {
    expect(strict.scan('Gn 1:1')).toHaveLength(0);
  });

  it('extended: "Gn 1:1" (colon) → matches', () => {
    expect(extended.scan('Gn 1:1')).toHaveLength(1);
  });

  it('extended: "Gn 1.1" (period) → matches', () => {
    expect(extended.scan('Gn 1.1')).toHaveLength(1);
  });

  it('extended: "Gn 1,1" (comma) → matches', () => {
    expect(extended.scan('Gn 1,1')).toHaveLength(1);
  });
});

describe("buildRefScanner – 39f: empty alias source returns no-op scanner", () => {
  const emptyBooksFormat: ReferenceFormatRules = {
    chapterVerseSeparator: ':',
    rangeSeparator: '-',
    bookChapterSeparator: ' ',
    books: {},
  };

  it('strict with empty fmt.books → no matches, no crash', () => {
    const scanner = buildRefScanner(BOOK_ALIASES, emptyBooksFormat, 'strict');
    expect(scanner.scan('Gen 1:1')).toHaveLength(0);
  });

  it('extended with empty map → no matches, no crash', () => {
    const scanner = buildRefScanner({}, BUILT_IN_FORMAT_RULES, 'extended');
    expect(scanner.scan('Gen 1:1')).toHaveLength(0);
  });
});
