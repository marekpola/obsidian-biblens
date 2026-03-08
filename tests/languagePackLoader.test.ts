import { describe, it, expect } from "vitest";
import { loadLanguagePack } from "../src/languagePackLoader";
import type { DataAdapter } from "obsidian";

const VALID_PACK = {
  id: "cs",
  displayName: "Czech",
  lang: "cs",
  formatVersion: 1,
  source: "test",
  books: {
    GEN: { aliases: ["Gn", "Gen", "Genesis"] },
    MAT: { aliases: ["Mt", "Mat", "Matouš"] },
  },
};

function makeAdapter(content: unknown): DataAdapter {
  return {
    read: async (_path: string) => JSON.stringify(content),
  } as unknown as DataAdapter;
}

describe("loadLanguagePack", () => {
  it("returns correct AbbreviationMap from valid pack", async () => {
    const adapter = makeAdapter(VALID_PACK);
    const { map } = await loadLanguagePack(adapter, "plugins/biblens", "cs");
    expect(map["gn"]).toBe("GEN");
    expect(map["gen"]).toBe("GEN");
    expect(map["genesis"]).toBe("GEN");
    expect(map["mt"]).toBe("MAT");
    expect(map["mat"]).toBe("MAT");
    expect(map["matouš"]).toBe("MAT");
  });

  it("normalizes alias keys (lowercase, trimmed)", async () => {
    const pack = {
      ...VALID_PACK,
      books: { GEN: { aliases: ["  Gn. ", "GENESIS"] } },
    };
    const adapter = makeAdapter(pack);
    const { map } = await loadLanguagePack(adapter, "plugins/biblens", "cs");
    expect(map["gn"]).toBe("GEN");
    expect(map["genesis"]).toBe("GEN");
  });

  it("returns correct LanguagePackMeta", async () => {
    const adapter = makeAdapter(VALID_PACK);
    const { meta } = await loadLanguagePack(adapter, "plugins/biblens", "cs");
    expect(meta.id).toBe("cs");
    expect(meta.displayName).toBe("Czech");
    expect(meta.lang).toBe("cs");
  });

  it("throws on unsupported formatVersion", async () => {
    const adapter = makeAdapter({ ...VALID_PACK, formatVersion: 2 });
    await expect(loadLanguagePack(adapter, "plugins/biblens", "cs")).rejects.toThrow(
      /unsupported formatVersion/
    );
  });

  it("throws when mandatory field 'books' is missing", async () => {
    const withoutBooks = { id: VALID_PACK.id, displayName: VALID_PACK.displayName, lang: VALID_PACK.lang, formatVersion: VALID_PACK.formatVersion };
    const adapter = makeAdapter(withoutBooks);
    await expect(loadLanguagePack(adapter, "plugins/biblens", "cs")).rejects.toThrow(
      /missing mandatory field 'books'/
    );
  });

  it("throws when mandatory field 'displayName' is missing", async () => {
    const withoutDn = { id: VALID_PACK.id, lang: VALID_PACK.lang, formatVersion: VALID_PACK.formatVersion, books: VALID_PACK.books };
    const adapter = makeAdapter(withoutDn);
    await expect(loadLanguagePack(adapter, "plugins/biblens", "cs")).rejects.toThrow(
      /missing mandatory field 'displayName'/
    );
  });

  it("reads from recognition-languages/ directory", async () => {
    const paths: string[] = [];
    const adapter = {
      read: async (path: string) => {
        paths.push(path);
        return JSON.stringify(VALID_PACK);
      },
    } as unknown as DataAdapter;
    await loadLanguagePack(adapter, "plugins/biblens", "cs");
    expect(paths[0]).toBe("plugins/biblens/recognition-languages/cs.json");
  });
});
