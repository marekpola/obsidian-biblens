import { describe, it, expect } from "vitest";
import { insertAfterLastRefCommand, replaceLastRefWithQuoteCommand } from "../src/editor/insertVerse";
import { scanRefs } from "../src/parser";
import type { TranslationData } from "../src/provider";
import type { RefScanner } from "../src/parser";
import type { EditorView } from "@codemirror/view";
import type { ReferenceFormatRules } from "../src/types";

const EN_FORMAT: ReferenceFormatRules = {
	chapterVerseSeparator: ':',
	rangeSeparator: '-',
	bookChapterSeparator: ' ',
	books: { GEN: "Gen", MAT: "Matt" },
};

const dataA: TranslationData = {
	"GEN.1.1": "Na počátku stvořil Bůh nebe a zemi.",
	"MAT.5.3": "Blahoslavení chudí duchem.",
};

const dataB: TranslationData = {
	"GEN.1.1": "In the beginning God created the heavens and the earth.",
	"MAT.5.3": "Blessed are the poor in spirit.",
};

const translA = [{ id: 'cep', abbreviation: 'CEP', data: dataA }];
const translAB = [
	{ id: 'cep', abbreviation: 'CEP', data: dataA },
	{ id: 'web', abbreviation: 'WEB', data: dataB },
];

function makeView(docText: string, cursor?: number) {
	let lastInsert: string | undefined;
	let lastFrom: number | undefined;
	let lastTo: number | undefined;
	let dispatchCalled = false;
	const head = cursor ?? docText.length;
	const view = {
		state: {
			doc: { toString: () => docText },
			selection: { main: { head } },
		},
		dispatch(arg: { changes: { from: number; to?: number; insert: string } }) {
			dispatchCalled = true;
			lastInsert = arg.changes.insert;
			lastFrom = arg.changes.from;
			lastTo = arg.changes.to;
		},
	} as unknown as EditorView;
	return { view, getInsert: () => lastInsert, getFrom: () => lastFrom, getTo: () => lastTo, wasDispatched: () => dispatchCalled };
}

const scanner: RefScanner = { scan: scanRefs };

describe("insertAfterLastRefCommand", () => {
	it("returns false when no references found", () => {
		const { view, wasDispatched } = makeView("No references here.");
		expect(insertAfterLastRefCommand(scanner, translA)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("returns false when verse data missing", () => {
		const { view, wasDispatched } = makeView("Rev 99,1");
		expect(insertAfterLastRefCommand(scanner, translA)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("returns false when activeTranslations is empty", () => {
		const { view, wasDispatched } = makeView("See Gn 1,1 for reference.");
		expect(insertAfterLastRefCommand(scanner, [])(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("inserts inline verse after last reference before cursor", () => {
		const { view, getInsert } = makeView("See Gn 1,1 for reference.");
		expect(insertAfterLastRefCommand(scanner, translA)(view)).toBe(true);
		expect(getInsert()).toBe(" — Na počátku stvořil Bůh nebe a zemi.");
	});

	it("uses priority-1 translation only", () => {
		const { view, getInsert } = makeView("See Gn 1,1 for reference.");
		expect(insertAfterLastRefCommand(scanner, translAB)(view)).toBe(true);
		expect(getInsert()).toBe(" — Na počátku stvořil Bůh nebe a zemi.");
	});

	it("uses last reference before cursor, not last in document", () => {
		const doc = "Mt 5,3 and then more text. Gn 1,1 appears later.";
		const cursorAfterMt = "Mt 5,3".length + 1;
		const { view, getInsert } = makeView(doc, cursorAfterMt);
		insertAfterLastRefCommand(scanner, translA)(view);
		expect(getInsert()).toBe(" — Blahoslavení chudí duchem.");
	});

	it("returns false when cursor is before all references", () => {
		const doc = "Start. Gn 1,1 appears later.";
		const { view, wasDispatched } = makeView(doc, 3);
		expect(insertAfterLastRefCommand(scanner, translA)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});
});

describe("replaceLastRefWithQuoteCommand", () => {
	it("replaces reference with blockquote including abbreviation (mid-line adds leading newline)", () => {
		const doc = "See Gn 1,1 for reference.";
		const { view, getInsert, getFrom, getTo } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, translA, EN_FORMAT)(view);
		expect(getInsert()).toBe("\n> CEP Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n");
		expect(getFrom()).toBe(4);
		expect(getTo()).toBe(10);
	});

	it("replaces reference without leading newline when reference is at line start", () => {
		const doc = "Some intro.\nGn 1,1";
		const { view, getInsert } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, translA, EN_FORMAT)(view);
		expect(getInsert()).toBe("> CEP Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n");
	});

	it("returns false when no references found", () => {
		const { view, wasDispatched } = makeView("No references here.");
		expect(replaceLastRefWithQuoteCommand(scanner, translA, EN_FORMAT)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("returns false when activeTranslations is empty", () => {
		const { view, wasDispatched } = makeView("Gn 1,1");
		expect(replaceLastRefWithQuoteCommand(scanner, [], EN_FORMAT)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("two translations produce two quote lines in priority order", () => {
		const doc = "See Gn 1,1.";
		const { view, getInsert } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, translAB, EN_FORMAT)(view);
		expect(getInsert()).toBe(
			"\n> CEP Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n> WEB Gen 1:1 In the beginning God created the heavens and the earth.\n"
		);
	});

	it("translation with no verse for the reference is silently omitted", () => {
		const emptyB = [
			{ id: 'cep', abbreviation: 'CEP', data: dataA },
			{ id: 'noverses', abbreviation: 'XYZ', data: {} },
		];
		const doc = "See Gn 1,1.";
		const { view, getInsert } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, emptyB, EN_FORMAT)(view);
		expect(getInsert()).toBe("\n> CEP Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n");
	});

	it("returns false when all translations have no verse for the reference", () => {
		const { view, wasDispatched } = makeView("Rev 99,1");
		expect(replaceLastRefWithQuoteCommand(scanner, translAB, EN_FORMAT)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});
});
