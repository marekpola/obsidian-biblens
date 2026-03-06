import type { EditorView } from "@codemirror/view";
import type { TranslationData, VerseEntry } from "../provider";
import { getVerses } from "../provider";
import type { RefScanner } from "../parser";

export type InsertionFormat = 'inline' | 'blockquote';

function formatEntries(entries: VerseEntry[]): string {
	return entries.map(e => e.text).join(' ');
}

export function insertAfterLastRefCommand(
	scanner: RefScanner,
	data: TranslationData,
	format: InsertionFormat
) {
	return (view: EditorView): boolean => {
		const cursor = view.state.selection.main.head;
		const text = view.state.doc.toString();
		const matches = scanner.scan(text).filter(m => m.end <= cursor);
		const last = matches[matches.length - 1];
		if (!last) return false;

		const entries = getVerses(data, last.ref);
		if (entries.length === 0) return false;

		const verseText = formatEntries(entries);
		const insertion = format === 'blockquote'
			? `\n> ${verseText}`
			: ` — ${verseText}`;

		view.dispatch({ changes: { from: last.end, insert: insertion } });
		return true;
	};
}
