// Pure module — no Obsidian imports

export type RemoteTranslationEntry = {
	id: string;          // local file id, e.g. "bkr"
	displayName: string; // e.g. "Bible Kralická"
	language: string;    // BCP 47, e.g. "cs"
	remoteId: string;    // provider-specific key used in URL construction
};

export type SourceProvider = {
	id: string;                             // e.g. "getbible-net"
	displayName: string;                    // e.g. "GetBible (getbible.net)"
	baseUrl: string;
	adapterType: string;                    // key into adapter registry
	translations: RemoteTranslationEntry[];
};

export type RemoteLanguagePackEntry = {
	id: string;
	displayName: string;
	language: string;
	remoteId: string;
};

export type LanguagePackProvider = {
	id: string;
	displayName: string;
	baseUrl: string;
	adapterType: string;
	packs: RemoteLanguagePackEntry[];
};

export type RemoteReferenceFormatEntry = {
	id: string;
	displayName: string;
	language: string;
	remoteId: string;
	rules?: { chapterVerseSeparator: string; rangeSeparator: string; bookChapterSeparator: string };
};

export type ReferenceFormatProvider = {
	id: string;
	displayName: string;
	baseUrl: string;
	adapterType: string;
	formats: RemoteReferenceFormatEntry[];
};

export const KNOWN_PROVIDERS = {
	translationProviders: [
		{
			id: 'biblens-data',
			displayName: 'BibLens Data (GitHub)',
			baseUrl: 'https://raw.githubusercontent.com/marekpola/biblens-data/main',
			adapterType: 'biblens-data',
			translations: [
				{ id: 'web', displayName: 'World English Bible', language: 'en', remoteId: 'web' },
			],
		},
		{
			id: 'getbible-net',
			displayName: 'GetBible (api.getbible.net)',
			baseUrl: 'https://api.getbible.net/v2',
			adapterType: 'getbible-v2',
			translations: [
				{ id: 'web', displayName: 'World English Bible',         language: 'en', remoteId: 'web' },
				{ id: 'kjv', displayName: 'King James Version',          language: 'en', remoteId: 'kjv' },
				{ id: 'asv', displayName: 'American Standard Version',   language: 'en', remoteId: 'asv' },
				{ id: 'bkr', displayName: 'Bible Kralická',              language: 'cs', remoteId: 'bkr' },
				{ id: 'cep', displayName: 'Český ekumenický překlad',    language: 'cs', remoteId: 'cep' },
			],
		},
		{
			id: 'beblia-xml',
			displayName: 'Beblia XML (GitHub)',
			baseUrl: 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master',
			adapterType: 'beblia-xml',
			translations: [
				{ id: 'niv',     displayName: 'New International Version',       language: 'en', remoteId: 'EnglishNIVBible.xml'         },
				{ id: 'esv',     displayName: 'English Standard Version',        language: 'en', remoteId: 'EnglishESVBible.xml'         },
				{ id: 'nasb',    displayName: 'New American Standard Bible',     language: 'en', remoteId: 'EnglishNASBBible.xml'        },
				{ id: 'nlt',     displayName: 'New Living Translation',          language: 'en', remoteId: 'EnglishNLTBible.xml'         },
				{ id: 'nkjv',    displayName: 'New King James Version',          language: 'en', remoteId: 'EnglishNKJBible.xml'         },
				{ id: 'cep2001', displayName: 'Český ekumenický překlad (2001)', language: 'cs', remoteId: 'CzechEkumenickyBible.xml'   },
				{ id: 'bkr1613', displayName: 'Bible Kralická (1613)',           language: 'cs', remoteId: 'CzechKralichka1613Bible.xml' },
				{ id: 'bkr1998', displayName: 'Bible Kralická (1998)',           language: 'cs', remoteId: 'CzechKralichka1998Bible.xml' },
			],
		},
	] as SourceProvider[],
	languagePackProviders: [
		{
			id: 'biblens-data',
			displayName: 'BibLens Data (GitHub)',
			baseUrl: 'https://raw.githubusercontent.com/marekpola/biblens-data/main',
			adapterType: 'biblens-data',
			packs: [
			{ id: 'en', displayName: 'English', language: 'en', remoteId: 'en' },	
			{ id: 'cs', displayName: 'Czech', language: 'cs', remoteId: 'cs' },
			],
		},
	] as LanguagePackProvider[],
	referenceFormatProviders: [
		{
			id: 'biblens-data',
			displayName: 'BibLens Data (GitHub)',
			baseUrl: 'https://raw.githubusercontent.com/marekpola/biblens-data/main',
			adapterType: 'biblens-data',
			formats: [
				{ id: 'en-sbl', displayName: 'English (SBL style)', language: 'en', remoteId: 'en-sbl' },
				{ id: 'cs-cek', displayName: 'Czech', language: 'cs', remoteId: 'cs-cek' },
			],
		},
	] as ReferenceFormatProvider[],
};