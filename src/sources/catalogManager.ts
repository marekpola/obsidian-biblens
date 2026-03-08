import { requestUrl } from 'obsidian';
import type { DataAdapter } from 'obsidian';
import { KNOWN_PROVIDERS } from './catalog';
import type { SourceProvider, LanguagePackProvider, ReferenceFormatProvider } from './catalog';
import { getAdapter, getLanguagePackAdapter, getReferenceFormatAdapter } from './adapters';
import type { CatalogData } from '../types';
export { isCatalogStale } from './catalogUtils';

export const CATALOG_REMOTE_URL =
	'https://raw.githubusercontent.com/marekpola/obsidian-biblens/master/catalog/providers.json';

export type CatalogUpdateResult =
	| { ok: true; updatedAt: string; providerCount: number }
	| { ok: false; error: string };

type RemoteCatalogV2 = {
	schemaVersion: 2;
	updatedAt: string;
	translationProviders: SourceProvider[];
	languagePackProviders: LanguagePackProvider[];
	referenceFormatProviders: ReferenceFormatProvider[];
};

function isValidSourceProviders(arr: unknown): arr is SourceProvider[] {
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

function filterCatalog(data: CatalogData): CatalogData {
	return {
		translationProviders: data.translationProviders.filter(p => {
			try { getAdapter(p.adapterType); return true; } catch { return false; }
		}),
		languagePackProviders: data.languagePackProviders.filter(p => {
			try { getLanguagePackAdapter(p.adapterType); return true; } catch { return false; }
		}),
		referenceFormatProviders: data.referenceFormatProviders.filter(p => {
			try { getReferenceFormatAdapter(p.adapterType); return true; } catch { return false; }
		}),
	};
}

export async function loadCatalog(
	adapter: DataAdapter,
	pluginDir: string
): Promise<CatalogData> {
	try {
		const raw = await adapter.read(`${pluginDir}/catalog.json`);
		const parsed = JSON.parse(raw) as RemoteCatalogV2;
		if (
			parsed.schemaVersion === 2 &&
			isValidSourceProviders(parsed.translationProviders) &&
			Array.isArray(parsed.languagePackProviders) &&
			Array.isArray(parsed.referenceFormatProviders)
		) {
			return {
				translationProviders: parsed.translationProviders,
				languagePackProviders: parsed.languagePackProviders,
				referenceFormatProviders: parsed.referenceFormatProviders,
			};
		}
	} catch {
		// fall through to bundled
	}
	return {
		translationProviders: KNOWN_PROVIDERS.translationProviders,
		languagePackProviders: KNOWN_PROVIDERS.languagePackProviders,
		referenceFormatProviders: KNOWN_PROVIDERS.referenceFormatProviders,
	};
}

export async function fetchCatalogUpdate(
	adapter: DataAdapter,
	pluginDir: string
): Promise<CatalogUpdateResult> {
	try {
		const response = await requestUrl({ url: CATALOG_REMOTE_URL });
		const parsed = response.json as RemoteCatalogV2;

		if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion !== 2) {
			return { ok: false, error: `Unsupported catalog schemaVersion: ${String(parsed.schemaVersion)}` };
		}
		if (!isValidSourceProviders(parsed.translationProviders)) {
			return { ok: false, error: 'Invalid catalog format: translationProviders validation failed' };
		}
		if (!Array.isArray(parsed.languagePackProviders) || !Array.isArray(parsed.referenceFormatProviders)) {
			return { ok: false, error: 'Invalid catalog format: missing provider arrays' };
		}

		const filtered = filterCatalog({
			translationProviders: parsed.translationProviders,
			languagePackProviders: parsed.languagePackProviders,
			referenceFormatProviders: parsed.referenceFormatProviders,
		});

		const updatedAt = parsed.updatedAt ?? new Date().toISOString();
		const catalog: RemoteCatalogV2 = {
			schemaVersion: 2,
			updatedAt,
			translationProviders: filtered.translationProviders,
			languagePackProviders: filtered.languagePackProviders,
			referenceFormatProviders: filtered.referenceFormatProviders,
		};

		await adapter.write(`${pluginDir}/catalog.json`, JSON.stringify(catalog, null, 2));
		return {
			ok: true,
			updatedAt,
			providerCount:
				filtered.translationProviders.length +
				filtered.languagePackProviders.length +
				filtered.referenceFormatProviders.length,
		};
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}
