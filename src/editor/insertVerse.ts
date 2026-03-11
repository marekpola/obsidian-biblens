import type { EditorView } from "@codemirror/view";
import type { TranslationData, VerseEntry } from "../provider";
import { getVerses } from "../provider";
import type { RefScanner } from "../parser";
import type { ReferenceFormatRules } from "../types";

type ActiveTranslation = { id: string; abbreviation: string; data: TranslationData };

function formatEntries(entries: VerseEntry[]): string {
	return entries.map(e => e.text).join(' ');
}

export function insertAfterLastRefCommand(
	scanner: RefScanner,
	activeTranslations: ActiveTranslation[],
	refFormat?: ReferenceFormatRules
) {
	return (view: EditorView): boolean => {
		if (activeTranslations.length === 0) return false;

		const cursor = view.state.selection.main.head;
		const text = view.state.doc.toString();
		const matches = scanner.scan(text).filter(m => m.end <= cursor);
		const last = matches[matches.length - 1];
		if (!last) return false;

		const t = activeTranslations[0]!;
		const entries = getVerses(t.data, last.ref, refFormat);
		if (entries.length === 0) return false;

		const verseText = formatEntries(entries);
		view.dispatch({ changes: { from: last.end, insert: ` — ${verseText}` } });
		return true;
	};
}

export function replaceLastRefWithQuoteCommand(
	scanner: RefScanner,
	activeTranslations: ActiveTranslation[],
	refFormat?: ReferenceFormatRules
) {
	return (view: EditorView): boolean => {
		if (activeTranslations.length === 0) return false;

		const cursor = view.state.selection.main.head;
		const text = view.state.doc.toString();
		const matches = scanner.scan(text).filter(m => m.end <= cursor);
		const last = matches[matches.length - 1];
		if (!last) return false;

		const lines: string[] = [];
		for (const t of activeTranslations) {
			const entries = getVerses(t.data, last.ref, refFormat);
			for (const e of entries) {
				lines.push(`> ${t.abbreviation} ${e.label} ${e.text}`);
			}
		}
		if (lines.length === 0) return false;

		const atLineStart = last.start === 0 || text[last.start - 1] === '\n';
		const prefix = atLineStart ? '' : '\n';
		view.dispatch({ changes: { from: last.start, to: last.end, insert: `${prefix}${lines.join('\n')}\n` } });
		return true;
	};
}
