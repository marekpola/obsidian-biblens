import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import { scanRefs, formatRef } from './parser';
import { PopoverManager } from './ui/hover';
import { refDecorationsExtension } from './editor/refDecorations';
import { refTooltipExtension } from './editor/refTooltip';

const EXCLUDED_TAGS = new Set(['A', 'CODE', 'PRE', 'SCRIPT', 'STYLE', 'BUTTON', 'INPUT', 'TEXTAREA']);

function collectTextNodes(root: HTMLElement): Text[] {
	const results: Text[] = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode(node: Node): number {
			let el = node.parentElement;
			while (el) {
				if (EXCLUDED_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
				if (el.hasClass('biblens-ref')) return NodeFilter.FILTER_REJECT;
				if (el === root) break;
				el = el.parentElement;
			}
			return NodeFilter.FILTER_ACCEPT;
		}
	});
	let node: Node | null;
	while ((node = walker.nextNode())) results.push(node as Text);
	return results;
}

export default class BibLensPlugin extends Plugin {
	private popover = new PopoverManager();

	async onload() {
		this.addCommand({
			id: 'show-diagnostics',
			name: 'Show Diagnostics',
			callback: () => new Notice(`BibLens v${this.manifest.version} is active.`)
		});

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => this.processElement(el)
		);

		this.registerEditorExtension([refDecorationsExtension, refTooltipExtension]);
	}

	onunload() {
		this.popover.hide();
	}

	private processElement(el: HTMLElement) {
		for (const node of collectTextNodes(el)) this.processTextNode(node);
	}

	private processTextNode(textNode: Text) {
		const text = textNode.textContent ?? '';
		const matches = scanRefs(text);
		if (matches.length === 0) return;

		const parent = textNode.parentNode;
		if (!parent) return;

		const fragment = document.createDocumentFragment();
		let lastIndex = 0;

		for (const match of matches) {
			if (match.start > lastIndex)
				fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.start)));

			const span = document.createElement('span');
			span.addClass('biblens-ref');
			span.textContent = match.matchText;

			const label = `Detected reference: ${formatRef(match.ref)}`;
			this.registerDomEvent(span, 'mouseenter', (e) => this.popover.show(e.target as HTMLElement, label));
			this.registerDomEvent(span, 'mouseleave', () => this.popover.hide());

			fragment.appendChild(span);
			lastIndex = match.end;
		}

		if (lastIndex < text.length)
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

		parent.replaceChild(fragment, textNode);
	}
}
