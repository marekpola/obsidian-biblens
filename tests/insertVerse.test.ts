import { describe, it, expect } from "vitest";
import { insertAfterLastRefCommand } from "../src/editor/insertVerse";
import { scanRefs } from "../src/parser";
import type { TranslationData } from "../src/provider";
import type { RefScanner } from "../src/parser";
import type { EditorView } from "@codemirror/view";

const data: TranslationData = {
	"GEN.1.1": "Na počátku stvořil Bůh nebe a zemi.",
	"MAT.5.3": "Blahoslavení chudí duchem.",
};

function makeView(docText: string, cursor?: number) {
	let lastInsert: string | undefined;
	let dispatchCalled = false;
	const head = cursor ?? docText.length;
	const view = {
		state: {
			doc: { toString: () => docText },
			selection: { main: { head } },
		},
		dispatch(arg: { changes: { from: number; insert: string } }) {
			dispatchCalled = true;
			lastInsert = arg.changes.insert;
		},
	} as unknown as EditorView;
	return { view, getInsert: () => lastInsert, wasDispatched: () => dispatchCalled };
}

const scanner: RefScanner = { scan: scanRefs };

describe("insertAfterLastRefCommand", () => {
	it("returns false when no references found", () => {
		const { view, wasDispatched } = makeView("No references here.");
		expect(insertAfterLastRefCommand(scanner, data, "inline")(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("returns false when verse data missing", () => {
		const { view, wasDispatched } = makeView("Rev 99,1");
		expect(insertAfterLastRefCommand(scanner, data, "inline")(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});

	it("inserts inline verse after last reference before cursor", () => {
		const { view, getInsert } = makeView("See Gn 1,1 for reference.");
		expect(insertAfterLastRefCommand(scanner, data, "inline")(view)).toBe(true);
		expect(getInsert()).toBe(" — Na počátku stvořil Bůh nebe a zemi.");
	});

	it("inserts blockquote verse after last reference before cursor", () => {
		const { view, getInsert } = makeView("See Gn 1,1 for reference.");
		insertAfterLastRefCommand(scanner, data, "blockquote")(view);
		expect(getInsert()).toBe("\n> Na počátku stvořil Bůh nebe a zemi.");
	});

	it("uses last reference before cursor, not last in document", () => {
		// cursor placed between the two references
		const doc = "Mt 5,3 and then more text. Gn 1,1 appears later.";
		const cursorAfterMt = "Mt 5,3".length + 1; // just after Mt 5,3
		const { view, getInsert } = makeView(doc, cursorAfterMt);
		insertAfterLastRefCommand(scanner, data, "inline")(view);
		expect(getInsert()).toBe(" — Blahoslavení chudí duchem.");
	});

	it("returns false when cursor is before all references", () => {
		const doc = "Start. Gn 1,1 appears later.";
		const { view, wasDispatched } = makeView(doc, 3); // cursor at "Sta|rt"
		expect(insertAfterLastRefCommand(scanner, data, "inline")(view)).toBe(false);
		expect(wasDispatched()).toBe(false);
	});
});
