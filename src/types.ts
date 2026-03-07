import type { BookId} from "./books";

export type TranslationMeta = {
  id: string;
  displayName: string;
  lang?: string;
};

export type BibleRef = {
  bookId: BookId;
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
};

export type ParseResult =
  | { ok: true; ref: BibleRef }
  | { ok: false; error: string };