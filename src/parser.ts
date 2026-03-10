import type { ParseResult, BibleRef, ReferenceFormatRules, ParsingMode } from "./types";
import { resolveBookId, normalizeBookKey, BUILT_IN_FORMAT_RULES, SINGLE_CHAPTER_BOOKS } from "./books";
import type { AbbreviationMap, BookId } from "./books";

export type RefMatch = {
  start: number;
  end: number;
  matchText: string;
  ref: BibleRef;
};

export type RefScanner = { scan(text: string): RefMatch[] };

function candidateRegex() {
  return /\b((?:[1-3](?:\.)?\s*)?\p{Lu}[\p{L}\p{M}.-]{0,30})\s+(\d+(?:\s*-\s*\d+|(?:[,:.]\s*\d+)(?:\s*-\s*(?:\d+|\d+[,:.]\s*\d+))?)?)/gu;
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
  const fmt = refFormat ?? BUILT_IN_FORMAT_RULES;
  const abbr = fmt.books[ref.bookId] ?? ref.bookId;
  const bookChapSep = fmt.bookChapterSeparator;
  const cvSep = fmt.chapterVerseSeparator;
  const rangeSep = fmt.rangeSeparator;
  const isSingleChapter = SINGLE_CHAPTER_BOOKS.has(ref.bookId);

  if (isSingleChapter && ref.verseStart !== undefined) {
    let s = `${abbr}${bookChapSep}${ref.verseStart}`;
    if (ref.verseEnd !== undefined) s += `${rangeSep}${ref.verseEnd}`;
    return s;
  }

  let s = `${abbr}${bookChapSep}${ref.chapterStart}`;

  if (ref.verseStart === undefined) {
    if (ref.chapterEnd !== undefined) s += `${rangeSep}${ref.chapterEnd}`;
    return s;
  }

  s += `${cvSep}${ref.verseStart}`;

  if (ref.chapterEnd !== undefined && ref.verseEnd !== undefined) {
    s += `${rangeSep}${ref.chapterEnd}${cvSep}${ref.verseEnd}`;
    return s;
  }

  if (ref.verseEnd !== undefined) {
    s += `${rangeSep}${ref.verseEnd}`;
  }

  return s;
}


function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}+/gu, '');
}

function normalizeLooseBookKey(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/^([1-3])\.(?=\S)/, '$1 ')
    .replace(/^([1-3])\.\s+/, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLooseText(text: string): { text: string; indexMap: number[] } {
  let out = '';
  const indexMap: number[] = [];
  let prevSpace = false;

  for (let i = 0; i < text.length; i++) {
    const normalized = stripDiacritics(text[i]!).toLowerCase();
    if (!normalized) continue;

    for (const ch of normalized) {
      if (/\s/u.test(ch)) {
        if (!prevSpace) {
          out += ' ';
          indexMap.push(i);
          prevSpace = true;
        }
      } else {
        out += ch;
        indexMap.push(i);
        prevSpace = false;
      }
    }
  }

  return { text: out, indexMap };
}

function buildLooseAliasPattern(alias: string): string {
  const normalized = normalizeLooseBookKey(alias);
  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0) return '';

  if (/^[1-3]$/.test(tokens[0]!) && tokens.length > 1) {
    return `${tokens[0]}\\.?\\s*${tokens.slice(1).map(escapeRegex).join('\\s+')}`;
  }

  return tokens.map(escapeRegex).join('\\s+');
}

function parseCVPart(
  restRaw: string,
  chapterVerseSeparators: string[],
  rangeSeparator: string,
  bookId: BookId
): Omit<BibleRef, 'bookId'> | null {
  const rest = restRaw.trim();
  const isSingleChapter = SINGLE_CHAPTER_BOOKS.has(bookId);
  const cvSepAlt = chapterVerseSeparators.map(escapeRegex).join('|');
  const rangeSep = escapeRegex(rangeSeparator);

  const verseRe = new RegExp(
    `^(\\d+)\\s*(?:${cvSepAlt})\\s*(\\d+)(?:\\s*${rangeSep}\\s*(?:(\\d+)\\s*(?:${cvSepAlt})\\s*(\\d+)|(\\d+)))?$`
  );
  const verseMatch = verseRe.exec(rest);

  if (verseMatch) {
    const chapterStart = Number(verseMatch[1]);
    const verseStart = Number(verseMatch[2]);
    const chapterEnd = verseMatch[3] ? Number(verseMatch[3]) : undefined;
    const verseEnd = verseMatch[4]
      ? Number(verseMatch[4])
      : verseMatch[5]
        ? Number(verseMatch[5])
        : undefined;

    if (!Number.isFinite(chapterStart) || chapterStart <= 0) return null;
    if (!Number.isFinite(verseStart) || verseStart <= 0) return null;
    if (chapterEnd !== undefined && (!Number.isFinite(chapterEnd) || chapterEnd <= 0)) return null;
    if (verseEnd !== undefined && (!Number.isFinite(verseEnd) || verseEnd <= 0)) return null;
    if (chapterEnd !== undefined && verseEnd === undefined) return null;
    if (chapterEnd !== undefined && chapterEnd < chapterStart) return null;
    if (chapterEnd === undefined && verseEnd !== undefined && verseEnd < verseStart) return null;
    if (chapterEnd !== undefined && chapterEnd === chapterStart && verseEnd !== undefined && verseEnd < verseStart) return null;

    return { chapterStart, verseStart, chapterEnd, verseEnd };
  }

  const plainRe = new RegExp(`^(\\d+)(?:\\s*${rangeSep}\\s*(\\d+))?$`);
  const plainMatch = plainRe.exec(rest);
  if (!plainMatch) return null;

  const first = Number(plainMatch[1]);
  const second = plainMatch[2] ? Number(plainMatch[2]) : undefined;

  if (!Number.isFinite(first) || first <= 0) return null;
  if (second !== undefined && (!Number.isFinite(second) || second <= 0)) return null;
  if (second !== undefined && second < first) return null;

  if (isSingleChapter) {
    return {
      chapterStart: 1,
      verseStart: first,
      verseEnd: second,
    };
  }

  return {
    chapterStart: first,
    chapterEnd: second,
  };
}

// Legacy helper for parseCzechBibleRef.
function parseChapterVersePart(
  restRaw: string,
  bookId: BookId
): Omit<BibleRef, 'bookId'> | null {
  return parseCVPart(restRaw, [',', ':'], '-', bookId);
}

export function buildRefScanner(
  map: AbbreviationMap,
  format?: ReferenceFormatRules,
  mode?: ParsingMode
): RefScanner {
  const fmt = format ?? BUILT_IN_FORMAT_RULES;
  const parsingMode = mode ?? 'strict';

  const rawAliases: string[] =
    parsingMode === 'strict'
      ? Object.values(fmt.books)
      : Object.keys(map);

  if (rawAliases.length === 0) {
    return { scan: () => [] };
  }

  const sortedAliases = [...rawAliases].sort((a, b) => b.length - a.length);

  const bookAlt =
    parsingMode === 'strict'
      ? sortedAliases.map(escapeRegex).join('|')
      : sortedAliases.map(buildLooseAliasPattern).join('|');

  const bookChapPat =
    parsingMode === 'strict' && fmt.bookChapterSeparator
      ? escapeRegex(fmt.bookChapterSeparator)
      : '\\s+';

  const cvSepEsc = escapeRegex(fmt.chapterVerseSeparator);
  const rangeSepEsc = escapeRegex(fmt.rangeSeparator);

  const altCvSeps = [',', ':', '.']
    .filter(s => s !== fmt.chapterVerseSeparator)
    .map(escapeRegex);

  const negLookahead = altCvSeps.length > 0
    ? `(?!\\s*(?:${altCvSeps.join('|')}))`
    : '';

const cvScanPat =
  parsingMode === 'strict'
    ? [
        `\\d+\\s*${cvSepEsc}\\s*\\d+(?:\\s*${rangeSepEsc}\\s*(?:\\d+\\s*${cvSepEsc}\\s*\\d+|\\d+))?`,
        `\\d+\\s*${rangeSepEsc}\\s*\\d+`,
        `\\d+${negLookahead}`,
      ].join('|')
    : `\\d+(?:\\s*-\\s*\\d+|(?:[,:.]\\s*\\d+)(?:\\s*-\\s*(?:\\d+[,:.]\\s*\\d+|\\d+))?)?`;

  const re = new RegExp(`\\b(${bookAlt})${bookChapPat}(${cvScanPat})`, 'g');

  let aliasToId: Record<string, BookId>;
  if (parsingMode === 'strict') {
    aliasToId = {} as Record<string, BookId>;
    for (const [id, abbr] of Object.entries(fmt.books)) {
      aliasToId[normalizeBookKey(abbr)] = id as BookId;
    }
  } else {
    aliasToId = {} as Record<string, BookId>;
    for (const [alias, id] of Object.entries(map)) {
      aliasToId[normalizeLooseBookKey(alias)] = id;
    }
  }

  return {
    scan(text: string): RefMatch[] {
      const matches: RefMatch[] = [];
      const scanSource =
        parsingMode === 'strict'
          ? { text, indexMap: undefined as number[] | undefined }
          : normalizeLooseText(text);

      re.lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = re.exec(scanSource.text)) !== null) {
        const rawBook = m[1]!;
        const cvRaw = m[2]!;

        const bookId =
          parsingMode === 'strict'
            ? aliasToId[normalizeBookKey(rawBook)]
            : aliasToId[normalizeLooseBookKey(rawBook)];

        if (!bookId) continue;

        const cv = parseCVPart(
          cvRaw,
          parsingMode === 'strict'
            ? [fmt.chapterVerseSeparator]
            : [fmt.chapterVerseSeparator, ',', ':', '.'],
          fmt.rangeSeparator,
          bookId
        );
        if (!cv) continue;

        const start =
          parsingMode === 'strict'
            ? m.index
            : scanSource.indexMap![m.index]!;

        const end =
          parsingMode === 'strict'
            ? m.index + m[0].length
            : (scanSource.indexMap![m.index + m[0].length - 1] ?? start) + 1;

        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        if (text[lineStart] === '>') continue;

        const matchText = text.slice(start, end);
        matches.push({
          start,
          end,
          matchText,
          ref: { bookId, ...cv },
        });
      }

      return matches;
    },
  };
}

export function parseCzechBibleRef(input: string): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: "Empty input" };

  const m = /^(.+?)\s+(.+)$/.exec(s);
  if (!m) return { ok: false, error: "Missing chapter/verse part" };

  const rawBook = m[1]!.trim();
  const rest = m[2]!.trim();

  const bookId = resolveBookId(rawBook);
  if (!bookId) return { ok: false, error: `Unknown book abbreviation: ${rawBook}` };

  const cv = parseChapterVersePart(rest, bookId);
  if (!cv) return { ok: false, error: `Invalid chapter/verse format: ${rest}` };

  return { ok: true, ref: { bookId, ...cv } };
}
