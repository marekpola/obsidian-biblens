import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { RangeSetBuilder } from "@codemirror/state";
import { scannerEffect, scannerField } from "./scannerState";

const refMark = Decoration.mark({ class: "biblens-ref" });

function buildDecorations(view: EditorView): DecorationSet {
	const scanner = view.state.field(scannerField);
	const builder = new RangeSetBuilder<Decoration>();
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.sliceDoc(from, to);
		for (const match of scanner.scan(text)) {
			builder.add(from + match.start, from + match.end, refMark);
		}
	}
	return builder.finish();
}

export function refDecorationsExtension(): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view);
			}

			update(update: ViewUpdate) {
				const scannerChanged = update.transactions.some(tr =>
					tr.effects.some(e => e.is(scannerEffect))
				);
				if (update.docChanged || update.viewportChanged || scannerChanged) {
					this.decorations = buildDecorations(update.view);
				}
			}
		},
		{ decorations: (v) => v.decorations }
	);
}
