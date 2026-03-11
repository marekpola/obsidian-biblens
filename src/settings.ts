export interface BibLensSettings {
	preferredTranslation: string;
	preferredLanguage: string;
	standardReferenceFormat: string;
	parsingRules: 'strict' | 'extended';
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: '',
	preferredLanguage: '',
	standardReferenceFormat: '',
	parsingRules: 'extended',
};
