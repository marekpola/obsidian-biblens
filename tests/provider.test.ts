import { describe, it, expect } from "vitest";
import { getVerses } from "../src/provider";
import type { TranslationData } from "../src/provider";
import type { BibleRef } from "../src/types";

const data: TranslationData = {
  "GEN.1.1": "Na počátku stvořil Bůh nebe a zemi.",
  "GEN.1.2": "Země byla pustá a prázdná.",
  "GEN.1.3": "I řekl Bůh: Buď světlo!",
  "GEN.2.1": "Tak byla dokončena nebesa i země.",
  "GEN.2.2": "Sedmého dne Bůh dokončil své dílo.",
  "MAT.5.3": "Blahoslavení chudí duchem.",
};

describe("getVerses", () => {
  it("returns 3 entries for GEN 1,1-3", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries).toHaveLength(3);
  });

  it("first entry label is first-verse ref only, subsequent are bare verse numbers", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries[0]!.label).toBe("Gen 1:1");
    expect(entries[1]!.label).toBe("2");
    expect(entries[2]!.label).toBe("3");
  });

  it("returns correct verse texts", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries[0]!.text).toBe("Na počátku stvořil Bůh nebe a zemi.");
    expect(entries[1]!.text).toBe("Země byla pustá a prázdná.");
    expect(entries[2]!.text).toBe("I řekl Bůh: Buď světlo!");
  });

  it("returns single entry for single verse ref", () => {
    const ref: BibleRef = { bookId: "MAT", chapterStart: 5, verseStart: 3 };
    const entries = getVerses(data, ref);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.label).toBe("Matt 5:3");
    expect(entries[0]!.text).toBe("Blahoslavení chudí duchem.");
  });

  it("returns all chapter verses for chapter-only ref; first label is first-verse ref", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1 };
    const entries = getVerses(data, ref);
    expect(entries).toHaveLength(3);
    expect(entries[0]!.label).toBe("Gen 1:1");
    expect(entries[1]!.label).toBe("2");
    expect(entries[2]!.label).toBe("3");
  });

  it("returns [] for chapter-only ref when chapter has no data", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 99 };
    expect(getVerses(data, ref)).toEqual([]);
  });

  it("skips missing keys silently", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 5 };
    // Only 1,1–1,3 exist; 1,4 and 1,5 are missing
    const entries = getVerses(data, ref);
    expect(entries).toHaveLength(3);
  });

  it("returns [] when no keys match at all", () => {
    const ref: BibleRef = { bookId: "REV", chapterStart: 99, verseStart: 1 };
    expect(getVerses(data, ref)).toEqual([]);
  });

  it("cross-chapter range: first label is first-verse ref, chapter boundary gets qualified label and chapterBreak", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 3, chapterEnd: 2, verseEnd: 1 };
    const entries = getVerses(data, ref);
    // GEN 1:3, GEN 2:1
    expect(entries).toHaveLength(2);
    expect(entries[0]!.label).toBe("Gen 1:3");
    expect(entries[0]!.chapterBreak).toBeUndefined();
    expect(entries[1]!.label).toBe("2:1");
    expect(entries[1]!.chapterBreak).toBe(true);
  });

  it("cross-chapter range: verses after the first in a new chapter use bare number without chapterBreak", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 3, chapterEnd: 2, verseEnd: 2 };
    const entries = getVerses(data, ref);
    // GEN 1:3, GEN 2:1 (boundary), GEN 2:2 (bare)
    expect(entries).toHaveLength(3);
    expect(entries[0]!.label).toBe("Gen 1:3");
    expect(entries[1]!.label).toBe("2:1");
    expect(entries[1]!.chapterBreak).toBe(true);
    expect(entries[2]!.label).toBe("2");
    expect(entries[2]!.chapterBreak).toBeUndefined();
  });

  it("same-chapter range has no chapterBreak entries", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries.every(e => !e.chapterBreak)).toBe(true);
  });
});
