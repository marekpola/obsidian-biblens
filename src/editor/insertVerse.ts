import type { EditorView } from "@codemirror/view";
import type { TranslationData, VerseEntry } from "../provider";
import { getVerses } from "../provider";
import type { RefScanner } from "../parser";
import { formatRef } from "../parser";
import type { ReferenceFormatRules } from "../types";

function formatEntries(entries: VerseEntry[]): string {
	return entries.map(e => e.text).join(' ');
}

export function insertAfterLastRefCommand(
	scanner: RefScanner,
	data: TranslationData,
	refFormat?: ReferenceFormatRules
) {
	return (view: EditorView): boolean => {
		const cursor = view.state.selection.main.head;
		const text = view.state.doc.toString();
		const matches = scanner.scan(text).filter(m => m.end <= cursor);
		const last = matches[matches.length - 1];
		if (!last) return false;

		const entries = getVerses(data, last.ref, refFormat);
		if (entries.length === 0) return false;

		const verseText = formatEntries(entries);
		view.dispatch({ changes: { from: last.end, insert: ` — ${verseText}` } });
		return true;
	};
}

export function replaceLastRefWithQuoteCommand(
	scanner: RefScanner,
	data: TranslationData,
	refFormat?: ReferenceFormatRules
) {
	return (view: EditorView): boolean => {
		const cursor = view.state.selection.main.head;
		const text = view.state.doc.toString();
		const matches = scanner.scan(text).filter(m => m.end <= cursor);
		const last = matches[matches.length - 1];
		if (!last) return false;

		const entries = getVerses(data, last.ref, refFormat);
		if (entries.length === 0) return false;

		const verseText = formatEntries(entries);
		const atLineStart = last.start === 0 || text[last.start - 1] === '\n';
		const prefix = atLineStart ? '' : '\n';
		view.dispatch({ changes: { from: last.start, to: last.end, insert: `${prefix}> ${formatRef(last.ref, refFormat)} ${verseText}\n` } });
		return true;
	};
}
