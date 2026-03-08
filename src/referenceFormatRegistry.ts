import type { DataAdapter } from 'obsidian';
import type { ReferenceFormatMeta } from './types';

export async function listAvailableReferenceFormats(
  adapter: DataAdapter,
  pluginDir: string
): Promise<ReferenceFormatMeta[]> {
  const dir = `${pluginDir}/reference-formats`;
  let listed: { files: string[] };
  try {
    listed = await adapter.list(dir);
  } catch {
    return [];
  }

  const results: ReferenceFormatMeta[] = [];
  for (const f of listed.files.filter(f => f.endsWith('.json'))) {
    const filename = f.split('/').pop() ?? f;
    const id = filename.replace(/\.json$/, '');
    try {
      const raw = await adapter.read(f);
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof parsed.id === 'string' &&
        typeof parsed.displayName === 'string' &&
        typeof parsed.lang === 'string'
      ) {
        results.push({ id: parsed.id, displayName: parsed.displayName, lang: parsed.lang });
      } else {
        results.push({ id, displayName: id, lang: '' });
      }
    } catch {
      results.push({ id, displayName: id, lang: '' });
    }
  }
  return results;
}
