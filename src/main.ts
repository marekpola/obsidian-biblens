import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { fetchCatalogUpdate } from './sources/catalogManager';
import { isCatalogStale } from './sources/catalogUtils';
import { buildRefScanner } from './parser';
import type { RefScanner } from './parser';
import { PopoverManager } from './ui/hover';
import { refDecorationsExtension } from './editor/refDecorations';
import { refTooltipExtension } from './editor/refTooltip';
import { insertAfterLastRefCommand } from './editor/insertVerse';
import type { TranslationData } from './provider';
import { getVerses } from './provider';
import { buildVerseDOM } from './ui/verseDOM';
import { loadTranslation } from './translationLoader';
import { loadLanguagePack } from './languagePackLoader';
import { loadReferenceFormat } from './referenceFormatLoader';
import { buildAbbreviationMap, BUILT_IN_FORMAT_RULES, BOOK_ALIASES } from './books';
import type { BibLensSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { ReferenceFormatRules } from './types';
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

	// Mutable refFormat — mutated in-place so extensions always read current state
	private readonly _refFormat: ReferenceFormatRules = {
		chapterVerseSeparator: BUILT_IN_FORMAT_RULES.chapterVerseSeparator,
		rangeSeparator: BUILT_IN_FORMAT_RULES.rangeSeparator,
		bookChapterSeparator: BUILT_IN_FORMAT_RULES.bookChapterSeparator,
		books: { ...BUILT_IN_FORMAT_RULES.books },
	};

	// Internal scanner implementation — rebuilt on reloadScanner()
	private _currentScanner: RefScanner = { scan: () => [] };

	// Stable proxy scanner — passed to extensions once at registration;
	// delegates to _currentScanner so live updates take effect automatically
	readonly scanner: RefScanner = {
		scan: (text: string) => this._currentScanner.scan(text),
	};

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

		await this.reloadScanner();

		if (this.settings.autoUpdateCatalog && isCatalogStale(this.settings.catalogLastUpdated)) {
			fetchCatalogUpdate(this.app.vault.adapter, this.manifest.dir!)
				.then(result => {
					if (result.ok) {
						this.settings.catalogLastUpdated = result.updatedAt;
						void this.saveSettings();
					}
				})
				.catch((e: unknown) => console.error('BibLens: catalog auto-update failed', e));
		}

		this.addSettingTab(new BibLensSettingTab(this.app, this));

		this.addCommand({
			id: 'show-diagnostics',
			name: 'Show diagnostics',
			callback: () => new Notice(`BibLens v${this.manifest.version} is active.`)
		});

		this.addCommand({
			id: 'insert-verse-after-last',
			name: 'Insert verse text after previous reference',
			editorCallback: (editor) => {
				const view = (editor as unknown as { cm: EditorView }).cm;
				if (view) insertAfterLastRefCommand(
					this.scanner,
					this.translationData,
					this.settings.verseInsertionFormat,
					this._refFormat
				)(view);
			}
		});

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => this.processElement(el)
		);

		this.registerEditorExtension([
			refDecorationsExtension(this.scanner),
			refTooltipExtension(this.scanner, this.translationData, this._refFormat),
		]);
	}

	onunload() {
		this.popover.hide();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async reloadTranslation() {
		for (const k of Object.keys(this.translationData)) delete this.translationData[k];
		if (!this.settings.preferredTranslation) return;
		try {
			const newData = await loadTranslation(
				this.app.vault.adapter,
				this.manifest.dir!,
				this.settings.preferredTranslation
			);
			Object.assign(this.translationData, newData);
		} catch (e) {
			console.error('BibLens: failed to reload translation', e);
		}
	}

	async reloadScanner() {
		// Load language pack (or fall back to built-in)
		let map = buildAbbreviationMap({});
		if (this.settings.preferredLanguage) {
			try {
				const { map: packMap } = await loadLanguagePack(
					this.app.vault.adapter,
					this.manifest.dir!,
					this.settings.preferredLanguage
				);
				map = packMap;
			} catch (e) {
				console.error('BibLens: failed to load language pack, using built-in', e);
			}
		}

		// Load reference format pack (or fall back to built-in)
		let formatRules: ReferenceFormatRules = BUILT_IN_FORMAT_RULES;
		if (this.settings.standardReferenceFormat) {
			try {
				const { rules } = await loadReferenceFormat(
					this.app.vault.adapter,
					this.manifest.dir!,
					this.settings.standardReferenceFormat
				);
				formatRules = rules;
			} catch (e) {
				console.error('BibLens: failed to load reference format, using built-in', e);
			}
		}

		// Rebuild internal scanner (proxy delegates to this)
		this._currentScanner = buildRefScanner(map, formatRules, this.settings.parsingRules);

		// Mutate _refFormat in-place so all existing extension references see the new rules
		this._refFormat.chapterVerseSeparator = formatRules.chapterVerseSeparator;
		this._refFormat.rangeSeparator = formatRules.rangeSeparator;
		this._refFormat.bookChapterSeparator = formatRules.bookChapterSeparator;
		for (const k of Object.keys(this._refFormat.books)) delete this._refFormat.books[k];
		Object.assign(this._refFormat.books, formatRules.books);
	}

	private processElement(el: HTMLElement) {
		for (const node of collectTextNodes(el)) this.processTextNode(node);
	}

	private processTextNode(textNode: Text) {
		const text = textNode.textContent ?? '';
		const matches = this.scanner.scan(text);
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
				this.popover.show(e.target as HTMLElement, buildVerseDOM(getVerses(this.translationData, ref, this._refFormat))));
			this.registerDomEvent(span, 'mouseleave', () => this.popover.hide());

			fragment.appendChild(span);
			lastIndex = match.end;
		}

		if (lastIndex < text.length)
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

		parent.replaceChild(fragment, textNode);
	}
}
