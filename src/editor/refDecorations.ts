import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { RangeSetBuilder } from "@codemirror/state";
import type { RefScanner } from "../parser";

const refMark = Decoration.mark({ class: "biblens-ref" });

function buildDecorations(view: EditorView, scanner: RefScanner): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.sliceDoc(from, to);
		for (const match of scanner.scan(text)) {
			builder.add(from + match.start, from + match.end, refMark);
		}
	}
	return builder.finish();
}

export function refDecorationsExtension(scanner: RefScanner): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, scanner);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = buildDecorations(update.view, scanner);
				}
			}
		},
		{ decorations: (v) => v.decorations }
	);
}
