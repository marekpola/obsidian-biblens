import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { scanRefs } from './parser';
import { PopoverManager } from './ui/hover';
import { refDecorationsExtension } from './editor/refDecorations';
import { refTooltipExtension } from './editor/refTooltip';
import { insertAfterLastRefCommand } from './editor/insertVerse';
import type { TranslationData } from './provider';
import { getVerses } from './provider';
import { buildVerseDOM } from './ui/verseDOM';
import { loadTranslation } from './translationLoader';
import type { BibLensSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import { BibLensSettingTab } from './settingsTab';

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
	private translationData: TranslationData = {};
	settings!: BibLensSettings;

	async onload() {
		const saved = await this.loadData() as Partial<BibLensSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved ?? {});

		try {
			this.translationData = await loadTranslation(
				this.app.vault.adapter,
				this.manifest.dir!,
				this.settings.preferredTranslation
			);
		} catch (e) {
			console.error('BibLens: failed to load translation', e);
		}

		this.addSettingTab(new BibLensSettingTab(this.app, this));

		this.addCommand({
			id: 'show-diagnostics',
			name: 'Show diagnostics',
			callback: () => new Notice(`BibLens v${this.manifest.version} is active.`)
		});

		const scanner = { scan: scanRefs };
		this.addCommand({
			id: 'insert-verse-after-last',
			name: 'Insert verse text after previous reference',
			editorCallback: (editor) => {
				const view = (editor as unknown as { cm: EditorView }).cm;
				if (view) insertAfterLastRefCommand(scanner, this.translationData, this.settings.verseInsertionFormat)(view);
			}
		});

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => this.processElement(el)
		);

		this.registerEditorExtension([refDecorationsExtension, refTooltipExtension(this.translationData)]);
	}

	onunload() {
		this.popover.hide();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async reloadTranslation() {
		try {
			const newData = await loadTranslation(
				this.app.vault.adapter,
				this.manifest.dir!,
				this.settings.preferredTranslation
			);
			for (const k of Object.keys(this.translationData)) delete this.translationData[k];
			Object.assign(this.translationData, newData);
		} catch (e) {
			console.error('BibLens: failed to reload translation', e);
		}
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

			const ref = match.ref;
			this.registerDomEvent(span, 'mouseenter', (e) =>
				this.popover.show(e.target as HTMLElement, buildVerseDOM(getVerses(this.translationData, ref))));
			this.registerDomEvent(span, 'mouseleave', () => this.popover.hide());

			fragment.appendChild(span);
			lastIndex = match.end;
		}

		if (lastIndex < text.length)
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

		parent.replaceChild(fragment, textNode);
	}
}
