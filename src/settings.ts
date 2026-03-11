export interface BibLensSettings {
	preferredTranslation: string;
	preferredLanguage: string;
	standardReferenceFormat: string;
	parsingRules: 'strict' | 'extended';
	bundledPacksWritten: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: '',
	preferredLanguage: '',
	standardReferenceFormat: '',
	parsingRules: 'extended',
	bundledPacksWritten: {},
};
