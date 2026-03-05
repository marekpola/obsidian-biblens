import { describe, it, expect } from "vitest";
import { listAvailableTranslations } from "../src/translationRegistry";
import type { DataAdapter } from "obsidian";

function makeAdapter(files: string[]): DataAdapter {
	return {
		list: async (_path: string) => ({ files, folders: [] }),
	} as unknown as DataAdapter;
}

describe("listAvailableTranslations", () => {
	it("returns a TranslationMeta for each .json file", async () => {
		const adapter = makeAdapter(["plugins/biblens/translations/cep.json", "plugins/biblens/translations/bkr.json"]);
		const result = await listAvailableTranslations(adapter, "plugins/biblens");
		expect(result).toHaveLength(2);
		expect(result.map(t => t.id)).toContain("cep");
		expect(result.map(t => t.id)).toContain("bkr");
	});

	it("ignores non-.json files", async () => {
		const adapter = makeAdapter(["plugins/biblens/translations/cep.json", "plugins/biblens/translations/readme.txt"]);
		const result = await listAvailableTranslations(adapter, "plugins/biblens");
		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("cep");
	});

	it("returns empty array when translations/ is empty", async () => {
		const adapter = makeAdapter([]);
		const result = await listAvailableTranslations(adapter, "plugins/biblens");
		expect(result).toEqual([]);
	});

	it("returns empty array when adapter.list throws", async () => {
		const adapter = {
			list: async () => { throw new Error("not found"); },
		} as unknown as DataAdapter;
		const result = await listAvailableTranslations(adapter, "plugins/biblens");
		expect(result).toEqual([]);
	});

	it("displayName is uppercased id", async () => {
		const adapter = makeAdapter(["plugins/biblens/translations/cep.json"]);
		const result = await listAvailableTranslations(adapter, "plugins/biblens");
		expect(result[0]?.displayName).toBe("CEP");
	});
});
