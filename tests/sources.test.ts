import { describe, it, expect } from "vitest";
import { getAdapter, getLanguagePackAdapter, getReferenceFormatAdapter } from "../src/sources/adapters";
import { KNOWN_PROVIDERS } from "../src/sources/catalog";

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

// ---------------------------------------------------------------------------
// biblens-data listUrl / listAvailable
// ---------------------------------------------------------------------------

const MOCK_INDEX = JSON.stringify({
  items: [
    { id: "en",  displayName: "English", language: "en" },
    { id: "cs",  displayName: "Czech",   language: "cs" },
  ],
});

describe("biblens-data translation adapter — listUrl / listAvailable", () => {
  const adapter = getAdapter("biblens-data");
  const provider = KNOWN_PROVIDERS.translationProviders.find(p => p.adapterType === "biblens-data")!;

  it("listUrl returns correct index URL", () => {
    expect(adapter.listUrl!(provider)).toBe(
      `${provider.baseUrl}/resources/translations/index.json`
    );
  });

  it("listAvailable parses index into RemoteTranslationEntry[]", () => {
    const entries = adapter.listAvailable!(MOCK_INDEX);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: "en", displayName: "English", language: "en", remoteId: "en" });
    expect(entries[1]).toEqual({ id: "cs", displayName: "Czech",   language: "cs", remoteId: "cs" });
  });

  it("listAvailable returns empty array for empty items list", () => {
    expect(adapter.listAvailable!(JSON.stringify({ items: [] }))).toEqual([]);
  });
});

describe("biblens-data language pack adapter — listUrl / listAvailable", () => {
  const adapter = getLanguagePackAdapter("biblens-data");
  const provider = KNOWN_PROVIDERS.languagePackProviders.find(p => p.adapterType === "biblens-data")!;

  it("listUrl returns correct index URL", () => {
    expect(adapter.listUrl!(provider)).toBe(
      `${provider.baseUrl}/resources/language-packs/index.json`
    );
  });

  it("listAvailable parses index into RemoteLanguagePackEntry[]", () => {
    const entries = adapter.listAvailable!(MOCK_INDEX);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: "en", displayName: "English", language: "en", remoteId: "en" });
    expect(entries[1]).toEqual({ id: "cs", displayName: "Czech",   language: "cs", remoteId: "cs" });
  });

  it("listAvailable returns empty array for empty items list", () => {
    expect(adapter.listAvailable!(JSON.stringify({ items: [] }))).toEqual([]);
  });
});

describe("biblens-data reference format adapter — listUrl / listAvailable", () => {
  const adapter = getReferenceFormatAdapter("biblens-data");
  const provider = KNOWN_PROVIDERS.referenceFormatProviders.find(p => p.adapterType === "biblens-data")!;

  it("listUrl returns correct index URL", () => {
    expect(adapter.listUrl!(provider)).toBe(
      `${provider.baseUrl}/resources/reference-formats/index.json`
    );
  });

  it("listAvailable parses index into RemoteReferenceFormatEntry[]", () => {
    const entries = adapter.listAvailable!(MOCK_INDEX);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: "en", displayName: "English", language: "en", remoteId: "en" });
  });

  it("listAvailable returns empty array for empty items list", () => {
    expect(adapter.listAvailable!(JSON.stringify({ items: [] }))).toEqual([]);
  });
});

describe("getbible-v2 — no listAvailable", () => {
  it("getbible-v2 does not implement listAvailable", () => {
    expect("listAvailable" in getAdapter("getbible-v2")).toBe(false);
  });
});

const GITHUB_CONTENTS_RESPONSE = JSON.stringify([
  { name: "CzechEkumenickyBible.xml", type: "file" },
  { name: "EnglishKJV.xml",           type: "file" },
  { name: "somedir",                  type: "dir"  },
  { name: "README.md",                type: "file" },
]);

describe("beblia-xml adapter — listUrl / listAvailable", () => {
  const adapter = getAdapter("beblia-xml");
  const provider = KNOWN_PROVIDERS.translationProviders.find(p => p.adapterType === "beblia-xml")!;

  it("listUrl returns the GitHub Contents API URL", () => {
    expect(adapter.listUrl!(provider)).toBe(
      "https://api.github.com/repos/Beblia/Holy-Bible-XML-Format/contents/"
    );
  });

  it("listAvailable filters .xml files and maps to RemoteTranslationEntry[]", () => {
    const entries = adapter.listAvailable!(GITHUB_CONTENTS_RESPONSE);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      id: "czechekumenickybible",
      displayName: "CzechEkumenickyBible",
      language: "",
      remoteId: "CzechEkumenickyBible.xml",
    });
    expect(entries[1]).toEqual({
      id: "englishkjv",
      displayName: "EnglishKJV",
      language: "",
      remoteId: "EnglishKJV.xml",
    });
  });

  it("listAvailable returns empty array for empty response", () => {
    expect(adapter.listAvailable!(JSON.stringify([]))).toEqual([]);
  });

  it("listAvailable returns empty array on parse failure", () => {
    expect(adapter.listAvailable!("not-json")).toEqual([]);
  });
});
