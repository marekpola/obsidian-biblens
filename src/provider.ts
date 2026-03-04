import type { BibleRef } from "./types";
import { formatRef } from "./parser";

export type VerseEntry = { label: string; text: string };
export type TranslationData = Record<string, string>;

export function getVerses(data: TranslationData, ref: BibleRef): VerseEntry[] {
  if (ref.verseStart === undefined) return [];

  const verseEnd = ref.verseEnd ?? ref.verseStart;
  const entries: VerseEntry[] = [];

  for (let v = ref.verseStart; v <= verseEnd; v++) {
    const key = `${ref.bookId}.${ref.chapterStart}.${v}`;
    const text = data[key];
    if (text === undefined) continue;
    const label = entries.length === 0 ? formatRef(ref) : String(v);
    entries.push({ label, text });
  }

  return entries;
}
