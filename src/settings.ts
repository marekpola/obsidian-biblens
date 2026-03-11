export interface BibLensSettings {
	preferredLanguage: string;
	standardReferenceFormat: string;
	parsingRules: 'strict' | 'extended';
	bundledPacksWritten: Record<string, boolean>;
	translationOrder: Record<string, number | null>;
	translationAbbreviations: Record<string, string>;
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredLanguage: '',
	standardReferenceFormat: '',
	parsingRules: 'extended',
	bundledPacksWritten: {},
	translationOrder: {},
	translationAbbreviations: {},
};
