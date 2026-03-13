import { App, ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting, requestUrl } from 'obsidian';

function reassignPriority(
	translationOrder: Record<string, number | null>,
	targetId: string,
	newPriority: number | null
): void {
	const others = Object.entries(translationOrder)
		.filter(([id, p]) => id !== targetId && p !== null)
		.sort(([, a], [, b]) => (a as number) - (b as number))
		.map(([id]) => id);
	if (newPriority !== null) {
		const insertAt = Math.min(newPriority - 1, others.length);
		others.splice(insertAt, 0, targetId);
	}
	for (const id of Object.keys(translationOrder)) translationOrder[id] = null;
	others.forEach((id, idx) => { translationOrder[id] = idx + 1; });
}
import type BibLensPlugin from './main';
import { listAvailableTranslations } from './translationRegistry';
import { listAvailableLanguagePacks } from './languagePackRegistry';
import { listAvailableReferenceFormats } from './referenceFormatRegistry';
import { loadCatalog } from './sources/catalogManager';
import { downloadFromSource, deleteTranslation } from './translationManager';
import { downloadLanguagePack, deleteLanguagePack, downloadReferenceFormat, deleteReferenceFormat } from './packManager';
import type { SourceProvider, LanguagePackProvider, ReferenceFormatProvider, RemoteTranslationEntry, RemoteLanguagePackEntry, RemoteReferenceFormatEntry } from './sources/catalog';
import { getAdapter, getLanguagePackAdapter, getReferenceFormatAdapter } from './sources/adapters';
import type { CatalogData, TranslationMeta, ReferenceFormatMeta, LanguagePackMeta } from './types';
import { getActivePriority1Id } from './translationOrder';

export class BibLensSettingTab extends PluginSettingTab {
	private plugin: BibLensPlugin;
	private selectedTranslProvId: string | null = null;
	private selectedFormatProvId: string | null = null;
	private selectedLangProvId: string | null = null;
	private translationsExpanded = false;
	private formatsExpanded = false;
	private languagesExpanded = false;

	constructor(app: App, plugin: BibLensPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const generalContainer = containerEl.createDiv();
		const translContainer = containerEl.createDiv();
		const formatsContainer = containerEl.createDiv();
		const langsContainer = containerEl.createDiv();

		Promise.all([
			loadCatalog(this.app.vault.adapter, this.plugin.manifest.dir!),
			listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!),
			listAvailableReferenceFormats(this.app.vault.adapter, this.plugin.manifest.dir!),
			listAvailableLanguagePacks(this.app.vault.adapter, this.plugin.manifest.dir!),
		])
			.then(async ([catalog, translations, formats, packs]) => {
				// Auto-default logic
				const s = this.plugin.settings;
				let needsSave = false;
				let needsReloadTranslation = false;
				let needsReloadScanner = false;

				if (!getActivePriority1Id(s) && translations.length > 0) {
					s.translationOrder[translations[0]!.id] = 1;
					needsSave = true;
					needsReloadTranslation = true;
				}
				if (s.standardReferenceFormat === '' && formats.length > 0) {
					s.standardReferenceFormat = formats[0]!.id;
					needsSave = true;
					needsReloadScanner = true;
				}
				if (s.preferredLanguage === '' && packs.length > 0) {
					s.preferredLanguage = packs[0]!.id;
					needsSave = true;
					needsReloadScanner = true;
				}

				if (needsSave) await this.plugin.saveSettings();
				if (needsReloadTranslation) await this.plugin.reloadAllTranslations();
				if (needsReloadScanner) await this.plugin.reloadScanner();

				// Build status
				const translName = translations.find(t => t.id === getActivePriority1Id(s))?.displayName
					?? 'None — verse text unavailable';
				const fmtName = formats.find(f => f.id === s.standardReferenceFormat)?.displayName
					?? 'None — reference format unavailable';
				const langName = packs.find(p => p.id === s.preferredLanguage)?.displayName
					?? 'None — recognition language unavailable';

				this.renderGeneral(generalContainer, { translName, fmtName, langName });
				this.renderInstalledTranslations(translContainer, catalog, translations);
				this.renderInstalledFormats(formatsContainer, catalog, formats);
				this.renderInstalledLanguages(langsContainer, catalog, packs);
			})
			.catch((e: unknown) => console.error('BibLens: failed to load settings data', e));
	}

	private renderGeneral(
	containerEl: HTMLElement,
	status: { translName: string; fmtName: string; langName: string }
	): void {

		new Setting(containerEl).setName('Current').setHeading();

		const info = containerEl.createDiv('biblens-current-settings');

		info.createEl('div', {
			text: `Translation: ${status.translName}`
		});

		info.createEl('div', {
			text: `Reference format: ${status.fmtName}`
		});

		info.createEl('div', {
			text: `Recognition language: ${status.langName}`
		});

		containerEl.createDiv({ cls: 'biblens-section-spacer' });

		new Setting(containerEl)
			.setName('Parsing rules')
			.setDesc('Strict: enforce format separators. Extended: accept all common separator variants.')
			.addDropdown(drop => {
				drop.addOption('strict', 'Strict');
				drop.addOption('extended', 'Extended');
				drop.setValue(this.plugin.settings.parsingRules);
				drop.onChange(async (value) => {
					this.plugin.settings.parsingRules = value as 'strict' | 'extended';
					await this.plugin.saveSettings();
					await this.plugin.reloadScanner();
					new Notice('Parsing rules updated.');
				});
			});
	}

	private renderInstalledTranslations(
		containerEl: HTMLElement,
		catalog: CatalogData,
		translations: TranslationMeta[]
	): void {
		const detailsEl = containerEl.createEl('details');
		if (this.translationsExpanded) detailsEl.open = true;
		detailsEl.addEventListener('toggle', () => {
			this.translationsExpanded = detailsEl.open;
		});

		const summaryEl = detailsEl.createEl('summary', { text: 'Translations' });
		summaryEl.addClass('biblens-settings-summary');
		detailsEl.createEl('p', {
			text: 'Items shown are from the catalog. Click "load" to fetch the current list from the provider and then click "download".',
			cls: 'setting-item-description',
		});

		const listEl = detailsEl.createDiv();
		const installRowEl = detailsEl.createDiv();

		if (translations.length === 0) {
			listEl.createEl('p', {
				text: 'No translation files found.',
				cls: 'setting-item-description',
			});
			this.appendTranslInstallRow(installRowEl, catalog.translationProviders, new Set());
			return;
		}

		const renderList = () => {
			listEl.empty();
			const n = translations.length;
			const settings = this.plugin.settings;

			const sorted = [...translations].sort((a, b) => {
				const pa = settings.translationOrder[a.id] ?? null;
				const pb = settings.translationOrder[b.id] ?? null;
				if (pa !== null && pb !== null) return pa - pb;
				if (pa !== null) return -1;
				if (pb !== null) return 1;
				return 0;
			});

			let dragSrcId: string | null = null;

			for (const t of sorted) {
				const currentPriority = settings.translationOrder[t.id] ?? null;
				const rowEl = listEl.createDiv({ cls: 'biblens-transl-row' });
				rowEl.draggable = true;

				const nameEl = rowEl.createDiv({ cls: 'biblens-transl-row-name' });
				nameEl.textContent = t.displayName;

				const controlsEl = rowEl.createDiv({ cls: 'biblens-transl-row-controls' });

				// Abbreviation input
				const abbrInput = controlsEl.createEl('input', { type: 'text', cls: 'biblens-transl-abbr' });
				abbrInput.value = settings.translationAbbreviations[t.id] ?? t.id;
				if (abbrInput.value.length > 3) abbrInput.addClass('biblens-abbr-over-limit');
				abbrInput.addEventListener('input', () => {
					const val = abbrInput.value;
					if (val.length > 3) {
						abbrInput.addClass('biblens-abbr-over-limit');
					} else {
						abbrInput.removeClass('biblens-abbr-over-limit');
					}
					settings.translationAbbreviations[t.id] = val;
					void this.plugin.saveSettings();
					this.plugin.refreshActiveTranslations();
				});

				// Priority dropdown
				const prioritySelect = controlsEl.createEl('select', { cls: 'dropdown biblens-transl-priority' });
				prioritySelect.createEl('option', { value: '', text: '-' });
				for (let i = 1; i <= n; i++) {
					prioritySelect.createEl('option', { value: String(i), text: String(i) });
				}
				prioritySelect.value = currentPriority !== null ? String(currentPriority) : '';
				prioritySelect.addEventListener('change', () => {
					const val = prioritySelect.value;
					const newPriority = val === '' ? null : parseInt(val, 10);
					reassignPriority(settings.translationOrder, t.id, newPriority);
					void this.plugin.saveSettings().then(() => this.plugin.reloadAllTranslations());
					renderList();
				});

				// Delete button
				const deleteBtn = controlsEl.createEl('button', { text: 'Delete', cls: 'mod-warning' });
				deleteBtn.addEventListener('click', () => {
					deleteBtn.disabled = true;
					void (async () => {
						try {
							await deleteTranslation(this.app.vault.adapter, this.plugin.manifest.dir!, t.id);
							new Notice(`BibLens: ${t.displayName} deleted`);
						} catch (e) {
							new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					})();
				});

				// Drag-and-drop
				rowEl.addEventListener('dragstart', (e: DragEvent) => {
					dragSrcId = t.id;
					e.dataTransfer?.setData('text/plain', t.id);
					rowEl.addClass('biblens-transl-dragging');
				});
				rowEl.addEventListener('dragend', () => {
					rowEl.removeClass('biblens-transl-dragging');
				});
				rowEl.addEventListener('dragover', (e: DragEvent) => {
					e.preventDefault();
					rowEl.addClass('biblens-transl-dragover');
				});
				rowEl.addEventListener('dragleave', () => {
					rowEl.removeClass('biblens-transl-dragover');
				});
				rowEl.addEventListener('drop', (e: DragEvent) => {
					e.preventDefault();
					rowEl.removeClass('biblens-transl-dragover');
					if (!dragSrcId || dragSrcId === t.id) return;
					const tgtPriority = settings.translationOrder[t.id] ?? null;
					const srcPriority = settings.translationOrder[dragSrcId] ?? null;
					let newPriority: number | null;
					if (tgtPriority !== null) {
						newPriority = tgtPriority;
					} else if (srcPriority !== null) {
						newPriority = null;
					} else {
						return;
					}
					reassignPriority(settings.translationOrder, dragSrcId, newPriority);
					void this.plugin.saveSettings().then(() => this.plugin.reloadAllTranslations());
					renderList();
				});
			}
		};

		renderList();

		const installedIds = new Set(translations.map(t => t.id));
		this.appendTranslInstallRow(installRowEl, catalog.translationProviders, installedIds);
	}

	private appendTranslInstallRow(
		container: HTMLElement,
		providers: SourceProvider[],
		installedIds: Set<string>
	): void {
		if (providers.length === 0) {
			new Setting(container).setName('Install new').setDesc('No translation providers available.');
			return;
		}

		const first = providers[0]!;
		const providerOptions: Record<string, string> = {};
		for (const p of providers) providerOptions[p.id] = p.displayName;

		const selectedProviderId =
			this.selectedTranslProvId && providerOptions[this.selectedTranslProvId]
				? this.selectedTranslProvId
				: first.id;
		this.selectedTranslProvId = selectedProviderId;

		let currentProvider: SourceProvider = providers.find(p => p.id === selectedProviderId) ?? first;
		let selectedTranslId: string | null = null;
		let liveTranslEntries: RemoteTranslationEntry[] | null = null;
		let translDropRef!: DropdownComponent;
		let loadBtnRef!: ButtonComponent;
		let downloadBtnRef!: ButtonComponent;

		const populateDrop = (drop: DropdownComponent, provider: SourceProvider, liveEntries?: RemoteTranslationEntry[]): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const source = liveEntries ?? provider.translations;
			const entries = source.filter(e => !installedIds.has(e.id));
			if (entries.length > 0) {
				for (const e of entries) drop.addOption(e.id, e.language ? `${e.displayName} (${e.language})` : e.displayName);
				drop.setValue(entries[0]!.id);
				return entries[0]!.id;
			}
			drop.addOption('', 'All items installed');
			drop.setValue('');
			return null;
		};

		const translInstallSetting = new Setting(container)
			.setName('Install new')
			.addDropdown(provDrop => {
				provDrop.selectEl.addClass('biblens-install-fixed');
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedTranslProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					liveTranslEntries = null;
					selectedTranslId = populateDrop(translDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedTranslId);
					const a = getAdapter(currentProvider.adapterType);
					loadBtnRef.buttonEl.toggle('listUrl' in a);
				});
			})
			.addButton(loadBtn => {
				loadBtnRef = loadBtn;
				loadBtn.setButtonText('Load');
				loadBtn.setTooltip('Fetch the current list of available items from the selected provider.');
				loadBtn.buttonEl.addClass('biblens-install-fixed');
				const adapter = getAdapter(currentProvider.adapterType);
				loadBtn.buttonEl.toggle('listUrl' in adapter);
				loadBtn.onClick(async () => {
					const a = getAdapter(currentProvider.adapterType);
					if (!('listUrl' in a) || !a.listUrl || !a.listAvailable) return;
					loadBtn.setDisabled(true);
					loadBtn.setButtonText('Loading…');
					try {
						const resp = await requestUrl(a.listUrl(currentProvider));
						const raw = a.listAvailable(resp.text);
						const entries = raw.map(e => {
							const cat = currentProvider.translations.find(c => c.remoteId === e.remoteId);
							return cat ? { ...cat } : e;
						});
						liveTranslEntries = entries;
						selectedTranslId = populateDrop(translDropRef, currentProvider, entries);
						downloadBtnRef.setDisabled(!selectedTranslId);
					} catch (e) {
						new Notice(`BibLens: load failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					loadBtn.setDisabled(false);
					loadBtn.setButtonText('Load');
				});
			})
			.addDropdown(translDrop => {
				translDropRef = translDrop;
				translDrop.selectEl.addClass('biblens-install-items');
				selectedTranslId = populateDrop(translDrop, currentProvider);
				translDrop.onChange(id => {
					selectedTranslId = id || null;
					downloadBtnRef.setDisabled(!selectedTranslId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.buttonEl.addClass('biblens-install-fixed');
				btn.setCta();
				btn.setDisabled(!selectedTranslId);
				btn.onClick(async () => {
					if (!selectedTranslId) return;
					const entry = (liveTranslEntries ?? currentProvider.translations).find(e => e.id === selectedTranslId);
					if (!entry) return;
					btn.setDisabled(true);
					btn.setButtonText('Downloading…');
					try {
						await downloadFromSource(
							this.app.vault.adapter,
							this.plugin.manifest.dir!,
							currentProvider,
							entry
						);
						new Notice(`BibLens: ${entry.displayName} downloaded`);
					} catch (e) {
						new Notice(`BibLens: download failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					this.display();
				});
			});
		translInstallSetting.controlEl.addClass('biblens-install-row');
	}

	private renderInstalledFormats(
		containerEl: HTMLElement,
		catalog: CatalogData,
		formats: ReferenceFormatMeta[]
	): void {
		const detailsEl = containerEl.createEl('details');
		if (this.formatsExpanded) detailsEl.open = true;
		detailsEl.addEventListener('toggle', () => {
			this.formatsExpanded = detailsEl.open;
		});

		const summaryEl = detailsEl.createEl('summary', { text: 'Reference formats' });
		summaryEl.addClass('biblens-settings-summary');
		detailsEl.createEl('p', {
			text: 'Items shown are from the catalog. Click "load" to fetch the current list from the provider and then click "download".',
			cls: 'setting-item-description',
		});

		const listEl = detailsEl.createDiv();
		const installEl = detailsEl.createDiv();

		if (formats.length === 0) {
			listEl.createEl('p', {
				text: 'No reference format files found.',
				cls: 'setting-item-description',
			});
		} else {
			for (const f of formats) {
				const isActive = f.id === this.plugin.settings.standardReferenceFormat;
				const desc = [
					f.lang ? `Language: ${f.lang}` : '',
					isActive ? 'Active' : '',
				].filter(Boolean).join(' · ');

				const setting = new Setting(listEl)
					.setName(f.displayName)
					.setDesc(desc);

				if (!isActive) {
					setting.addButton(btn => {
						btn.setButtonText('Set as default');
						btn.onClick(async () => {
							btn.setDisabled(true);
							this.plugin.settings.standardReferenceFormat = f.id;
							await this.plugin.saveSettings();
							await this.plugin.reloadScanner();
							new Notice(`BibLens: reference format set to ${f.displayName}`);
							this.display();
						});
					});
				}

				setting.addButton(btn => {
					btn.setButtonText('Delete');
					btn.setWarning();
					btn.onClick(async () => {
						btn.setDisabled(true);
						try {
							await deleteReferenceFormat(this.app.vault.adapter, this.plugin.manifest.dir!, f.id);
							new Notice(`BibLens: ${f.displayName} deleted`);
							if (isActive) {
								this.plugin.settings.standardReferenceFormat = '';
								await this.plugin.saveSettings();
								await this.plugin.reloadScanner();
							}
						} catch (e) {
							new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					});
				});
			}
		}

		this.appendFormatInstallRow(installEl, catalog.referenceFormatProviders, new Set(formats.map(f => f.id)));
	}

	private appendFormatInstallRow(container: HTMLElement, providers: ReferenceFormatProvider[], installedIds: Set<string>): void {
		if (providers.length === 0) {
			new Setting(container).setName('Install new').setDesc('No reference format providers available.');
			return;
		}

		const first = providers[0]!;
		const providerOptions: Record<string, string> = {};
		for (const p of providers) providerOptions[p.id] = p.displayName;

		const selectedProviderId =
			this.selectedFormatProvId && providerOptions[this.selectedFormatProvId]
				? this.selectedFormatProvId
				: first.id;
		this.selectedFormatProvId = selectedProviderId;

		let currentProvider: ReferenceFormatProvider = providers.find(p => p.id === selectedProviderId) ?? first;
		let selectedFormatId: string | null = null;
		let liveFormatEntries: RemoteReferenceFormatEntry[] | null = null;
		let formatDropRef!: DropdownComponent;
		let loadBtnRef!: ButtonComponent;
		let downloadBtnRef!: ButtonComponent;

		const populateDrop = (drop: DropdownComponent, provider: ReferenceFormatProvider, liveEntries?: RemoteReferenceFormatEntry[]): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const source = liveEntries ?? provider.formats;
			const entries = source.filter(e => !installedIds.has(e.id));
			if (entries.length > 0) {
				for (const e of entries) drop.addOption(e.id, e.language ? `${e.displayName} (${e.language})` : e.displayName);
				drop.setValue(entries[0]!.id);
				return entries[0]!.id;
			}
			drop.addOption('', 'All items installed');
			drop.setValue('');
			return null;
		};

		const formatInstallSetting = new Setting(container)
			.setName('Install new')
			.addDropdown(provDrop => {
				provDrop.selectEl.addClass('biblens-install-fixed');
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedFormatProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					liveFormatEntries = null;
					selectedFormatId = populateDrop(formatDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedFormatId);
					const a = getReferenceFormatAdapter(currentProvider.adapterType);
					loadBtnRef.buttonEl.toggle('listUrl' in a);
				});
			})
			.addButton(loadBtn => {
				loadBtnRef = loadBtn;
				loadBtn.setButtonText('Load');
				loadBtn.setTooltip('Fetch the current list of available items from the selected provider.');
				loadBtn.buttonEl.addClass('biblens-install-fixed');
				const adapter = getReferenceFormatAdapter(currentProvider.adapterType);
				loadBtn.buttonEl.toggle('listUrl' in adapter);
				loadBtn.onClick(async () => {
					const a = getReferenceFormatAdapter(currentProvider.adapterType);
					if (!('listUrl' in a) || !a.listUrl || !a.listAvailable) return;
					loadBtn.setDisabled(true);
					loadBtn.setButtonText('Loading…');
					try {
						const resp = await requestUrl(a.listUrl(currentProvider));
						const entries = a.listAvailable(resp.text);
						liveFormatEntries = entries;
						selectedFormatId = populateDrop(formatDropRef, currentProvider, entries);
						downloadBtnRef.setDisabled(!selectedFormatId);
					} catch (e) {
						new Notice(`BibLens: load failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					loadBtn.setDisabled(false);
					loadBtn.setButtonText('Load');
				});
			})
			.addDropdown(drop => {
				formatDropRef = drop;
				drop.selectEl.addClass('biblens-install-items');
				selectedFormatId = populateDrop(drop, currentProvider);
				drop.onChange(id => {
					selectedFormatId = id || null;
					downloadBtnRef.setDisabled(!selectedFormatId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.buttonEl.addClass('biblens-install-fixed');
				btn.setCta();
				btn.setDisabled(!selectedFormatId);
				btn.onClick(async () => {
					if (!selectedFormatId) return;
					const entry = (liveFormatEntries ?? currentProvider.formats).find(e => e.id === selectedFormatId);
					if (!entry) return;
					btn.setDisabled(true);
					btn.setButtonText('Downloading…');
					try {
						await downloadReferenceFormat(
							this.app.vault.adapter,
							this.plugin.manifest.dir!,
							currentProvider,
							entry
						);
						new Notice(`BibLens: ${entry.displayName} downloaded`);
					} catch (e) {
						new Notice(`BibLens: download failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					this.display();
				});
			});
		formatInstallSetting.controlEl.addClass('biblens-install-row');
	}

	private renderInstalledLanguages(
		containerEl: HTMLElement,
		catalog: CatalogData,
		packs: LanguagePackMeta[]
	): void {
		const detailsEl = containerEl.createEl('details');
		if (this.languagesExpanded) detailsEl.open = true;
		detailsEl.addEventListener('toggle', () => {
			this.languagesExpanded = detailsEl.open;
		});

		const summaryEl = detailsEl.createEl('summary', { text: 'Recognition languages' });
		summaryEl.addClass('biblens-settings-summary');
		detailsEl.createEl('p', {
			text: 'Items shown are from the catalog. Click "load" to fetch the current list from the provider and then click "download".',
			cls: 'setting-item-description',
		});

		const listEl = detailsEl.createDiv();
		const installEl = detailsEl.createDiv();

		if (packs.length === 0) {
			listEl.createEl('p', {
				text: 'No language pack files found.',
				cls: 'setting-item-description',
			});
		} else {
			for (const p of packs) {
				const isActive = p.id === this.plugin.settings.preferredLanguage;
				const desc = [
					p.lang ? `Language: ${p.lang}` : '',
					isActive ? 'Active' : '',
				].filter(Boolean).join(' · ');

				const setting = new Setting(listEl)
					.setName(p.displayName)
					.setDesc(desc);

				if (!isActive) {
					setting.addButton(btn => {
						btn.setButtonText('Set as default');
						btn.onClick(async () => {
							btn.setDisabled(true);
							this.plugin.settings.preferredLanguage = p.id;
							await this.plugin.saveSettings();
							await this.plugin.reloadScanner();
							new Notice(`BibLens: language pack set to ${p.displayName}`);
							this.display();
						});
					});
				}

				setting.addButton(btn => {
					btn.setButtonText('Delete');
					btn.setWarning();
					btn.onClick(async () => {
						btn.setDisabled(true);
						try {
							await deleteLanguagePack(this.app.vault.adapter, this.plugin.manifest.dir!, p.id);
							new Notice(`BibLens: ${p.displayName} deleted`);
							if (isActive) {
								this.plugin.settings.preferredLanguage = '';
								await this.plugin.saveSettings();
								await this.plugin.reloadScanner();
							}
						} catch (e) {
							new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					});
				});
			}
		}

		this.appendLangInstallRow(installEl, catalog.languagePackProviders, new Set(packs.map(p => p.id)));
	}

	private appendLangInstallRow(container: HTMLElement, providers: LanguagePackProvider[], installedIds: Set<string>): void {
		if (providers.length === 0) {
			new Setting(container).setName('Install new').setDesc('No language pack providers available.');
			return;
		}

		const first = providers[0]!;
		const providerOptions: Record<string, string> = {};
		for (const p of providers) providerOptions[p.id] = p.displayName;

		const selectedProviderId =
			this.selectedLangProvId && providerOptions[this.selectedLangProvId]
				? this.selectedLangProvId
				: first.id;
		this.selectedLangProvId = selectedProviderId;

		let currentProvider: LanguagePackProvider = providers.find(p => p.id === selectedProviderId) ?? first;
		let selectedPackId: string | null = null;
		let livePackEntries: RemoteLanguagePackEntry[] | null = null;
		let packDropRef!: DropdownComponent;
		let loadBtnRef!: ButtonComponent;
		let downloadBtnRef!: ButtonComponent;

		const populateDrop = (drop: DropdownComponent, provider: LanguagePackProvider, liveEntries?: RemoteLanguagePackEntry[]): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const source = liveEntries ?? provider.packs;
			const entries = source.filter(e => !installedIds.has(e.id));
			if (entries.length > 0) {
				for (const e of entries) drop.addOption(e.id, e.language ? `${e.displayName} (${e.language})` : e.displayName);
				drop.setValue(entries[0]!.id);
				return entries[0]!.id;
			}
			drop.addOption('', 'All items installed');
			drop.setValue('');
			return null;
		};

		const langInstallSetting = new Setting(container)
			.setName('Install new')
			.addDropdown(provDrop => {
				provDrop.selectEl.addClass('biblens-install-fixed');
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedLangProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					livePackEntries = null;
					selectedPackId = populateDrop(packDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedPackId);
					const a = getLanguagePackAdapter(currentProvider.adapterType);
					loadBtnRef.buttonEl.toggle('listUrl' in a);
				});
			})
			.addButton(loadBtn => {
				loadBtnRef = loadBtn;
				loadBtn.setButtonText('Load');
				loadBtn.setTooltip('Fetch the current list of available items from the selected provider.');
				loadBtn.buttonEl.addClass('biblens-install-fixed');
				const adapter = getLanguagePackAdapter(currentProvider.adapterType);
				loadBtn.buttonEl.toggle('listUrl' in adapter);
				loadBtn.onClick(async () => {
					const a = getLanguagePackAdapter(currentProvider.adapterType);
					if (!('listUrl' in a) || !a.listUrl || !a.listAvailable) return;
					loadBtn.setDisabled(true);
					loadBtn.setButtonText('Loading…');
					try {
						const resp = await requestUrl(a.listUrl(currentProvider));
						const entries = a.listAvailable(resp.text);
						livePackEntries = entries;
						selectedPackId = populateDrop(packDropRef, currentProvider, entries);
						downloadBtnRef.setDisabled(!selectedPackId);
					} catch (e) {
						new Notice(`BibLens: load failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					loadBtn.setDisabled(false);
					loadBtn.setButtonText('Load');
				});
			})
			.addDropdown(drop => {
				packDropRef = drop;
				drop.selectEl.addClass('biblens-install-items');
				selectedPackId = populateDrop(drop, currentProvider);
				drop.onChange(id => {
					selectedPackId = id || null;
					downloadBtnRef.setDisabled(!selectedPackId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.buttonEl.addClass('biblens-install-fixed');
				btn.setCta();
				btn.setDisabled(!selectedPackId);
				btn.onClick(async () => {
					if (!selectedPackId) return;
					const entry = (livePackEntries ?? currentProvider.packs).find(e => e.id === selectedPackId);
					if (!entry) return;
					btn.setDisabled(true);
					btn.setButtonText('Downloading…');
					try {
						await downloadLanguagePack(
							this.app.vault.adapter,
							this.plugin.manifest.dir!,
							currentProvider,
							entry
						);
						new Notice(`BibLens: ${entry.displayName} downloaded`);
					} catch (e) {
						new Notice(`BibLens: download failed — ${e instanceof Error ? e.message : String(e)}`);
					}
					this.display();
				});
			});
		langInstallSetting.controlEl.addClass('biblens-install-row');
	}

}
