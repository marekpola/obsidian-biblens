import { requestUrl } from 'obsidian';
import type { DataAdapter } from 'obsidian';
import type { LanguagePackProvider, RemoteLanguagePackEntry } from './sources/catalog';
import type { ReferenceFormatProvider, RemoteReferenceFormatEntry } from './sources/catalog';
import { getLanguagePackAdapter, getReferenceFormatAdapter } from './sources/adapters';

export async function downloadLanguagePack(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	provider: LanguagePackProvider,
	entry: RemoteLanguagePackEntry
): Promise<void> {
	const adapter = getLanguagePackAdapter(provider.adapterType);
	const url = adapter.buildUrl(provider, entry);
	const response = await requestUrl({ url });
	const file = adapter.transform(response.text);
	// Populate metadata from catalog entry — remote data may not include these fields
	file.id = entry.id;
	file.displayName = entry.displayName;
	file.lang = entry.language;
	await vaultAdapter.write(
		`${pluginDir}/recognition-languages/${entry.id}.json`,
		JSON.stringify(file, null, 2)
	);
}

export async function deleteLanguagePack(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	id: string
): Promise<void> {
	await vaultAdapter.remove(`${pluginDir}/recognition-languages/${id}.json`);
}

export async function downloadReferenceFormat(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	provider: ReferenceFormatProvider,
	entry: RemoteReferenceFormatEntry
): Promise<void> {
	const adapter = getReferenceFormatAdapter(provider.adapterType);
	const url = adapter.buildUrl(provider, entry);
	const response = await requestUrl({ url });
	const file = adapter.transform(response.text);
	await vaultAdapter.write(
		`${pluginDir}/reference-formats/${entry.id}.json`,
		JSON.stringify(file, null, 2)
	);
}

export async function deleteReferenceFormat(
	vaultAdapter: DataAdapter,
	pluginDir: string,
	id: string
): Promise<void> {
	await vaultAdapter.remove(`${pluginDir}/reference-formats/${id}.json`);
}
