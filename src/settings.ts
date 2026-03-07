import type { CustomAbbreviations } from './books';

export type InsertionFormat = 'inline' | 'blockquote';

export interface BibLensSettings {
	preferredTranslation: string;
	customAbbreviations: CustomAbbreviations;
	verseInsertionFormat: InsertionFormat;
	autoUpdateCatalog: boolean;
	catalogLastUpdated: string;
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: 'cep',
	customAbbreviations: {},
	verseInsertionFormat: 'blockquote',
	autoUpdateCatalog: false,
	catalogLastUpdated: '',
};
