import { describe, it, expect } from "vitest";
import { getVerses } from "../src/provider";
import type { TranslationData } from "../src/provider";
import type { BibleRef } from "../src/types";

const data: TranslationData = {
  "GEN.1.1": "Na počátku stvořil Bůh nebe a zemi.",
  "GEN.1.2": "Země byla pustá a prázdná.",
  "GEN.1.3": "I řekl Bůh: Buď světlo!",
  "MAT.5.3": "Blahoslavení chudí duchem.",
};

describe("getVerses", () => {
  it("returns 3 entries for GEN 1,1-3", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries).toHaveLength(3);
  });

  it("first entry label is formatted ref, subsequent are verse numbers", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 };
    const entries = getVerses(data, ref);
    expect(entries[0]!.label).toBe("Gn 1,1-3");
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
    expect(entries[0]!.label).toBe("Mt 5,3");
    expect(entries[0]!.text).toBe("Blahoslavení chudí duchem.");
  });

  it("returns [] for chapter-only ref (no verseStart)", () => {
    const ref: BibleRef = { bookId: "GEN", chapterStart: 1 };
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
});
