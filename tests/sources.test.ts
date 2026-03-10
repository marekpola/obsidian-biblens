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

  it("each languagePackProvider has a registered adapter type", () => {
    for (const p of KNOWN_PROVIDERS.languagePackProviders) {
      expect(() => getLanguagePackAdapter(p.adapterType)).not.toThrow();
    }
  });


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
});
