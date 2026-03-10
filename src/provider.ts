import type { BibleRef, ReferenceFormatRules } from "./types";
import { formatRef } from "./parser";

export type VerseEntry = { label: string; text: string };
export type TranslationData = Record<string, string>;

export function getVerses(data: TranslationData, ref: BibleRef, refFormat?: ReferenceFormatRules): VerseEntry[] {
  const entries: VerseEntry[] = [];

  const addChapterVerses = (chapter: number, fromVerse?: number, toVerse?: number) => {
    const prefix = `${ref.bookId}.${chapter}.`;
    const verseNums = Object.keys(data)
      .filter(k => k.startsWith(prefix))
      .map(k => parseInt(k.slice(prefix.length), 10))
      .filter(n => !isNaN(n) && (fromVerse === undefined || n >= fromVerse) && (toVerse === undefined || n <= toVerse))
      .sort((a, b) => a - b);
    for (const v of verseNums) {
      const text = data[`${prefix}${v}`];
      if (text === undefined) continue;
      const label = entries.length === 0 ? formatRef(ref, refFormat) : String(v);
      entries.push({ label, text });
    }
  };

  if (ref.verseStart === undefined) {
    // Chapter-only or chapter-range ref
    const chapterEnd = ref.chapterEnd ?? ref.chapterStart;
    for (let c = ref.chapterStart; c <= chapterEnd; c++) {
      addChapterVerses(c);
    }
    return entries;
  }

  const chapterEnd = ref.chapterEnd ?? ref.chapterStart;

  if (chapterEnd === ref.chapterStart) {
    // Same-chapter verse range
    addChapterVerses(ref.chapterStart, ref.verseStart, ref.verseEnd ?? ref.verseStart);
  } else {
    // Cross-chapter verse range
    addChapterVerses(ref.chapterStart, ref.verseStart);
    for (let c = ref.chapterStart + 1; c < chapterEnd; c++) {
      addChapterVerses(c);
    }
    addChapterVerses(chapterEnd, undefined, ref.verseEnd);
  }

  return entries;
}
