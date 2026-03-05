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

	return listed.files
		.filter(f => f.endsWith('.json'))
		.map(f => {
			const filename = f.split('/').pop() ?? f;
			const id = filename.replace(/\.json$/, '');
			return { id, displayName: id.toUpperCase() };
		});
}
