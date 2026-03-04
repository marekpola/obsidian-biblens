import type { ParseResult, BibleRef } from "./types";
import { resolveBookId } from "./books";

export type RefMatch = {
  start: number;
  end: number;
  matchText: string;
  ref: BibleRef;
};

function candidateRegex() {
  return /\b((?:[1-3])?[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ][a-záčďéěíňóřšťůúýž]{0,10})\s+(\d+(?:[,:](?:\d+)(?:-\d+)?)?)/g;
}

export function scanRefs(text: string): RefMatch[] {
  const matches: RefMatch[] = [];
  const re = candidateRegex();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const matchText = m[0];
    const result = parseCzechBibleRef(matchText);
    if (result.ok) {
      matches.push({ start: m.index, end: m.index + matchText.length, matchText, ref: result.ref });
    }
  }
  return matches;
}

export function formatRef(ref: BibleRef): string {
  let s = `${ref.bookId} ${ref.chapterStart}`;
  if (ref.verseStart !== undefined) {
    s += `,${ref.verseStart}`;
    if (ref.verseEnd !== undefined) s += `-${ref.verseEnd}`;
  }
  return s;
}

function parseChapterVersePart(restRaw: string): Omit<BibleRef, "bookId"> | null {
  const rest = restRaw.trim();

  // Allow:
  // - "11"
  // - "1,3" or "1:3"
  // - "22,1-19" or "22:1-19"
  // (Future: "22,1-23,5")
  const m = /^(\d+)(?:[,:](\d+)(?:-(\d+))?)?$/.exec(rest);
  if (!m) return null;

  const chapterStart = Number(m[1]);
  const verseStart = m[2] ? Number(m[2]) : undefined;
  const verseEnd = m[3] ? Number(m[3]) : undefined;

  if (!Number.isFinite(chapterStart) || chapterStart <= 0) return null;
  if (verseStart !== undefined && (!Number.isFinite(verseStart) || verseStart <= 0)) return null;
  if (verseEnd !== undefined && (!Number.isFinite(verseEnd) || verseEnd <= 0)) return null;
  if (verseStart !== undefined && verseEnd !== undefined && verseEnd < verseStart) return null;

  return { chapterStart, verseStart, verseEnd };
}

export function parseCzechBibleRef(input: string): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: "Empty input" };

  // Split into book token + remainder.
  // Examples:
  // "Mt 1,3"  -> book="Mt", rest="1,3"
  // "1Kr 3,1" -> book="1Kr", rest="3,1"
  //
  // We require at least one whitespace between book and numbers for MVP.
  // (Future: allow "Mt1,3" as well.)
  const m = /^(.+?)\s+(.+)$/.exec(s);
  if (!m) return { ok: false, error: "Missing chapter/verse part" };

  const rawBook = m[1]!.trim();
  const rest = m[2]!.trim();

  const bookId = resolveBookId(rawBook);
  if (!bookId) return { ok: false, error: `Unknown book abbreviation: ${rawBook}` };

  const cv = parseChapterVersePart(rest);
  if (!cv) return { ok: false, error: `Invalid chapter/verse format: ${rest}` };

  return { ok: true, ref: { bookId, ...cv } };
}