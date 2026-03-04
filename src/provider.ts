import type { BibleRef } from "./types";
import { formatRef } from "./parser";

export type VerseEntry = { label: string; text: string };
export type TranslationData = Record<string, string>;

export function getVerses(data: TranslationData, ref: BibleRef): VerseEntry[] {
  const entries: VerseEntry[] = [];

  if (ref.verseStart === undefined) {
    // Chapter-only ref: collect all verses in the chapter from data keys
    const prefix = `${ref.bookId}.${ref.chapterStart}.`;
    const verseNums = Object.keys(data)
      .filter(k => k.startsWith(prefix))
      .map(k => parseInt(k.slice(prefix.length), 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    for (const v of verseNums) {
      const text = data[`${prefix}${v}`];
      if (text === undefined) continue;
      const label = entries.length === 0 ? formatRef(ref) : String(v);
      entries.push({ label, text });
    }
    return entries;
  }

  const verseEnd = ref.verseEnd ?? ref.verseStart;
  for (let v = ref.verseStart; v <= verseEnd; v++) {
    const key = `${ref.bookId}.${ref.chapterStart}.${v}`;
    const text = data[key];
    if (text === undefined) continue;
    const label = entries.length === 0 ? formatRef(ref) : String(v);
    entries.push({ label, text });
  }

  return entries;
}
