// src/osisMapping.ts
// Pure module — no Obsidian imports.
// Converts OSIS book identifiers to USFM 3.0 BookId values.
// Used by source adapters during download transformation when the upstream
// data source (e.g. openbibleinfo) uses OSIS keys.

import type { BookId } from "./books";

const OSIS_TO_USFM: Record<string, BookId> = {
  // Old Testament (39)
  "Gen":    "GEN",
  "Exod":   "EXO",
  "Lev":    "LEV",
  "Num":    "NUM",
  "Deut":   "DEU",
  "Josh":   "JOS",
  "Judg":   "JDG",
  "Ruth":   "RUT",
  "1Sam":   "1SA",
  "2Sam":   "2SA",
  "1Kgs":   "1KI",
  "2Kgs":   "2KI",
  "1Chr":   "1CH",
  "2Chr":   "2CH",
  "Ezra":   "EZR",
  "Neh":    "NEH",
  "Esth":   "EST",
  "Job":    "JOB",
  "Ps":     "PSA",
  "Prov":   "PRO",
  "Eccl":   "ECC",
  "Song":   "SNG",
  "Isa":    "ISA",
  "Jer":    "JER",
  "Lam":    "LAM",
  "Ezek":   "EZK",
  "Dan":    "DAN",
  "Hos":    "HOS",
  "Joel":   "JOL",
  "Amos":   "AMO",
  "Obad":   "OBA",
  "Jonah":  "JON",
  "Mic":    "MIC",
  "Nah":    "NAM",
  "Hab":    "HAB",
  "Zeph":   "ZEP",
  "Hag":    "HAG",
  "Zech":   "ZEC",
  "Mal":    "MAL",

  // New Testament (27)
  "Matt":   "MAT",
  "Mark":   "MRK",
  "Luke":   "LUK",
  "John":   "JHN",
  "Acts":   "ACT",
  "Rom":    "ROM",
  "1Cor":   "1CO",
  "2Cor":   "2CO",
  "Gal":    "GAL",
  "Eph":    "EPH",
  "Phil":   "PHP",
  "Col":    "COL",
  "1Thess": "1TH",
  "2Thess": "2TH",
  "1Tim":   "1TI",
  "2Tim":   "2TI",
  "Titus":  "TIT",
  "Phlm":   "PHM",
  "Heb":    "HEB",
  "Jas":    "JAS",
  "1Pet":   "1PE",
  "2Pet":   "2PE",
  "1John":  "1JN",
  "2John":  "2JN",
  "3John":  "3JN",
  "Jude":   "JUD",
  "Rev":    "REV",

  // Deuterocanon / Apocrypha
  "Tob":       "TOB",
  "Jdt":       "JDT",
  "EsthGr":    "ESG",  // Greek Esther (Additions to Esther)
  "AddEsth":   "ESG",  // alternative OSIS spelling
  "Wis":       "WIS",
  "Sir":       "SIR",
  "Bar":       "BAR",
  "EpJer":     "LJE",  // Letter of Jeremiah
  "PrAzar":    "S3Y",  // Prayer of Azariah / Song of the Three Young Men
  "Sus":       "SUS",
  "Bel":       "BEL",
  "1Macc":     "1MA",
  "2Macc":     "2MA",
  "3Macc":     "3MA",
  "4Macc":     "4MA",
  "1Esd":      "1ES",
  "2Esd":      "2ES",
  "PrMan":     "MAN",  // Prayer of Manasseh
  "AddPs":     "PS2",  // Psalm 151
  "Odes":      "ODA",
  "PssSol":    "PSS",  // Psalms of Solomon
  "4Ezra":     "EZA",
  "5Ezra":     "5EZ",
  "6Ezra":     "6EZ",
  "DanGr":     "DAG",  // Greek Daniel additions
  "Ps151":     "PS3",
  "2Bar":      "2BA",  // Syriac Apocalypse of Baruch
  "EpBar":     "LBA",  // Letter of Baruch
  "Jub":       "JUB",  // Jubilees
  "1En":       "ENO",  // 1 Enoch
  "1Meq":      "1MQ",
  "2Meq":      "2MQ",
  "3Meq":      "3MQ",
  "Rep":       "REP",  // Reproof (Ethiopian canon)
  "4Bar":      "4BA",  // 4 Baruch / Paraleipomena Jeremiou
  "EpLao":     "LAO",  // Epistle to the Laodiceans
};

/**
 * Convert an OSIS book identifier (e.g. "Gen", "Matt") to a USFM 3.0 BookId
 * (e.g. "GEN", "MAT"). Returns `undefined` for unknown identifiers.
 */
export function osisToUsfm(osisId: string): BookId | undefined {
  return OSIS_TO_USFM[osisId];
}
