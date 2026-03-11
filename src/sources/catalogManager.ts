import type { DataAdapter } from 'obsidian';
import { KNOWN_PROVIDERS } from './catalog';
import type { SourceProvider, LanguagePackProvider, ReferenceFormatProvider } from './catalog';
import type { CatalogData } from '../types';

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

