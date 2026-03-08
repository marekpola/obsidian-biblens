import { EditorView, hoverTooltip, Tooltip } from "@codemirror/view";
import type { RefScanner } from "../parser";
import { getVerses, type TranslationData } from "../provider";
import type { ReferenceFormatRules } from "../types";
import { buildVerseDOM } from "../ui/verseDOM";

export function refTooltipExtension(
	scanner: RefScanner,
	data: TranslationData,
	refFormat?: ReferenceFormatRules
) {
	return hoverTooltip(
		(view: EditorView, pos: number): Tooltip | null => {
			const line = view.state.doc.lineAt(pos);
			const lineText = view.state.sliceDoc(line.from, line.to);
			const lineOffset = pos - line.from;

			for (const match of scanner.scan(lineText)) {
				if (match.start <= lineOffset && lineOffset <= match.end) {
					const dom = document.createElement("div");
					dom.addClass("biblens-editor-tooltip");
					dom.appendChild(buildVerseDOM(getVerses(data, match.ref, refFormat)));
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
