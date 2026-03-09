export type InsertionFormat = 'inline' | 'blockquote';

export interface BibLensSettings {
	preferredTranslation: string;
	verseInsertionFormat: InsertionFormat;
	autoUpdateCatalog: boolean;
	catalogLastUpdated: string;
	preferredLanguage: string;
	standardReferenceFormat: string;
	parsingRules: 'strict' | 'extended';
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: 'cep',
	verseInsertionFormat: 'blockquote',
	autoUpdateCatalog: false,
	catalogLastUpdated: '',
	preferredLanguage: '',
	standardReferenceFormat: '',
	parsingRules: 'extended',
};
