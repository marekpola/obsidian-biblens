import { describe, it, expect } from "vitest";
import { isCatalogStale } from "../src/sources/catalogUtils";
import { getAdapter, getLanguagePackAdapter, getReferenceFormatAdapter } from "../src/sources/adapters";
import { KNOWN_PROVIDERS } from "../src/sources/catalog";

describe("isCatalogStale", () => {
  it("returns true when catalogLastUpdated is empty", () => {
    expect(isCatalogStale("")).toBe(true);
  });

  it("returns true when catalogLastUpdated is invalid", () => {
    expect(isCatalogStale("not-a-date")).toBe(true);
  });

  it("returns true when last update is older than 7 days", () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isCatalogStale(old)).toBe(true);
  });

  it("returns false when last update is within 7 days", () => {
    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isCatalogStale(recent)).toBe(false);
  });

  it("returns false when last update is today", () => {
    expect(isCatalogStale(new Date().toISOString())).toBe(false);
  });
});

describe("getAdapter", () => {
  it("throws for unknown adapter type", () => {
    expect(() => getAdapter("unknown-adapter")).toThrow(
      'BibLens: unknown adapter type "unknown-adapter"'
    );
  });

  it("returns adapter for getbible-v2", () => {
    expect(() => getAdapter("getbible-v2")).not.toThrow();
  });

  it("returns adapter for beblia-xml", () => {
    expect(() => getAdapter("beblia-xml")).not.toThrow();
  });
});

describe("getbible-v2 adapter", () => {
  const adapter = getAdapter("getbible-v2");

  it("buildUrl constructs correct URL", () => {
    const provider = KNOWN_PROVIDERS.translationProviders.find(p => p.id === "getbible-net")!;
    const entry = provider.translations.find(t => t.id === "bkr")!;
    expect(adapter.buildUrl(provider, entry)).toBe(
      "https://api.getbible.net/v2/bkr.json"
    );
  });

  it("transform maps book.nr and chapter/verse numbers to USFM keys", () => {
    const raw = JSON.stringify({
      books: [
        {
          nr: 1,
          chapters: [
            {
              chapter: 1,
              verses: [
                { verse: 1, text: "Na počátku stvořil Bůh nebe a zemi." },
                { verse: 2, text: "Druhý verš." },
              ],
            },
          ],
        },
      ],
    });
    const result = adapter.transform(raw);
    expect(result["GEN.1.1"]).toBe("Na počátku stvořil Bůh nebe a zemi.");
    expect(result["GEN.1.2"]).toBe("Druhý verš.");
  });

  it("transform skips books with number > 66", () => {
    const raw = JSON.stringify({
      books: [{ nr: 67, chapters: [{ chapter: 1, verses: [{ verse: 1, text: "x" }] }] }],
    });
    const result = adapter.transform(raw);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("transform handles empty books array", () => {
    const result = adapter.transform(JSON.stringify({ books: [] }));
    expect(Object.keys(result)).toHaveLength(0);
  });
});

/*
describe("beblia-xml adapter", () => {
  const adapter = getAdapter("beblia-xml");

  it("buildUrl constructs correct URL", () => {
    const provider = KNOWN_PROVIDERS.translationProviders.find(p => p.id === "beblia-xml")!;
    const entry = provider.translations.find(t => t.id === "cep2001")!;
    expect(adapter.buildUrl(provider, entry)).toBe(
      "https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/CzechEkumenickyBible.xml"
    );
  });

  it("transform parses book/chapter/verse structure", () => {
    const xml = `<bible>
      <book number="1">
        <chapter number="1">
          <verse number="1">Na počátku stvořil Bůh nebe a zemi.</verse>
          <verse number="2">Druhý verš.</verse>
        </chapter>
        <chapter number="2">
          <verse number="1">Třetí verš.</verse>
        </chapter>
      </book>
    </bible>`;
    const result = adapter.transform(xml);
    expect(result["GEN.1.1"]).toBe("Na počátku stvořil Bůh nebe a zemi.");
    expect(result["GEN.1.2"]).toBe("Druhý verš.");
    expect(result["GEN.2.1"]).toBe("Třetí verš.");
  });

  it("transform decodes XML entities", () => {
    const xml = `<bible><book number="1"><chapter number="1"><verse number="1">a &amp; b &lt;c&gt;</verse></chapter></book></bible>`;
    const result = adapter.transform(xml);
    expect(result["GEN.1.1"]).toBe("a & b <c>");
  });

  it("transform skips books with number > 66", () => {
    const xml = `<bible><book number="70"><chapter number="1"><verse number="1">x</verse></chapter></book></bible>`;
    const result = adapter.transform(xml);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("transform maps book 40 to MAT (first NT book)", () => {
    const xml = `<bible><book number="40"><chapter number="1"><verse number="1">Matthew text.</verse></chapter></book></bible>`;
    const result = adapter.transform(xml);
    expect(result["MAT.1.1"]).toBe("Matthew text.");
  });
});
*/

describe("KNOWN_PROVIDERS", () => {
  it("contains at least 2 translation providers", () => {
    expect(KNOWN_PROVIDERS.translationProviders.length).toBeGreaterThanOrEqual(2);
  });

  it("each translation provider has a registered adapter type", () => {
    for (const p of KNOWN_PROVIDERS.translationProviders) {
      expect(() => getAdapter(p.adapterType)).not.toThrow();
    }
  });

  it("each translation provider has at least one translation", () => {
    for (const p of KNOWN_PROVIDERS.translationProviders) {
      expect(p.translations.length).toBeGreaterThan(0);
    }
  });
/*
  it("has languagePackProviders and referenceFormatProviders arrays", () => {
    expect(Array.isArray(KNOWN_PROVIDERS.languagePackProviders)).toBe(true);
    expect(Array.isArray(KNOWN_PROVIDERS.referenceFormatProviders)).toBe(true);
  });
*/
  /*
  it("has openbibleinfo as a languagePackProvider", () => {
    const provider = KNOWN_PROVIDERS.languagePackProviders.find(p => p.id === "openbibleinfo");
    expect(provider).toBeDefined();
  });

  it("openbibleinfo provider has at least 14 language packs", () => {
    const provider = KNOWN_PROVIDERS.languagePackProviders.find(p => p.id === "openbibleinfo")!;
    expect(provider.packs.length).toBeGreaterThanOrEqual(14);
  });

  it("openbibleinfo provider includes cs, en, de", () => {
    const provider = KNOWN_PROVIDERS.languagePackProviders.find(p => p.id === "openbibleinfo")!;
    const ids = provider.packs.map(p => p.id);
    expect(ids).toContain("cs");
    expect(ids).toContain("en");
    expect(ids).toContain("de");
  });
*/
  it("each languagePackProvider has a registered adapter type", () => {
    for (const p of KNOWN_PROVIDERS.languagePackProviders) {
      expect(() => getLanguagePackAdapter(p.adapterType)).not.toThrow();
    }
  });

  /*
  it("has openbibleinfo as a referenceFormatProvider", () => {
    const provider = KNOWN_PROVIDERS.referenceFormatProviders.find(p => p.id === "openbibleinfo");
    expect(provider).toBeDefined();
  });

  it("openbibleinfo referenceFormatProvider includes cs, en, de", () => {
    const provider = KNOWN_PROVIDERS.referenceFormatProviders.find(p => p.id === "openbibleinfo")!;
    const ids = provider.formats.map(f => f.id);
    expect(ids).toContain("cs");
    expect(ids).toContain("en");
    expect(ids).toContain("de");
  });
*/
  it("each referenceFormatProvider has a registered adapter type", () => {
    for (const p of KNOWN_PROVIDERS.referenceFormatProviders) {
      expect(() => getReferenceFormatAdapter(p.adapterType)).not.toThrow();
    }
  });
});

describe("getLanguagePackAdapter", () => {
  it("throws for unknown adapter type", () => {
    expect(() => getLanguagePackAdapter("unknown-lang-adapter")).toThrow(
      'BibLens: unknown language pack adapter type "unknown-lang-adapter"'
    );
  });
  /*
  it("returns adapter for openbibleinfo", () => {
    expect(() => getLanguagePackAdapter("openbibleinfo")).not.toThrow();
  });
  */
});
/*
describe("openbibleinfo language pack adapter", () => {
  const adapter = getLanguagePackAdapter("openbibleinfo");
  const provider = KNOWN_PROVIDERS.languagePackProviders.find(p => p.id === "openbibleinfo")!;
  const csEntry = provider.packs.find(p => p.id === "cs")!;

  it("buildUrl constructs correct URL for Czech", () => {
    expect(adapter.buildUrl(provider, csEntry)).toBe(
      "https://raw.githubusercontent.com/openbibleinfo/Bible-Passage-Reference-Parser/master/src/cs/data.txt"
    );
  });

  it("transform produces USFM-keyed books with aliases", () => {
    const txt = [
      "$FIRST\tPrvní\t1\tI",
      "Gen\t$FIRST Mojžíšova\tGenesis",
      "Matt\tMatouš\tMat\tMt",
    ].join("\n");
    const result = adapter.transform(txt);
    expect(result.books["GEN"]).toBeDefined();
    expect(result.books["MAT"]).toBeDefined();
    expect(result.books["GEN"]!.aliases).toContain("Genesis");
    expect(result.books["GEN"]!.aliases).toContain("První Mojžíšova");
    expect(result.books["GEN"]!.aliases).toContain("1 Mojžíšova");
    expect(result.books["GEN"]!.aliases).toContain("I Mojžíšova");
    expect(result.books["MAT"]!.aliases).toContain("Matouš");
    expect(result.books["MAT"]!.aliases).toContain("Mt");
  });

  it("transform skips regex-pattern aliases (containing ?, [, ])", () => {
    const txt = "Gen\tGe?n\tGen[esis]\tGenesis";
    const result = adapter.transform(txt);
    const aliases = result.books["GEN"]!.aliases;
    expect(aliases).not.toContain("Ge?n");
    expect(aliases).not.toContain("Gen[esis]");
    expect(aliases).toContain("Genesis");
  });

  it("transform skips deuterocanonical books (not in 66-book canon)", () => {
    const txt = [
      "Gen\tGenesis",
      "Tob\tTóbijáš",
      "Sir\tSírachovec",
      "Rev\tRevelation",
    ].join("\n");
    const result = adapter.transform(txt);
    expect(result.books["GEN"]).toBeDefined();
    expect(result.books["REV"]).toBeDefined();
    expect(Object.keys(result.books)).not.toContain("TOB");
    expect(Object.keys(result.books)).not.toContain("SIR");
  });

  it("transform ignores comment, variable-def, and order lines; adds Short from preferred-names", () => {
    const txt = [
      "# comment line",
      "$FIRST\tPrvní",
      "*Gen\tPreferred Genesis\tGn",
      "=Gen",
      "Gen\tGenesis",
    ].join("\n");
    const result = adapter.transform(txt);
    expect(result.books["GEN"]).toBeDefined();
    // Alias line contributes "Genesis"; preferred-names Short "Gn" is added as additional alias
    expect(result.books["GEN"]!.aliases).toContain("Genesis");
    expect(result.books["GEN"]!.aliases).toContain("Gn");
    // Comment, variable-def, and order lines contribute nothing
    expect(result.books["GEN"]!.aliases).not.toContain("Preferred Genesis");
    expect(result.books["GEN"]!.aliases).not.toContain("První");
  });

  it("transform deduplicates identical aliases", () => {
    const txt = "Gen\tGenesis\tGenesis\tGenesis";
    const result = adapter.transform(txt);
    expect(result.books["GEN"]!.aliases.filter(a => a === "Genesis")).toHaveLength(1);
  });

  it("transform sets formatVersion 1 and source field", () => {
    const result = adapter.transform("Gen\tGenesis");
    expect(result.formatVersion).toBe(1);
    expect(result.source).toBe("openbibleinfo/Bible-Passage-Reference-Parser");
  });

  it("transform returns empty books for input with no canonical entries", () => {
    const txt = ["# only comments", "$FIRST\tFirst", "Tob\tTobit"].join("\n");
    const result = adapter.transform(txt);
    expect(Object.keys(result.books)).toHaveLength(0);
  });
});

describe("getReferenceFormatAdapter", () => {
  it("throws for unknown adapter type", () => {
    expect(() => getReferenceFormatAdapter("unknown-fmt-adapter")).toThrow(
      'BibLens: unknown reference format adapter type "unknown-fmt-adapter"'
    );
  });

  it("returns adapter for openbibleinfo", () => {
    expect(() => getReferenceFormatAdapter("openbibleinfo")).not.toThrow();
  });

  it("returns adapter for biblens-catalog", () => {
    expect(() => getReferenceFormatAdapter("biblens-catalog")).not.toThrow();
  });
});

describe("openbibleinfo reference format adapter", () => {
  const adapter = getReferenceFormatAdapter("openbibleinfo");
  const provider = KNOWN_PROVIDERS.referenceFormatProviders.find(p => p.id === "openbibleinfo")!;
  const csEntry = provider.formats.find(f => f.id === "cs")!;

  it("buildUrl constructs correct URL for Czech", () => {
    expect(adapter.buildUrl(provider, csEntry)).toBe(
      "https://raw.githubusercontent.com/openbibleinfo/Bible-Passage-Reference-Parser/master/src/cs/data.txt"
    );
  });

  it("transform throws when entry.rules is absent", () => {
    const entryNoRules = { id: "cs", displayName: "Czech", language: "cs", remoteId: "cs" };
    expect(() => adapter.transform("*Gen\tGenesis\tGen\tGn", entryNoRules)).toThrow(
      "entry.rules"
    );
  });

  it("transform extracts Short (index 2) as canonical abbreviation", () => {
    const txt = "*Gen\tGenesis\tGen\tGn\n*Matt\tMatouš\tMat\tMt";
    const result = adapter.transform(txt, csEntry);
    expect(result.books["GEN"]).toBe("Gen");
    expect(result.books["MAT"]).toBe("Mat");
  });

  it("transform falls back to Shorter (index 3) when Short is absent", () => {
    const txt = "*Gen\tGenesis\t\tGn";
    const result = adapter.transform(txt, csEntry);
    expect(result.books["GEN"]).toBe("Gn");
  });

  it("transform skips non-canonical OSIS ids", () => {
    const txt = "*Gen\tGenesis\tGen\tGn\n*Tob\tTóbijáš\tTob\tTb";
    const result = adapter.transform(txt, csEntry);
    expect(result.books["GEN"]).toBe("Gen");
    expect(Object.keys(result.books)).not.toContain("TOB");
  });

  it("transform reads rules from entry.rules", () => {
    const txt = "*Gen\tGenesis\tGen\tGn";
    const result = adapter.transform(txt, csEntry);
    expect(result.rules.chapterVerseSeparator).toBe(",");
    expect(result.rules.rangeSeparator).toBe("-");
    expect(result.rules.bookChapterSeparator).toBe(" ");
  });

  it("transform sets formatVersion 1 and source field", () => {
    const result = adapter.transform("*Gen\tGenesis\tGen\tGn", csEntry);
    expect(result.formatVersion).toBe(1);
    expect(result.source).toBe("openbibleinfo/Bible-Passage-Reference-Parser");
  });
  
  it("transform ignores non-preferred-names lines", () => {
    const txt = [
      "# Preferred names",
      "Gen\tGenesis\tGn",
      "$FIRST\tPrvní",
      "=Gen",
      "*Gen\tGenesis\tGn\tGn",
    ].join("\n");
    const result = adapter.transform(txt, csEntry);
    expect(Object.keys(result.books)).toEqual(["GEN"]);
  });

}

);  */
