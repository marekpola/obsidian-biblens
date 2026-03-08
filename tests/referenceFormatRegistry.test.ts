import { describe, it, expect } from "vitest";
import { listAvailableReferenceFormats } from "../src/referenceFormatRegistry";
import type { DataAdapter } from "obsidian";

const CS_META = {
  id: "cs-protestant",
  displayName: "Czech Protestant",
  lang: "cs",
  formatVersion: 1,
  books: {},
  rules: { chapterVerseSeparator: ",", rangeSeparator: "-", bookChapterSeparator: " " },
};

const EN_META = {
  id: "en",
  displayName: "English",
  lang: "en",
  formatVersion: 1,
  books: {},
  rules: { chapterVerseSeparator: ":", rangeSeparator: "-", bookChapterSeparator: " " },
};

function makeAdapter(files: string[], contents: Record<string, unknown> = {}): DataAdapter {
  return {
    list: async (_path: string) => ({ files, folders: [] }),
    read: async (path: string) => {
      const key = path.split("/").pop()?.replace(/\.json$/, "") ?? "";
      return JSON.stringify(contents[key] ?? {});
    },
  } as unknown as DataAdapter;
}

describe("listAvailableReferenceFormats", () => {
  it("returns ReferenceFormatMeta for each .json file", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/reference-formats/cs-protestant.json", "plugins/biblens/reference-formats/en.json"],
      { "cs-protestant": CS_META, en: EN_META }
    );
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toContain("cs-protestant");
    expect(result.map(m => m.id)).toContain("en");
  });

  it("returns correct metadata fields", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/reference-formats/cs-protestant.json"],
      { "cs-protestant": CS_META }
    );
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result[0]).toEqual({ id: "cs-protestant", displayName: "Czech Protestant", lang: "cs" });
  });

  it("ignores non-.json files", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/reference-formats/cs-protestant.json", "plugins/biblens/reference-formats/readme.txt"],
      { "cs-protestant": CS_META }
    );
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cs-protestant");
  });

  it("returns empty array when directory does not exist (adapter.list throws)", async () => {
    const adapter = {
      list: async () => { throw new Error("ENOENT"); },
    } as unknown as DataAdapter;
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result).toEqual([]);
  });

  it("returns empty array when directory is empty", async () => {
    const adapter = makeAdapter([]);
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result).toEqual([]);
  });

  it("falls back to id-based meta when file cannot be read", async () => {
    const adapter = {
      list: async () => ({ files: ["plugins/biblens/reference-formats/cs-protestant.json"], folders: [] }),
      read: async () => { throw new Error("read error"); },
    } as unknown as DataAdapter;
    const result = await listAvailableReferenceFormats(adapter, "plugins/biblens");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cs-protestant");
  });
});
