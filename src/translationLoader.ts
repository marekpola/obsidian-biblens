import type { DataAdapter } from "obsidian";
import type { TranslationData } from "./provider";

function normaliseV1Keys(verses: Record<string, string>): TranslationData {
  const result: TranslationData = {};
  for (const [key, text] of Object.entries(verses)) {
    // "GEN 1:1" → "GEN.1.1"
    result[key.replace(/^(\S+) (\d+):(\d+)$/, '$1.$2.$3')] = text;
  }
  return result;
}

export async function loadTranslation(
  adapter: DataAdapter,
  pluginDir: string,
  name: string
): Promise<TranslationData> {
  const path = `${pluginDir}/translations/${name}.json`;
  const raw = await adapter.read(path);
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (!('formatVersion' in parsed)) {
    // Legacy format: flat Record<string, string>
    return parsed as TranslationData;
  }

  const version = parsed.formatVersion;
  if (version !== 1) {
    throw new Error(`BibLens: unsupported formatVersion ${String(version)} in ${name}.json`);
  }

  for (const field of ['id', 'name', 'lang', 'verses'] as const) {
    if (!(field in parsed)) {
      throw new Error(`BibLens: missing mandatory field '${field}' in ${name}.json`);
    }
  }

  return normaliseV1Keys(parsed.verses as Record<string, string>);
}
