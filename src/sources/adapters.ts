// Pure module — no Obsidian imports, no DOM

import type { TranslationData } from '../provider';
import type { SourceProvider, RemoteTranslationEntry } from './catalog';

export interface SourceAdapter {
	buildUrl(provider: SourceProvider, entry: RemoteTranslationEntry): string;
	transform(raw: unknown): TranslationData;
}

// Populated by Task 18
const REGISTRY: Record<string, SourceAdapter> = {};

export function getAdapter(adapterType: string): SourceAdapter {
	const adapter = REGISTRY[adapterType];
	if (!adapter) throw new Error(`BibLens: unknown adapter type "${adapterType}"`);
	return adapter;
}
