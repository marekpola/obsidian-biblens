import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import { parseCzechBibleRef } from './parser';
import type { BibleRef } from './types';

// Matches potential Czech Bible references: optional leading digit, uppercase start, then space + chapter/verse.
// False positives are filtered out by parseCzechBibleRef.
const REF_REGEX = /\b((?:[1-3])?[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ][a-záčďéěíňóřšťůúýž]{0,10})\s+(\d+(?:[,:](?:\d+)(?:-\d+)?)?)/g;

function formatRef(ref: BibleRef): string {
	let s = `${ref.bookId} ${ref.chapterStart}`;
	if (ref.verseStart !== undefined) {
		s += `,${ref.verseStart}`;
		if (ref.verseEnd !== undefined) {
			s += `-${ref.verseEnd}`;
		}
	}
	return s;
}

export default class BibLensPlugin extends Plugin {
	private popoverEl: HTMLElement | null = null;

	async onload() {
		this.addCommand({
			id: 'show-diagnostics',
			name: 'Show Diagnostics',
			callback: () => {
				const { version } = this.manifest;
				new Notice(`BibLens v${version} is active.`);
			}
		});

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => this.processElement(el)
		);
	}

	onunload() {
		this.hidePopover();
	}

	private processElement(el: HTMLElement) {
		const textNodes = collectTextNodes(el);
		for (const textNode of textNodes) {
			this.processTextNode(textNode);
		}
	}

	private processTextNode(textNode: Text) {
		const text = textNode.textContent ?? '';
		const matches: Array<{ start: number; end: number; matchText: string; ref: BibleRef }> = [];

		REF_REGEX.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = REF_REGEX.exec(text)) !== null) {
			const matchText = m[0];
			const result = parseCzechBibleRef(matchText);
			if (result.ok) {
				matches.push({ start: m.index, end: m.index + matchText.length, matchText, ref: result.ref });
			}
		}

		if (matches.length === 0) return;

		const parent = textNode.parentNode;
		if (!parent) return;

		const fragment = document.createDocumentFragment();
		let lastIndex = 0;

		for (const match of matches) {
			if (match.start > lastIndex) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.start)));
			}

			const span = document.createElement('span');
			span.addClass('biblens-ref');
			span.textContent = match.matchText;

			const normalized = formatRef(match.ref);
			this.registerDomEvent(span, 'mouseenter', (e) => {
				this.showPopover(e.target as HTMLElement, normalized);
			});
			this.registerDomEvent(span, 'mouseleave', () => {
				this.hidePopover();
			});

			fragment.appendChild(span);
			lastIndex = match.end;
		}

		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
		}

		parent.replaceChild(fragment, textNode);
	}

	private showPopover(anchor: HTMLElement, normalized: string) {
		this.hidePopover();

		const popover = document.createElement('div');
		popover.addClass('biblens-popover');
		popover.textContent = `Detected reference: ${normalized}`;

		// Append first so offsetWidth/offsetHeight are measurable after paint.
		// Position is fixed so scroll offsets are irrelevant.
		document.body.appendChild(popover);
		this.popoverEl = popover;

		const anchorRect = anchor.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const pw = popover.offsetWidth;
		const ph = popover.offsetHeight;
		const GAP = 4;

		// Prefer below the anchor; flip above if it would clip the bottom edge.
		let top = anchorRect.bottom + GAP;
		if (top + ph > vh) top = anchorRect.top - ph - GAP;
		if (top < 0) top = GAP;

		// Align left with anchor; clamp to viewport.
		let left = anchorRect.left;
		if (left + pw > vw) left = vw - pw - GAP;
		if (left < 0) left = GAP;

		popover.style.top = `${top}px`;
		popover.style.left = `${left}px`;
	}

	private hidePopover() {
		if (this.popoverEl) {
			this.popoverEl.remove();
			this.popoverEl = null;
		}
	}
}

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
	while ((node = walker.nextNode())) {
		results.push(node as Text);
	}
	return results;
}
