import { EditorView, hoverTooltip, Tooltip } from "@codemirror/view";
import { scanRefs } from "../parser";
import { getVerses, buildVerseDOM, type TranslationData } from "../provider";

export function refTooltipExtension(data: TranslationData) {
	return hoverTooltip(
		(view: EditorView, pos: number): Tooltip | null => {
			const line = view.state.doc.lineAt(pos);
			const lineText = view.state.sliceDoc(line.from, line.to);
			const lineOffset = pos - line.from;

			for (const match of scanRefs(lineText)) {
				if (match.start <= lineOffset && lineOffset <= match.end) {
					const dom = document.createElement("div");
					dom.addClass("biblens-editor-tooltip");
					dom.appendChild(buildVerseDOM(getVerses(data, match.ref)));
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
