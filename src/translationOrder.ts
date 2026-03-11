import type { BibLensSettings } from './settings';
import type { TranslationData } from './provider';

export function migratePreferredTranslation(settings: BibLensSettings): boolean {
	const raw = settings as unknown as Record<string, unknown>;
	if (!('preferredTranslation' in raw)) return false;
	const id = raw['preferredTranslation'];
	if (typeof id === 'string' && id !== '') {
		if (!settings.translationOrder) settings.translationOrder = {};
		settings.translationOrder[id] = 1;
	}
	delete raw['preferredTranslation'];
	return true;
}

export function getActivePriority1Id(settings: BibLensSettings): string | undefined {
	return Object.entries(settings.translationOrder).find(([, priority]) => priority === 1)?.[0];
}

export function getActiveTranslations(
	settings: BibLensSettings,
	allData: Record<string, TranslationData>
): { id: string; abbreviation: string; data: TranslationData }[] {
	return Object.entries(settings.translationOrder)
		.filter(([id, priority]) => priority !== null && id in allData)
		.sort(([, a], [, b]) => (a as number) - (b as number))
		.map(([id]) => ({
			id,
			abbreviation: settings.translationAbbreviations[id] ?? id,
			data: allData[id]!,
		}));
}
