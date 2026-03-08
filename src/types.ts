import type { BookId} from "./books";

export type LanguagePackMeta = {
  id: string;
  displayName: string;
  lang: string;
};

export type ReferenceFormatMeta = {
  id: string;
  displayName: string;
  lang: string;
};

export type ReferenceFormatRules = {
  chapterVerseSeparator: string;
  rangeSeparator: string;
  bookChapterSeparator: string;
  books: Record<string, string>;
};

export type TranslationMeta = {
  id: string;
  displayName: string;
  lang?: string;
  source?: string;
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