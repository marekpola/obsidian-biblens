export interface BibLensSettings {
	preferredTranslation: string;
	autoUpdateCatalog: boolean;
	catalogLastUpdated: string;
	preferredLanguage: string;
	standardReferenceFormat: string;
	parsingRules: 'strict' | 'extended';
}

export const DEFAULT_SETTINGS: BibLensSettings = {
	preferredTranslation: 'cep',
	autoUpdateCatalog: false,
	catalogLastUpdated: '',
	preferredLanguage: '',
	standardReferenceFormat: '',
	parsingRules: 'extended',
};
