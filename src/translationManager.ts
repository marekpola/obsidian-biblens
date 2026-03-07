import { requestUrl } from 'obsidian';
import type { DataAdapter } from 'obsidian';
import type { SourceProvider, RemoteTranslationEntry } from './sources/catalog';
import { getAdapter } from './sources/adapters';
import type { TranslationData } from './provider';

function toV1Key(internalKey: string): string {
	// "GEN.1.1" → "GEN 1:1"
	return internalKey.replace(/^(\S+)\.(\d+)\.(\d+)$/, '$1 $2:$3');
}

function buildV1Envelope(
	entry: RemoteTranslationEntry,
	provider: SourceProvider,
	data: TranslationData
): string {
	const verses: Record<string, string> = {};
	for (const [k, v] of Object.entries(data)) {
		verses[toV1Key(k)] = v;
	}
	return JSON.stringify({
		id: entry.id,
		name: entry.displayName,
		lang: entry.language,
		source: provider.displayName,
		formatVersion: 1,
		verses,
	}, null, 2);
}

export async function downloadFromSource(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	provider: SourceProvider,
	entry: RemoteTranslationEntry
): Promise<void> {
	const adapter = getAdapter(provider.adapterType);
	const url = adapter.buildUrl(provider, entry);
	const response = await requestUrl({ url });
	const data = adapter.transform(response.json);

	if (
		typeof data !== 'object' || data === null ||
		Array.isArray(data) ||
		Object.keys(data).length === 0
	) {
		throw new Error(`BibLens: adapter returned empty or invalid data for ${entry.id}`);
	}

	await vaultAdapter.write(
		`${pluginDir}/translations/${entry.id}.json`,
		buildV1Envelope(entry, provider, data)
	);
}

export async function deleteTranslation(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	id: string
): Promise<void> {
	await vaultAdapter.remove(`${pluginDir}/translations/${id}.json`);
}
