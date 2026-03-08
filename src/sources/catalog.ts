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
			id: 'getbible-net',
			displayName: 'GetBible (api.getbible.net)',
			baseUrl: 'https://api.getbible.net/v2',
			adapterType: 'getbible-v2',
			translations: [
				{ id: 'bkr', displayName: 'Bible Kralická',              language: 'cs', remoteId: 'bkr' },
				{ id: 'cep', displayName: 'Český ekumenický překlad',    language: 'cs', remoteId: 'cep' },
				{ id: 'kjv', displayName: 'King James Version',          language: 'en', remoteId: 'kjv' },
				{ id: 'asv', displayName: 'American Standard Version',   language: 'en', remoteId: 'asv' },
				{ id: 'web', displayName: 'World English Bible',         language: 'en', remoteId: 'web' },
			],
		},
		{
			id: 'beblia-xml',
			displayName: 'Beblia Holy Bible XML (GitHub)',
			baseUrl: 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master',
			adapterType: 'beblia-xml',
			translations: [
				{ id: 'cep2001', displayName: 'Český ekumenický překlad (2001)', language: 'cs', remoteId: 'CzechEkumenickyBible.xml'   },
				{ id: 'bkr1613', displayName: 'Bible Kralická (1613)',           language: 'cs', remoteId: 'CzechKralichka1613Bible.xml' },
				{ id: 'bkr1998', displayName: 'Bible Kralická (1998)',           language: 'cs', remoteId: 'CzechKralichka1998Bible.xml' },
				{ id: 'niv',     displayName: 'New International Version',       language: 'en', remoteId: 'EnglishNIVBible.xml'         },
				{ id: 'esv',     displayName: 'English Standard Version',        language: 'en', remoteId: 'EnglishESVBible.xml'         },
				{ id: 'nasb',    displayName: 'New American Standard Bible',      language: 'en', remoteId: 'EnglishNASBBible.xml'        },
				{ id: 'nlt',     displayName: 'New Living Translation',           language: 'en', remoteId: 'EnglishNLTBible.xml'         },
				{ id: 'nkjv',    displayName: 'New King James Version',           language: 'en', remoteId: 'EnglishNKJBible.xml'         },
			],
		},
	] as SourceProvider[],
	languagePackProviders: [
		{
			id: 'openbibleinfo',
			displayName: 'openbibleinfo (Bible-Passage-Reference-Parser)',
			baseUrl: 'https://raw.githubusercontent.com/openbibleinfo/Bible-Passage-Reference-Parser/master',
			adapterType: 'openbibleinfo',
			packs: [
				{ id: 'cs', displayName: 'Czech',       language: 'cs', remoteId: 'cs' },
				{ id: 'en', displayName: 'English',     language: 'en', remoteId: 'en' },
				{ id: 'de', displayName: 'German',      language: 'de', remoteId: 'de' },
				{ id: 'pl', displayName: 'Polish',      language: 'pl', remoteId: 'pl' },
				{ id: 'sk', displayName: 'Slovak',      language: 'sk', remoteId: 'sk' },
				{ id: 'hu', displayName: 'Hungarian',   language: 'hu', remoteId: 'hu' },
				{ id: 'ro', displayName: 'Romanian',    language: 'ro', remoteId: 'ro' },
				{ id: 'uk', displayName: 'Ukrainian',   language: 'uk', remoteId: 'uk' },
				{ id: 'ru', displayName: 'Russian',     language: 'ru', remoteId: 'ru' },
				{ id: 'fr', displayName: 'French',      language: 'fr', remoteId: 'fr' },
				{ id: 'it', displayName: 'Italian',     language: 'it', remoteId: 'it' },
				{ id: 'es', displayName: 'Spanish',     language: 'es', remoteId: 'es' },
				{ id: 'pt', displayName: 'Portuguese',  language: 'pt', remoteId: 'pt' },
				{ id: 'nl', displayName: 'Dutch',       language: 'nl', remoteId: 'nl' },
			],
		},
	] as LanguagePackProvider[],
	referenceFormatProviders: [
		{
			id: 'openbibleinfo',
			displayName: 'openbibleinfo (Bible-Passage-Reference-Parser)',
			baseUrl: 'https://raw.githubusercontent.com/openbibleinfo/Bible-Passage-Reference-Parser/master',
			adapterType: 'openbibleinfo',
			formats: [
				{ id: 'cs', displayName: 'Czech',    language: 'cs', remoteId: 'cs', rules: { chapterVerseSeparator: ',', rangeSeparator: '-', bookChapterSeparator: ' ' } },
				{ id: 'en', displayName: 'English',  language: 'en', remoteId: 'en', rules: { chapterVerseSeparator: ':', rangeSeparator: '-', bookChapterSeparator: ' ' } },
				{ id: 'de', displayName: 'German',   language: 'de', remoteId: 'de', rules: { chapterVerseSeparator: ',', rangeSeparator: '-', bookChapterSeparator: ' ' } },
			],
		},
	] as ReferenceFormatProvider[],
};
