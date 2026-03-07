// Pure module — no Obsidian imports, no DOM

import type { TranslationData } from '../provider';
import type { SourceProvider, RemoteTranslationEntry } from './catalog';

export interface SourceAdapter {
	buildUrl(provider: SourceProvider, entry: RemoteTranslationEntry): string;
	/** raw: string — either JSON text or XML text depending on the provider */
	transform(raw: unknown): TranslationData;
}

// Canonical USFM 3.0 book IDs in Protestant canonical order (position = book number - 1)
const USFM_BOOK_IDS: readonly string[] = [
	'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
	'1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
	'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
	'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
	'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
	'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO',
	'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI',
	'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
	'3JN', 'JUD', 'REV',
];

// ---------------------------------------------------------------------------
// GetBible v2 adapter
// URL:  https://api.getbible.net/v2/{translation}.json
// Format (JSON text):
//   { books: [{ nr: number, chapters: [{ chapter: number,
//     verses: [{ verse: number, text: string }] }] }] }
// ---------------------------------------------------------------------------

type GBVerse   = { verse: number; text: string };
type GBChapter = { chapter: number; verses: GBVerse[] };
type GBBook    = { nr: number; chapters: GBChapter[] };
type GBFull    = { books: GBBook[] };

const getBibleV2: SourceAdapter = {
	buildUrl(provider, entry) {
		return `${provider.baseUrl}/${entry.remoteId}.json`;
	},
	transform(raw) {
		const parsed = JSON.parse(raw as string) as GBFull;
		const result: TranslationData = {};
		for (const book of parsed.books ?? []) {
			const bookId = USFM_BOOK_IDS[book.nr - 1];
			if (!bookId) continue;
			for (const ch of book.chapters ?? []) {
				for (const v of ch.verses ?? []) {
					result[`${bookId}.${ch.chapter}.${v.verse}`] = v.text.trim();
				}
			}
		}
		return result;
	},
};

// ---------------------------------------------------------------------------
// Beblia XML adapter
// URL:  https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/{filename}
// Format (XML text):
//   <bible><testament><book number="N"><chapter number="N">
//     <verse number="N">text</verse>
// Parsed with regex to avoid DOM dependency.
// ---------------------------------------------------------------------------

function decodeXmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
}

const BOOK_RE    = /<book\s+number="(\d+)">([\s\S]*?)<\/book>/g;
const CHAPTER_RE = /<chapter\s+number="(\d+)">([\s\S]*?)<\/chapter>/g;
const VERSE_RE   = /<verse\s+number="(\d+)">([\s\S]*?)<\/verse>/g;

const bebliaXml: SourceAdapter = {
	buildUrl(provider, entry) {
		return `${provider.baseUrl}/${entry.remoteId}`;
	},
	transform(raw) {
		const xml = raw as string;
		const result: TranslationData = {};

		let bookMatch: RegExpExecArray | null;
		BOOK_RE.lastIndex = 0;
		while ((bookMatch = BOOK_RE.exec(xml)) !== null) {
			const bookId = USFM_BOOK_IDS[parseInt(bookMatch[1]!, 10) - 1];
			if (!bookId) continue;
			const bookContent = bookMatch[2]!;

			let chMatch: RegExpExecArray | null;
			CHAPTER_RE.lastIndex = 0;
			while ((chMatch = CHAPTER_RE.exec(bookContent)) !== null) {
				const chNr = chMatch[1]!;
				const chContent = chMatch[2]!;

				let vMatch: RegExpExecArray | null;
				VERSE_RE.lastIndex = 0;
				while ((vMatch = VERSE_RE.exec(chContent)) !== null) {
					const key = `${bookId}.${chNr}.${vMatch[1]!}`;
					result[key] = decodeXmlEntities((vMatch[2] ?? '').trim());
				}
			}
		}

		return result;
	},
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const REGISTRY: Record<string, SourceAdapter> = {
	'getbible-v2': getBibleV2,
	'beblia-xml':  bebliaXml,
};

export function getAdapter(adapterType: string): SourceAdapter {
	const adapter = REGISTRY[adapterType];
	if (!adapter) throw new Error(`BibLens: unknown adapter type "${adapterType}"`);
	return adapter;
}
