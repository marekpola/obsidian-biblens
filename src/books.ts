// src/books.ts
import type { ReferenceFormatRules } from "./types";

/*
Source of truth for canonical book identifiers:
USFM 3.0 Book Identifiers table (excluding peripherals like FRT/BAK/INT/... and XXA-XXG).
*/

export const ALL_BOOK_IDS = [
  // OT (39)
  "GEN","EXO","LEV","NUM","DEU",
  "JOS","JDG","RUT",
  "1SA","2SA","1KI","2KI","1CH","2CH",
  "EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG",
  "ISA","JER","LAM","EZK","DAN",
  "HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",

  // NT (27)
  "MAT","MRK","LUK","JHN","ACT",
  "ROM","1CO","2CO","GAL","EPH","PHP","COL",
  "1TH","2TH","1TI","2TI","TIT","PHM",
  "HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD","REV",

  // Deuterocanon / Apocrypha and other traditions (as listed in USFM 3.0)
  "TOB","JDT","ESG","WIS","SIR","BAR","LJE","S3Y","SUS","BEL",
  "1MA","2MA","3MA","4MA",
  "1ES","2ES",
  "MAN","PS2","ODA","PSS",
  "EZA","5EZ","6EZ",
  "DAG","PS3",
  "2BA","LBA",
  "JUB","ENO",
  "1MQ","2MQ","3MQ",
  "REP","4BA",
  "LAO",
] as const;

export type BookId = (typeof ALL_BOOK_IDS)[number];

export type AbbreviationMap = Record<string, BookId>;

const BOOK_ID_SET: ReadonlySet<string> = new Set(ALL_BOOK_IDS);

/*
Normalize user-provided book tokens into a stable lookup key.
- trims
- removes trailing dot
- collapses whitespace
- lowercases
You can later add Czech diacritics folding if you introduce aliases like "Žl".
*/
export function normalizeBookKey(input: string): string {
  return input
    .trim()
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function alias(key: string, id: BookId): [string, BookId] {
  return [normalizeBookKey(key), id];
}

export const BOOK_ALIASES: Record<string, BookId> = Object.fromEntries([
  // Pentateuch
  alias("Gn", "GEN"),
  alias("Gen", "GEN"),
  alias("Genesis", "GEN"),

  alias("Ex", "EXO"),
  alias("Exod", "EXO"),
  alias("Exodus", "EXO"),

  alias("Lv", "LEV"),
  alias("Lev", "LEV"),
  alias("Leviticus", "LEV"),

  alias("Nu", "NUM"),
  alias("Num", "NUM"),

  alias("Dt", "DEU"),
  alias("Deut", "DEU"),

  // Historical
  alias("Joz", "JOS"),
  alias("Jos", "JOS"),

  alias("Sd", "JDG"),
  alias("Sdc", "JDG"),
  alias("Judg", "JDG"),

  alias("Rt", "RUT"),
  alias("Ruth", "RUT"),

  alias("1S", "1SA"),
  alias("1Sam", "1SA"),
  alias("1 Sam", "1SA"),

  alias("2S", "2SA"),
  alias("2Sam", "2SA"),

  alias("1Kr", "1KI"),
  alias("1 Kr", "1KI"),
  alias("1K", "1KI"),

  alias("2Kr", "2KI"),
  alias("2 Kr", "2KI"),
  alias("2K", "2KI"),

  alias("1Pa", "1CH"),
  alias("1Par", "1CH"),

  alias("2Pa", "2CH"),
  alias("2Par", "2CH"),

  alias("Ezdr", "EZR"),
  alias("Ezra", "EZR"),

  alias("Neh", "NEH"),
  alias("Nehem", "NEH"),

  alias("Est", "EST"),

  // Wisdom
  alias("Jb", "JOB"),
  alias("Job", "JOB"),

  alias("Žl", "PSA"),
  alias("Zl", "PSA"),
  alias("Ps", "PSA"),
  alias("Psa", "PSA"),
  alias("Psalm", "PSA"),

  alias("Př", "PRO"),
  alias("Pr", "PRO"),
  alias("Pro", "PRO"),

  alias("Kaz", "ECC"),
  alias("Kohelet", "ECC"),

  alias("Pís", "SNG"),
  alias("Pis", "SNG"),
  alias("Pisen", "SNG"),

  // Prophets
  alias("Iz", "ISA"),
  alias("Izai", "ISA"),
  alias("Isa", "ISA"),

  alias("Jer", "JER"),

  alias("Pl", "LAM"),
  alias("Nář", "LAM"),
  alias("Nar", "LAM"),

  alias("Ez", "EZK"),
  alias("Ezk", "EZK"),

  alias("Dan", "DAN"),

  alias("Oz", "HOS"),
  alias("Hos", "HOS"),

  alias("Jl", "JOL"),
  alias("Joel", "JOL"),

  alias("Am", "AMO"),

  alias("Abd", "OBA"),
  alias("Ob", "OBA"),

  alias("Jon", "JON"),

  alias("Mi", "MIC"),
  alias("Mich", "MIC"),

  alias("Nah", "NAM"),

  alias("Hab", "HAB"),

  alias("Sof", "ZEP"),
  alias("Zeph", "ZEP"),

  alias("Ag", "HAG"),

  alias("Zach", "ZEC"),
  alias("Zac", "ZEC"),

  alias("Mal", "MAL"),

  // New Testament
  alias("Mt", "MAT"),
  alias("Mat", "MAT"),
  alias("Matt", "MAT"),
  alias("Matthew", "MAT"),

  alias("Mk", "MRK"),
  alias("Mrk", "MRK"),

  alias("Lk", "LUK"),

  alias("Jan", "JHN"),
  alias("Jn", "JHN"),

  alias("Sk", "ACT"),
  alias("Acts", "ACT"),

  alias("Ř", "ROM"),
  alias("Rim", "ROM"),
  alias("Rom", "ROM"),

  alias("1Kor", "1CO"),
  alias("1 Kor", "1CO"),

  alias("2Kor", "2CO"),
  alias("2 Kor", "2CO"),

  alias("Gal", "GAL"),

  alias("Ef", "EPH"),

  alias("Fp", "PHP"),
  alias("Phil", "PHP"),

  alias("Kol", "COL"),

  alias("1Tes", "1TH"),
  alias("1Th", "1TH"),

  alias("2Tes", "2TH"),
  alias("2Th", "2TH"),

  alias("1Tim", "1TI"),
  alias("2Tim", "2TI"),

  alias("Tit", "TIT"),

  alias("Flm", "PHM"),
  alias("Phm", "PHM"),

  alias("Žid", "HEB"),
  alias("Heb", "HEB"),

  alias("Jak", "JAS"),

  alias("1Pt", "1PE"),
  alias("1 Petr", "1PE"),

  alias("2Pt", "2PE"),

  alias("1Jan", "1JN"),
  alias("2Jan", "2JN"),
  alias("3Jan", "3JN"),

  alias("Jud", "JUD"),

  alias("Zj", "REV"),
  alias("Ap", "REV"),
  alias("Apok", "REV"),
]);

/*
Preferred Czech display abbreviation for each BookId.
Used by formatRef to produce human-readable references (e.g. "Gn 1,1" not "GEN 1,1").
Falls back to the OSIS ID for books without a Czech abbreviation.
*/
export const BOOK_DISPLAY: Partial<Record<BookId, string>> = {
  GEN: "Gn", EXO: "Ex", LEV: "Lv", NUM: "Nu", DEU: "Dt",
  JOS: "Joz", JDG: "Sd", RUT: "Rt",
  "1SA": "1S", "2SA": "2S", "1KI": "1Kr", "2KI": "2Kr", "1CH": "1Pa", "2CH": "2Pa",
  EZR: "Ezdr", NEH: "Neh", EST: "Est",
  JOB: "Jb", PSA: "Žl", PRO: "Př", ECC: "Kaz", SNG: "Pís",
  ISA: "Iz", JER: "Jer", LAM: "Pl", EZK: "Ez", DAN: "Dan",
  HOS: "Oz", JOL: "Jl", AMO: "Am", OBA: "Abd", JON: "Jon",
  MIC: "Mi", NAM: "Nah", HAB: "Hab", ZEP: "Sof", HAG: "Ag", ZEC: "Zach", MAL: "Mal",
  MAT: "Mt", MRK: "Mk", LUK: "Lk", JHN: "Jan", ACT: "Sk",
  ROM: "Ř", "1CO": "1Kor", "2CO": "2Kor", GAL: "Gal", EPH: "Ef",
  PHP: "Fp", COL: "Kol", "1TH": "1Tes", "2TH": "2Tes",
  "1TI": "1Tim", "2TI": "2Tim", TIT: "Tit", PHM: "Flm",
  HEB: "Žid", JAS: "Jak", "1PE": "1Pt", "2PE": "2Pt",
  "1JN": "1Jan", "2JN": "2Jan", "3JN": "3Jan", JUD: "Jud", REV: "Zj",
};

export function getDisplayAbbr(bookId: BookId): string {
  return BOOK_DISPLAY[bookId] ?? bookId;
}

/*
Resolve a raw book token into BookId using aliases.
Optionally, allow direct BookId input (e.g., user types "GEN 1,1").
*/
export function resolveBookId(rawBook: string): BookId | undefined {
  const key = normalizeBookKey(rawBook);

  const fromAlias = BOOK_ALIASES[key];
  if (fromAlias) return fromAlias;

  const upper = rawBook.trim().replace(/\.$/, "").toUpperCase();
  if (BOOK_ID_SET.has(upper)) return upper as BookId;

  return undefined;
}

export function getBuiltInAbbreviationMap(): AbbreviationMap {
  const map: AbbreviationMap = {};
  for (const [bookId, abbr] of Object.entries(BUILT_IN_FORMAT_RULES.books)) {
    map[abbr] = bookId as BookId;
  }
  return map;
}

export const BUILT_IN_FORMAT_RULES: ReferenceFormatRules = {
  chapterVerseSeparator: ':',
  rangeSeparator: '-',
  bookChapterSeparator: ' ',
  books: {
    GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut",
    JOS: "Josh", JDG: "Judg", RUT: "Ruth",
    "1SA": "1Sam", "2SA": "2Sam", "1KI": "1Kgs", "2KI": "2Kgs", "1CH": "1Chr", "2CH": "2Chr",
    EZR: "Ezra", NEH: "Neh", EST: "Esth",
    JOB: "Job", PSA: "Ps", PRO: "Prov", ECC: "Eccl", SNG: "Song",
    ISA: "Isa", JER: "Jer", LAM: "Lam", EZK: "Ezek", DAN: "Dan",
    HOS: "Hos", JOL: "Joel", AMO: "Amos", OBA: "Obad", JON: "Jonah",
    MIC: "Mic", NAM: "Nah", HAB: "Hab", ZEP: "Zeph", HAG: "Hag", ZEC: "Zech", MAL: "Mal",
    MAT: "Matt", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
    ROM: "Rom", "1CO": "1Cor", "2CO": "2Cor", GAL: "Gal", EPH: "Eph", PHP: "Phil", COL: "Col",
    "1TH": "1Thess", "2TH": "2Thess", "1TI": "1Tim", "2TI": "2Tim", TIT: "Titus", PHM: "Phlm",
    HEB: "Heb", JAS: "Jas", "1PE": "1Pet", "2PE": "2Pet",
    "1JN": "1John", "2JN": "2John", "3JN": "3John", JUD: "Jude", REV: "Rev",
  },
};