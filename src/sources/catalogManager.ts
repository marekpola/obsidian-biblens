import { requestUrl } from 'obsidian';
import type { DataAdapter } from 'obsidian';
import { KNOWN_PROVIDERS } from './catalog';
import type { SourceProvider } from './catalog';
import { getAdapter } from './adapters';
export { isCatalogStale } from './catalogUtils';

export const CATALOG_REMOTE_URL =
	'https://raw.githubusercontent.com/marekpola/obsidian-biblens/master/catalog/providers.json';

export type CatalogUpdateResult =
	| { ok: true; updatedAt: string; providerCount: number }
	| { ok: false; error: string };

type RemoteCatalog = {
	schemaVersion: number;
	updatedAt: string;
	providers: SourceProvider[];
};

function isValidProviders(arr: unknown): arr is SourceProvider[] {
	if (!Array.isArray(arr)) return false;
	return arr.every(p => {
		if (typeof p !== 'object' || p === null) return false;
		const o = p as Record<string, unknown>;
		return (
			typeof o.id === 'string' &&
			typeof o.displayName === 'string' &&
			typeof o.baseUrl === 'string' &&
			typeof o.adapterType === 'string' &&
			Array.isArray(o.translations)
		);
	});
}

function filterKnownAdapters(providers: SourceProvider[]): SourceProvider[] {
	return providers.filter(p => {
		try { getAdapter(p.adapterType); return true; } catch { return false; }
	});
}

export async function loadCatalog(
	adapter: DataAdapter,
	pluginDir: string
): Promise<SourceProvider[]> {
	try {
		const raw = await adapter.read(`${pluginDir}/catalog.json`);
		const parsed = JSON.parse(raw) as RemoteCatalog;
		if (isValidProviders(parsed.providers)) {
			return filterKnownAdapters(parsed.providers);
		}
	} catch {
		// fall through to bundled
	}
	return KNOWN_PROVIDERS;
}

export async function fetchCatalogUpdate(
	adapter: DataAdapter,
	pluginDir: string
): Promise<CatalogUpdateResult> {
	try {
		const response = await requestUrl({ url: CATALOG_REMOTE_URL });
		const parsed = response.json as RemoteCatalog;

		if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion !== 1) {
			return { ok: false, error: `Unsupported catalog schemaVersion: ${String(parsed.schemaVersion)}` };
		}
		if (!isValidProviders(parsed.providers)) {
			return { ok: false, error: 'Invalid catalog format: providers validation failed' };
		}

		const filtered = filterKnownAdapters(parsed.providers);
		const updatedAt = parsed.updatedAt ?? new Date().toISOString();
		const catalog: RemoteCatalog = { schemaVersion: 1, updatedAt, providers: filtered };

		await adapter.write(`${pluginDir}/catalog.json`, JSON.stringify(catalog, null, 2));
		return { ok: true, updatedAt, providerCount: filtered.length };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}
