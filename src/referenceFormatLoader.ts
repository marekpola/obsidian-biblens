import type { DataAdapter } from 'obsidian';
import type { ReferenceFormatMeta, ReferenceFormatRules } from './types';

type ReferenceFormatFile = {
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

export async function loadReferenceFormat(
  adapter: DataAdapter,
  pluginDir: string,
  id: string
): Promise<{ rules: ReferenceFormatRules; meta: ReferenceFormatMeta }> {
  const path = `${pluginDir}/reference-formats/${id}.json`;
  const raw = await adapter.read(path);
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  for (const field of ['id', 'displayName', 'lang', 'formatVersion', 'books', 'rules'] as const) {
    if (!(field in parsed)) {
      throw new Error(`BibLens: missing mandatory field '${field}' in reference-formats/${id}.json`);
    }
  }

  if (parsed.formatVersion !== 1) {
    throw new Error(`BibLens: unsupported formatVersion ${String(parsed.formatVersion)} in reference-formats/${id}.json`);
  }

  const file = parsed as unknown as ReferenceFormatFile;

  const rules: ReferenceFormatRules = {
    chapterVerseSeparator: file.rules.chapterVerseSeparator,
    rangeSeparator: file.rules.rangeSeparator,
    bookChapterSeparator: file.rules.bookChapterSeparator,
    books: file.books,
  };

  const meta: ReferenceFormatMeta = {
    id: file.id,
    displayName: file.displayName,
    lang: file.lang,
  };

  return { rules, meta };
}
