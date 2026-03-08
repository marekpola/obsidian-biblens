import type { BookId} from "./books";
import type { SourceProvider, LanguagePackProvider, ReferenceFormatProvider } from "./sources/catalog";

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

export type ParsingMode = 'strict' | 'extended';

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

export type CatalogData = {
  translationProviders: SourceProvider[];
  languagePackProviders: LanguagePackProvider[];
  referenceFormatProviders: ReferenceFormatProvider[];
};

export type LanguagePackFile = {
  id: string;
  displayName: string;
  lang: string;
  formatVersion: number;
  source?: string;
  books: Record<string, { aliases: string[] }>;
};

export type ReferenceFormatFile = {
  id: string;
  displayName: string;
  lang: string;
  formatVersion: number;
  source?: string;
  books: Record<string, string>;
  rules: {
    chapterVerseSeparator: string;
    rangeSeparator: string;
    bookChapterSeparator: string;
  };
};