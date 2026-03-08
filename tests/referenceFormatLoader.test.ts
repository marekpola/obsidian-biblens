import { describe, it, expect } from "vitest";
import { loadReferenceFormat } from "../src/referenceFormatLoader";
import type { DataAdapter } from "obsidian";

const VALID_FORMAT = {
  id: "cs-protestant",
  displayName: "Czech Protestant",
  lang: "cs",
  formatVersion: 1,
  source: "manual",
  books: {
    GEN: "Gn",
    EXO: "Ex",
    MAT: "Mt",
  },
  rules: {
    chapterVerseSeparator: ",",
    rangeSeparator: "-",
    bookChapterSeparator: " ",
  },
};

function makeAdapter(content: unknown): DataAdapter {
  return {
    read: async (_path: string) => JSON.stringify(content),
  } as unknown as DataAdapter;
}

describe("loadReferenceFormat", () => {
  it("returns correct ReferenceFormatRules from valid pack", async () => {
    const adapter = makeAdapter(VALID_FORMAT);
    const { rules } = await loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant");
    expect(rules.chapterVerseSeparator).toBe(",");
    expect(rules.rangeSeparator).toBe("-");
    expect(rules.bookChapterSeparator).toBe(" ");
    expect(rules.books["GEN"]).toBe("Gn");
    expect(rules.books["MAT"]).toBe("Mt");
  });

  it("returns correct ReferenceFormatMeta", async () => {
    const adapter = makeAdapter(VALID_FORMAT);
    const { meta } = await loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant");
    expect(meta.id).toBe("cs-protestant");
    expect(meta.displayName).toBe("Czech Protestant");
    expect(meta.lang).toBe("cs");
  });

  it("reads from reference-formats/ directory", async () => {
    const paths: string[] = [];
    const adapter = {
      read: async (path: string) => {
        paths.push(path);
        return JSON.stringify(VALID_FORMAT);
      },
    } as unknown as DataAdapter;
    await loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant");
    expect(paths[0]).toBe("plugins/biblens/reference-formats/cs-protestant.json");
  });

  it("throws on unsupported formatVersion", async () => {
    const adapter = makeAdapter({ ...VALID_FORMAT, formatVersion: 2 });
    await expect(loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant")).rejects.toThrow(
      /unsupported formatVersion/
    );
  });

  it("throws when mandatory field 'rules' is missing", async () => {
    const { rules: _, ...withoutRules } = VALID_FORMAT;
    void _;
    const adapter = makeAdapter(withoutRules);
    await expect(loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant")).rejects.toThrow(
      /missing mandatory field 'rules'/
    );
  });

  it("throws when mandatory field 'books' is missing", async () => {
    const { books: _, ...withoutBooks } = VALID_FORMAT;
    void _;
    const adapter = makeAdapter(withoutBooks);
    await expect(loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant")).rejects.toThrow(
      /missing mandatory field 'books'/
    );
  });

  it("throws when mandatory field 'displayName' is missing", async () => {
    const { displayName: _, ...withoutDn } = VALID_FORMAT;
    void _;
    const adapter = makeAdapter(withoutDn);
    await expect(loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant")).rejects.toThrow(
      /missing mandatory field 'displayName'/
    );
  });

  it("includes books map in returned rules", async () => {
    const adapter = makeAdapter(VALID_FORMAT);
    const { rules } = await loadReferenceFormat(adapter, "plugins/biblens", "cs-protestant");
    expect(Object.keys(rules.books)).toContain("GEN");
    expect(Object.keys(rules.books)).toContain("EXO");
    expect(Object.keys(rules.books)).toContain("MAT");
  });
});
