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

const data: TranslationData = {
	"GEN.1.1": "Na počátku stvořil Bůh nebe a zemi.",
	"MAT.5.3": "Blahoslavení chudí duchem.",
};

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
		expect(insertAfterLastRefCommand(scanner, data)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("returns false when verse data missing", () => {
		const { view, wasDispatched } = makeView("Rev 99,1");
		expect(insertAfterLastRefCommand(scanner, data)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("inserts inline verse after last reference before cursor", () => {
		const { view, getInsert } = makeView("See Gn 1,1 for reference.");
		expect(insertAfterLastRefCommand(scanner, data)(view)).toBe(true);
		expect(getInsert()).toBe(" — Na počátku stvořil Bůh nebe a zemi.");
	});

	it("uses last reference before cursor, not last in document", () => {
		// cursor placed between the two references
		const doc = "Mt 5,3 and then more text. Gn 1,1 appears later.";
		const cursorAfterMt = "Mt 5,3".length + 1; // just after Mt 5,3
		const { view, getInsert } = makeView(doc, cursorAfterMt);
		insertAfterLastRefCommand(scanner, data)(view);
		expect(getInsert()).toBe(" — Blahoslavení chudí duchem.");
	});

	it("returns false when cursor is before all references", () => {
		const doc = "Start. Gn 1,1 appears later.";
		const { view, wasDispatched } = makeView(doc, 3); // cursor at "Sta|rt"
		expect(insertAfterLastRefCommand(scanner, data)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});
});

describe("replaceLastRefWithQuoteCommand", () => {
	it("replaces reference with blockquote (mid-line adds leading newline)", () => {
		const doc = "See Gn 1,1 for reference.";
		const { view, getInsert, getFrom, getTo } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, data, EN_FORMAT)(view);
		expect(getInsert()).toBe("\n> Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n");
		// "See " = 4 chars; "Gn 1,1" starts at 4, ends at 10
		expect(getFrom()).toBe(4);
		expect(getTo()).toBe(10);
	});

	it("replaces reference without leading newline when reference is at line start", () => {
		const doc = "Some intro.\nGn 1,1";
		const { view, getInsert } = makeView(doc);
		replaceLastRefWithQuoteCommand(scanner, data, EN_FORMAT)(view);
		expect(getInsert()).toBe("> Gen 1:1 Na počátku stvořil Bůh nebe a zemi.\n");
	});

	it("returns false when no references found", () => {
		const { view, wasDispatched } = makeView("No references here.");
		expect(replaceLastRefWithQuoteCommand(scanner, data, EN_FORMAT)(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});
});
