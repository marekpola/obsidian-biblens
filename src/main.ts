import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import enLanguagePack from './data/en.json';
import enSblFormatPack from './data/en-sbl.json';
import webTranslation from './data/web.json';
import { EditorView } from '@codemirror/view';
import { scannerEffect, scannerField } from './editor/scannerState';
import { buildRefScanner } from './parser';
import type { RefScanner } from './parser';
import { PopoverManager } from './ui/hover';
import { refDecorationsExtension } from './editor/refDecorations';
import { refTooltipExtension } from './editor/refTooltip';
import { insertAfterLastRefCommand, replaceLastRefWithQuoteCommand } from './editor/insertVerse';
import type { TranslationData } from './provider';
import { getVerses } from './provider';
import { buildVerseDOM } from './ui/verseDOM';
import { loadTranslation } from './translationLoader';
import { listAvailableTranslations } from './translationRegistry';
import { loadLanguagePack } from './languagePackLoader';
import { listAvailableLanguagePacks } from './languagePackRegistry';
import { loadReferenceFormat } from './referenceFormatLoader';
import { listAvailableReferenceFormats } from './referenceFormatRegistry';
import type { AbbreviationMap } from './books';
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
		chapterVerseSeparator: ':',
		rangeSeparator: '-',
		bookChapterSeparator: ' ',
		books: {},
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

		await this.writeStarterPackIfAbsent('recognition-languages/en.json', enLanguagePack);
		await this.writeStarterPackIfAbsent('reference-formats/en-sbl.json', enSblFormatPack);
		await this.writeStarterPackIfAbsent('translations/web.json', webTranslation);
		await this.applyStarterPackDefaults();

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

		this.addSettingTab(new BibLensSettingTab(this.app, this));

		this.addCommand({
			id: 'show-diagnostics',
			name: 'Show diagnostics',
			callback: () => new Notice(`BibLens v${this.manifest.version} is active.`)
		});

		this.addCommand({
			id: 'insert-verse-after-last',
			name: 'Insert verse after previous reference',
			editorCallback: (editor) => {
				const view = (editor as unknown as { cm: EditorView }).cm;
				if (view) insertAfterLastRefCommand(
					this.scanner,
					this.translationData,
					this._refFormat
				)(view);
			}
		});

		this.addCommand({
			id: 'replace-ref-with-quote',
			name: 'Replace previous reference with quote',
			editorCallback: (editor) => {
				const view = (editor as unknown as { cm: EditorView }).cm;
				if (view) replaceLastRefWithQuoteCommand(
					this.scanner,
					this.translationData,
					this._refFormat
				)(view);
			}
		});

		this.addCommand({
			id: 'open-settings',
			name: 'Open settings',
			callback: () => {
				const setting = (this.app as unknown as { setting: { open(): void; openTabById(id: string): void } }).setting;
				setting.open();
				setting.openTabById(this.manifest.id);
			}
		});

		this.addCommand({
			id: 'reload-for-development',
			name: 'Reload for development',
			callback: async () => {
				await this.reloadTranslation();
				await this.reloadScanner();
				new Notice('Plugin reloaded.');
			}
		});

		this.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => this.processElement(el)
		);

		this.registerEditorExtension([
			scannerField,
			refDecorationsExtension(),
			refTooltipExtension(this.translationData, this._refFormat),
		]);

		// Dispatch the scanner built during onload to editors that are already open
		this.dispatchScanner(this._currentScanner);

		// Dispatch to newly opened editors so they start with the current scanner
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (!leaf || leaf.getViewState().type !== 'markdown') return;
				const view = (leaf.view as unknown as { editor?: { cm?: EditorView } }).editor?.cm;
				if (view instanceof EditorView) {
					view.dispatch({ effects: scannerEffect.of(this._currentScanner) });
				}
			})
		);
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
		// Load language pack; use empty map (no-op scanner) if none selected or load fails
		let map: AbbreviationMap = {};
		if (this.settings.preferredLanguage) {
			try {
				const { map: packMap } = await loadLanguagePack(
					this.app.vault.adapter,
					this.manifest.dir!,
					this.settings.preferredLanguage
				);
				map = packMap;
			} catch (e) {
				console.error('BibLens: failed to load language pack', e);
			}
		}

		// Load reference format pack; leave undefined (no-op scanner) if none selected or load fails
		let formatRules: ReferenceFormatRules | undefined;
		if (this.settings.standardReferenceFormat) {
			try {
				const { rules } = await loadReferenceFormat(
					this.app.vault.adapter,
					this.manifest.dir!,
					this.settings.standardReferenceFormat
				);
				formatRules = rules;
			} catch (e) {
				console.error('BibLens: failed to load reference format', e);
			}
		}

		// Rebuild internal scanner (proxy delegates to this)
		this._currentScanner = buildRefScanner(map, formatRules, this.settings.parsingRules);

		// Mutate _refFormat in-place so all existing extension references see the new rules
		if (formatRules) {
			this._refFormat.chapterVerseSeparator = formatRules.chapterVerseSeparator;
			this._refFormat.rangeSeparator = formatRules.rangeSeparator;
			this._refFormat.bookChapterSeparator = formatRules.bookChapterSeparator;
			for (const k of Object.keys(this._refFormat.books)) delete this._refFormat.books[k];
			Object.assign(this._refFormat.books, formatRules.books);
		} else {
			this._refFormat.chapterVerseSeparator = ':';
			this._refFormat.rangeSeparator = '-';
			this._refFormat.bookChapterSeparator = ' ';
			for (const k of Object.keys(this._refFormat.books)) delete this._refFormat.books[k];
		}

		this.dispatchScanner(this._currentScanner);
	}

	private dispatchScanner(scanner: RefScanner) {
		this.app.workspace.iterateAllLeaves(leaf => {
			if (leaf.getViewState().type !== 'markdown') return;
			const view = (leaf.view as unknown as { editor?: { cm?: EditorView } }).editor?.cm;
			if (view instanceof EditorView) {
				view.dispatch({ effects: scannerEffect.of(scanner) });
			}
		});
	}

	private async applyStarterPackDefaults(): Promise<void> {
		if (this.settings.preferredTranslation && this.settings.standardReferenceFormat && this.settings.preferredLanguage) return;
		const [translations, formats, packs] = await Promise.all([
			listAvailableTranslations(this.app.vault.adapter, this.manifest.dir!),
			listAvailableReferenceFormats(this.app.vault.adapter, this.manifest.dir!),
			listAvailableLanguagePacks(this.app.vault.adapter, this.manifest.dir!),
		]);
		let needsSave = false;
		if (!this.settings.preferredTranslation && translations.length > 0) {
			this.settings.preferredTranslation = translations[0]!.id;
			needsSave = true;
		}
		if (!this.settings.standardReferenceFormat && formats.length > 0) {
			this.settings.standardReferenceFormat = formats[0]!.id;
			needsSave = true;
		}
		if (!this.settings.preferredLanguage && packs.length > 0) {
			this.settings.preferredLanguage = packs[0]!.id;
			needsSave = true;
		}
		if (needsSave) await this.saveSettings();
	}

	private async writeStarterPackIfAbsent(relativePath: string, data: unknown): Promise<void> {
		const fullPath = `${this.manifest.dir!}/${relativePath}`;
		try {
			if (!await this.app.vault.adapter.exists(fullPath)) {
				const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
				await this.app.vault.adapter.mkdir(dir);
				await this.app.vault.adapter.write(fullPath, JSON.stringify(data, null, 2));
			}
		} catch (e) {
			console.error(`BibLens: failed to write bundled starter pack ${relativePath}`, e);
		}
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
			this.registerDomEvent(span, 'mouseleave', () => this.popover.requestHide());

			fragment.appendChild(span);
			lastIndex = match.end;
		}

		if (lastIndex < text.length)
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

		parent.replaceChild(fragment, textNode);
	}
}
