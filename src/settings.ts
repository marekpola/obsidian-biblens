import type { CustomAbbreviations } from './books';

export type InsertionFormat = 'inline' | 'blockquote';

export interface BibLensSettings {
	preferredTranslation: string;
	customAbbreviations: CustomAbbreviations;
	verseInsertionFormat: InsertionFormat;
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: 'cep',
	customAbbreviations: {},
	verseInsertionFormat: 'inline',
};
