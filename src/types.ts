export type BibleBookAbbrev = string;

export type BibleRef = {
  book: BibleBookAbbrev;
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
};

export type ParseResult =
  | { ok: true; ref: BibleRef }
  | { ok: false; error: string };