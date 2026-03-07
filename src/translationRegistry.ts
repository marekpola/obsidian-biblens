import type { DataAdapter } from 'obsidian';
import type { TranslationMeta } from './types';

export async function listAvailableTranslations(
	adapter: DataAdapter,
	pluginDir: string
): Promise<TranslationMeta[]> {
	const dir = `${pluginDir}/translations`;
	let listed: { files: string[] };
	try {
		listed = await adapter.list(dir);
	} catch {
		return [];
	}

	const results: TranslationMeta[] = [];
	for (const f of listed.files.filter(f => f.endsWith('.json'))) {
		const filename = f.split('/').pop() ?? f;
		const id = filename.replace(/\.json$/, '');
		let displayName = id.toUpperCase();
		let lang: string | undefined;
		try {
			const raw = await adapter.read(f);
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			if ('formatVersion' in parsed && typeof parsed.name === 'string') {
				displayName = parsed.name;
			}
			if (typeof parsed.lang === 'string') {
				lang = parsed.lang;
			}
		} catch {
			// fall back to filename-derived displayName
		}
		results.push(lang !== undefined ? { id, displayName, lang } : { id, displayName });
	}
	return results;
}
