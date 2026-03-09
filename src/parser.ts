import type { ParseResult, BibleRef, ReferenceFormatRules, ParsingMode } from "./types";
import { resolveBookId, getDisplayAbbr, normalizeBookKey, BUILT_IN_FORMAT_RULES } from "./books";
import type { AbbreviationMap, BookId } from "./books";

export type RefMatch = {
  start: number;
  end: number;
  matchText: string;
  ref: BibleRef;
};

export type RefScanner = { scan(text: string): RefMatch[] };

function candidateRegex() {
  return /\b((?:[1-3])?[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ][a-záčďéěíňóřšťůúýž]{0,10})\s+(\d+(?:[,:](?:\d+)(?:-\d+)?)?)/g;
}

export function scanRefs(text: string): RefMatch[] {
  const matches: RefMatch[] = [];
  const re = candidateRegex();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const lineStart = text.lastIndexOf('\n', m.index - 1) + 1;
    if (text[lineStart] === '>') continue;
    const matchText = m[0];
    const result = parseCzechBibleRef(matchText);
    if (result.ok) {
      matches.push({ start: m.index, end: m.index + matchText.length, matchText, ref: result.ref });
    }
  }
  return matches;
}

export function formatRef(ref: BibleRef, refFormat?: ReferenceFormatRules): string {
  const abbr = refFormat?.books[ref.bookId] ?? getDisplayAbbr(ref.bookId);
  const bookChapSep = refFormat?.bookChapterSeparator ?? ' ';
  const cvSep = refFormat?.chapterVerseSeparator ?? ',';
  const rangeSep = refFormat?.rangeSeparator ?? '-';
  let s = `${abbr}${bookChapSep}${ref.chapterStart}`;
  if (ref.verseStart !== undefined) {
    s += `${cvSep}${ref.verseStart}`;
    if (ref.verseEnd !== undefined) s += `${rangeSep}${ref.verseEnd}`;
  }
  return s;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Shared cv-extraction helper. Accepts a precompiled regex and the raw matched
// string; validates numeric ranges; returns structured chapter/verse fields.
function parseCVPart(rest: string, cvRe: RegExp): Omit<BibleRef, 'bookId'> | null {
  const m = cvRe.exec(rest.trim());
  if (!m) return null;

  const chapterStart = Number(m[1]);
  const verseStart   = m[2] ? Number(m[2]) : undefined;
  const verseEnd     = m[3] ? Number(m[3]) : undefined;

  if (!Number.isFinite(chapterStart) || chapterStart <= 0) return null;
  if (verseStart !== undefined && (!Number.isFinite(verseStart) || verseStart <= 0)) return null;
  if (verseEnd   !== undefined && (!Number.isFinite(verseEnd)   || verseEnd   <= 0)) return null;
  if (verseStart !== undefined && verseEnd !== undefined && verseEnd < verseStart) return null;

  return { chapterStart, verseStart, verseEnd };
}

// Legacy cv regex used by parseCzechBibleRef (comma or colon only).
// Kept as a module-level constant so parseChapterVersePart stays a thin wrapper.
const LEGACY_CV_RE = /^(\d+)(?:[,:](\d+)(?:-(\d+))?)?$/;

function parseChapterVersePart(restRaw: string): Omit<BibleRef, 'bookId'> | null {
  return parseCVPart(restRaw, LEGACY_CV_RE);
}

export function buildRefScanner(
  map: AbbreviationMap,
  format?: ReferenceFormatRules,
  mode?: ParsingMode
): RefScanner {
  const fmt         = format ?? BUILT_IN_FORMAT_RULES;
  const parsingMode = mode   ?? 'strict';

  // ── 1. Alias set ─────────────────────────────────────────────────────────────
  // Strict:   canonical abbreviations from the active format pack only.
  // Extended: all aliases from the active language pack.
  const rawAliases: string[] =
    parsingMode === 'strict'
      ? Object.values(fmt.books)
      : Object.keys(map);

  if (rawAliases.length === 0) {
    return { scan: () => [] };
  }

  // Longest-first so multi-word aliases are tried before their shorter prefixes.
  const sortedAliases = [...rawAliases].sort((a, b) => b.length - a.length);
  const bookAlt       = sortedAliases.map(escapeRegex).join('|');

  // ── 2. Book–chapter separator ─────────────────────────────────────────────────
  // Strict:   exact character(s) from the format pack.
  // Extended: any whitespace.
  const bookChapPat =
    parsingMode === 'strict' && fmt.bookChapterSeparator
      ? escapeRegex(fmt.bookChapterSeparator)
      : '\\s+';

  // ── 3. CV separators ──────────────────────────────────────────────────────────
  const cvSepEsc    = escapeRegex(fmt.chapterVerseSeparator);
  const rangeSepEsc = escapeRegex(fmt.rangeSeparator);

  // ── 4. CV scan pattern ────────────────────────────────────────────────────────
  // Strict: negative lookahead rejects chapter numbers immediately followed by
  // an alternative separator (e.g. comma when the format uses colon), preventing
  // a chapter-only match like "Matt 1" from consuming "Matt 1,3".
  const altCvSeps = [',', ':'].filter(s => s !== fmt.chapterVerseSeparator).map(escapeRegex);
  const negLookahead = altCvSeps.length > 0 ? `(?![${altCvSeps.join('')}])` : '';
  const cvScanPat =
    parsingMode === 'strict'
      ? `\\d+${negLookahead}(?:${cvSepEsc}\\d+(?:${rangeSepEsc}\\d+)?)?`
      : `\\d+(?:[,:.] ?\\d+(?:-\\d+)?)?`;

  // ── 5. Main scan regex (precompiled once) ─────────────────────────────────────
  // Extended mode uses the 'i' flag: normalized lowercase map keys match any
  // case variant in the source text.
  const flags = parsingMode === 'strict' ? 'g' : 'gi';
  const re    = new RegExp(`\\b(${bookAlt})${bookChapPat}(${cvScanPat})`, flags);

  // ── 6. CV extraction regex (precompiled once) ─────────────────────────────────
  // Strict:   enforces exact separators from the format pack.
  // Extended: accepts comma, colon, or period; optional whitespace after separator.
  const cvExtractRe: RegExp =
    parsingMode === 'strict'
      ? new RegExp(`^(\\d+)(?:${cvSepEsc}(\\d+)(?:${rangeSepEsc}(\\d+))?)?$`)
      : /^(\d+)(?:[,:.]\s*(\d+)(?:-(\d+))?)?$/;

  // ── 7. Alias → BookId lookup ──────────────────────────────────────────────────
  // Strict:   invert fmt.books (USFM_ID → canonical abbr) to (normalizedAbbr → USFM_ID).
  //           The map parameter is not used for book matching in strict mode.
  // Extended: map keys are already normalized; used directly.
  let aliasToId: Record<string, BookId>;
  if (parsingMode === 'strict') {
    aliasToId = {} as Record<string, BookId>;
    for (const [id, abbr] of Object.entries(fmt.books)) {
      aliasToId[normalizeBookKey(abbr)] = id as BookId;
    }
  } else {
    aliasToId = map;
  }

  // ── 8. Scanner ────────────────────────────────────────────────────────────────
  return {
    scan(text: string): RefMatch[] {
      const matches: RefMatch[] = [];
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const lineStart = text.lastIndexOf('\n', m.index - 1) + 1;
        if (text[lineStart] === '>') continue;

        const rawBook = m[1]!;
        const bookId  = aliasToId[normalizeBookKey(rawBook)];
        if (!bookId) continue;

        const cv = parseCVPart(m[2]!, cvExtractRe);
        if (!cv) continue;

        const matchText = m[0];
        matches.push({ start: m.index, end: m.index + matchText.length, matchText, ref: { bookId, ...cv } });
      }
      return matches;
    },
  };
}

export function parseCzechBibleRef(input: string): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: "Empty input" };

  // Split into book token + remainder.
  // Examples:
  // "Mt 1,3"  -> book="Mt", rest="1,3"
  // "1Kr 3,1" -> book="1Kr", rest="3,1"
  //
  // We require at least one whitespace between book and numbers for MVP.
  // (Future: allow "Mt1,3" as well.)
  const m = /^(.+?)\s+(.+)$/.exec(s);
  if (!m) return { ok: false, error: "Missing chapter/verse part" };

  const rawBook = m[1]!.trim();
  const rest    = m[2]!.trim();

  const bookId = resolveBookId(rawBook);
  if (!bookId) return { ok: false, error: `Unknown book abbreviation: ${rawBook}` };

  const cv = parseChapterVersePart(rest);
  if (!cv) return { ok: false, error: `Invalid chapter/verse format: ${rest}` };

  return { ok: true, ref: { bookId, ...cv } };
}
