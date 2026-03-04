import type { DataAdapter } from "obsidian";
import type { TranslationData } from "./provider";

export async function loadTranslation(
  adapter: DataAdapter,
  pluginDir: string,
  name: string
): Promise<TranslationData> {
  const path = `${pluginDir}/translations/${name}.json`;
  const raw = await adapter.read(path);
  return JSON.parse(raw) as TranslationData;
}
