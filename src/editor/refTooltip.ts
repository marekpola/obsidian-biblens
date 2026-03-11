import { EditorView, hoverTooltip, Tooltip } from "@codemirror/view";
import { scannerField } from "./scannerState";
import { getVerses, type TranslationData } from "../provider";
import type { ReferenceFormatRules } from "../types";
import { buildVerseDOM, buildMultiTranslationDOM } from "../ui/verseDOM";

export function refTooltipExtension(
	activeTranslations: { id: string; abbreviation: string; data: TranslationData }[],
	refFormat?: ReferenceFormatRules
) {
	return hoverTooltip(
		(view: EditorView, pos: number): Tooltip | null => {
			if (activeTranslations.length === 0) return null;

			const scanner = view.state.field(scannerField);
			const line = view.state.doc.lineAt(pos);
			const lineText = view.state.sliceDoc(line.from, line.to);
			const lineOffset = pos - line.from;

			for (const match of scanner.scan(lineText)) {
				if (match.start <= lineOffset && lineOffset <= match.end) {
					const dom = document.createElement("div");
					dom.addClass("biblens-editor-tooltip");

					if (activeTranslations.length === 1) {
						dom.appendChild(buildVerseDOM(getVerses(activeTranslations[0]!.data, match.ref, refFormat)));
					} else {
						// Always use stacked layout in editor tooltip — CM6 hoverTooltip dismisses
						// on mouse-leave before the user can reach paged navigation buttons.
						const blocks = activeTranslations.map(t => ({
							abbreviation: t.abbreviation,
							entries: getVerses(t.data, match.ref, refFormat),
						}));
						dom.appendChild(buildMultiTranslationDOM(blocks, true));
					}

					return {
						pos: line.from + match.start,
						end: line.from + match.end,
						create: () => ({ dom }),
					};
				}
			}
			return null;
		}
	);
}
