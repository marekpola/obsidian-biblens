import type { DataAdapter } from 'obsidian';
import type { AbbreviationMap } from './books';
import { normalizeBookKey } from './books';
import type { LanguagePackMeta } from './types';

type LanguagePackFile = {
  id: string;
  displayName: string;
  lang: string;
  formatVersion: number;
  source?: string;
  books: Record<string, { aliases: string[] }>;
};

export async function loadLanguagePack(
  adapter: DataAdapter,
  pluginDir: string,
  id: string
): Promise<{ map: AbbreviationMap; meta: LanguagePackMeta }> {
  const path = `${pluginDir}/recognition-languages/${id}.json`;
  const raw = await adapter.read(path);
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  for (const field of ['id', 'displayName', 'lang', 'formatVersion', 'books'] as const) {
    if (!(field in parsed)) {
      throw new Error(`BibLens: missing mandatory field '${field}' in recognition-languages/${id}.json`);
    }
  }

  if (parsed.formatVersion !== 1) {
    throw new Error(`BibLens: unsupported formatVersion ${String(parsed.formatVersion)} in recognition-languages/${id}.json`);
  }

  const file = parsed as unknown as LanguagePackFile;

  const map: AbbreviationMap = {};
  for (const [usfmId, bookData] of Object.entries(file.books)) {
    for (const alias of bookData.aliases) {
      map[normalizeBookKey(alias)] = usfmId as AbbreviationMap[string];
    }
  }

  const meta: LanguagePackMeta = {
    id: file.id,
    displayName: file.displayName,
    lang: file.lang,
  };

  return { map, meta };
}
