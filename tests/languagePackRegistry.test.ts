import { describe, it, expect } from "vitest";
import { listAvailableLanguagePacks } from "../src/languagePackRegistry";
import type { DataAdapter } from "obsidian";

const CS_META = {
  id: "cs",
  displayName: "Czech",
  lang: "cs",
  formatVersion: 1,
  books: {},
};

const EN_META = {
  id: "en",
  displayName: "English",
  lang: "en",
  formatVersion: 1,
  books: {},
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

describe("listAvailableLanguagePacks", () => {
  it("returns LanguagePackMeta for each .json file", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/recognition-languages/cs.json", "plugins/biblens/recognition-languages/en.json"],
      { cs: CS_META, en: EN_META }
    );
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toContain("cs");
    expect(result.map(m => m.id)).toContain("en");
  });

  it("returns correct metadata fields", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/recognition-languages/cs.json"],
      { cs: CS_META }
    );
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result[0]).toEqual({ id: "cs", displayName: "Czech", lang: "cs" });
  });

  it("ignores non-.json files", async () => {
    const adapter = makeAdapter(
      ["plugins/biblens/recognition-languages/cs.json", "plugins/biblens/recognition-languages/readme.txt"],
      { cs: CS_META }
    );
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cs");
  });

  it("returns empty array when directory does not exist (adapter.list throws)", async () => {
    const adapter = {
      list: async () => { throw new Error("ENOENT"); },
    } as unknown as DataAdapter;
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result).toEqual([]);
  });

  it("returns empty array when directory is empty", async () => {
    const adapter = makeAdapter([]);
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result).toEqual([]);
  });

  it("falls back to id-based meta when file cannot be read", async () => {
    const adapter = {
      list: async () => ({ files: ["plugins/biblens/recognition-languages/cs.json"], folders: [] }),
      read: async () => { throw new Error("read error"); },
    } as unknown as DataAdapter;
    const result = await listAvailableLanguagePacks(adapter, "plugins/biblens");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cs");
  });
});
