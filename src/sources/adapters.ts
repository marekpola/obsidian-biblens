// Pure module — no Obsidian imports, no DOM

import type { TranslationData } from '../provider';
import type {
	SourceProvider, RemoteTranslationEntry,
	LanguagePackProvider, RemoteLanguagePackEntry,
	ReferenceFormatProvider, RemoteReferenceFormatEntry,
} from './catalog';
import type { LanguagePackFile, ReferenceFormatFile } from '../types';
import { osisToUsfm } from '../osisMapping';

export interface SourceAdapter {
	buildUrl(provider: SourceProvider, entry: RemoteTranslationEntry): string;
	/** raw: string — either JSON text or XML text depending on the provider */
	transform(raw: unknown): TranslationData;
}

export interface LanguagePackAdapter {
	buildUrl(provider: LanguagePackProvider, entry: RemoteLanguagePackEntry): string;
	transform(raw: unknown): LanguagePackFile;
}

export interface ReferenceFormatAdapter {
	buildUrl(provider: ReferenceFormatProvider, entry: RemoteReferenceFormatEntry): string;
	transform(raw: unknown): ReferenceFormatFile;
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
// Translation registry
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

// ---------------------------------------------------------------------------
// openbibleinfo language pack adapter
// URL: ${baseUrl}/src/${lang}/data.txt
// Format: tab-separated plain text with $VAR variable definitions and book alias lines.
// ---------------------------------------------------------------------------

function parseOpenbibleinfoVars(lines: string[]): Map<string, string[]> {
	const vars = new Map<string, string[]>();
	for (const line of lines) {
		if (!line.startsWith('$')) continue;
		const parts = line.split('\t');
		const name = parts[0]!.trim();
		const values = parts.slice(1).map(v => v.trim()).filter(v => v.length > 0);
		if (values.length > 0) vars.set(name, values);
	}
	return vars;
}

// Expand variable references ($FIRST, $SECOND, …) in a single alias template.
// Returns [] for regex patterns (containing ?, [, ]) or empty input.
function expandOpenbibleinfoAlias(template: string, vars: Map<string, string[]>): string[] {
	const t = template.trim();
	if (!t) return [];
	// Regex patterns used by the openbibleinfo parser internals — not literal aliases
	if (t.includes('?') || t.includes('[') || t.includes(']')) return [];
	const m = t.match(/\$[A-Z_]+/);
	if (!m) return [t];
	const varName = m[0];
	const values = vars.get(varName);
	if (!values || values.length === 0) return [t];
	const results: string[] = [];
	for (const val of values) {
		const expanded = t.replace(varName, val).replace(/\s{2,}/g, ' ').trim();
		results.push(...expandOpenbibleinfoAlias(expanded, vars));
	}
	return results;
}

const CANONICAL_USFM_SET = new Set<string>(USFM_BOOK_IDS);

const openbibleinfoLanguagePackAdapter: LanguagePackAdapter = {
	buildUrl(provider, entry) {
		return `${provider.baseUrl}/src/${entry.remoteId}/data.txt`;
	},
	transform(raw) {
		const lines = (raw as string).split('\n').map(l => l.trimEnd());
		const vars = parseOpenbibleinfoVars(lines);
		const books: Record<string, { aliases: string[] }> = {};

		for (const line of lines) {
			if (!line) continue;
			const c = line[0];
			// Skip comments (#), variable defs ($), preferred names (*), order entries (=)
			if (c === '#' || c === '$' || c === '*' || c === '=') continue;

			const parts = line.split('\t');
			const osisId = parts[0]!.trim();
			if (!osisId) continue;

			const usfmId = osisToUsfm(osisId);
			// Skip deuterocanonical books and any OSIS id not in the 66-book Protestant canon
			if (!usfmId || !CANONICAL_USFM_SET.has(usfmId)) continue;

			const seen = new Set<string>();
			const aliases: string[] = [];
			for (const tpl of parts.slice(1)) {
				for (const alias of expandOpenbibleinfoAlias(tpl, vars)) {
					if (!seen.has(alias)) {
						seen.add(alias);
						aliases.push(alias);
					}
				}
			}
			if (aliases.length === 0) continue;

			if (books[usfmId]) {
				for (const a of aliases) {
					if (!books[usfmId].aliases.includes(a)) books[usfmId].aliases.push(a);
				}
			} else {
				books[usfmId] = { aliases };
			}
		}

		return {
			id: '',           // populated by packManager from catalog entry
			displayName: '',  // populated by packManager from catalog entry
			lang: '',         // populated by packManager from catalog entry
			formatVersion: 1,
			source: 'openbibleinfo/Bible-Passage-Reference-Parser',
			books,
		};
	},
};

// ---------------------------------------------------------------------------
// biblens-catalog reference format adapter
// Fetches a pre-authored ReferenceFormatFile JSON from the BibLens repository.
// ---------------------------------------------------------------------------

const biblensCatalogFormatAdapter: ReferenceFormatAdapter = {
	buildUrl(provider, entry) {
		return `${provider.baseUrl}/${entry.remoteId}.json`;
	},
	transform(raw) {
		return JSON.parse(raw as string) as ReferenceFormatFile;
	},
};

// ---------------------------------------------------------------------------
// Language pack and reference format registries
// ---------------------------------------------------------------------------

const LANG_REGISTRY: Record<string, LanguagePackAdapter> = {
	'openbibleinfo': openbibleinfoLanguagePackAdapter,
};

const FORMAT_REGISTRY: Record<string, ReferenceFormatAdapter> = {
	'biblens-catalog': biblensCatalogFormatAdapter,
};

export function getLanguagePackAdapter(adapterType: string): LanguagePackAdapter {
	const adapter = LANG_REGISTRY[adapterType];
	if (!adapter) throw new Error(`BibLens: unknown language pack adapter type "${adapterType}"`);
	return adapter;
}

export function getReferenceFormatAdapter(adapterType: string): ReferenceFormatAdapter {
	const adapter = FORMAT_REGISTRY[adapterType];
	if (!adapter) throw new Error(`BibLens: unknown reference format adapter type "${adapterType}"`);
	return adapter;
}
