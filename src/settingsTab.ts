import { App, ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import type BibLensPlugin from './main';
import { listAvailableTranslations } from './translationRegistry';
import { listAvailableLanguagePacks } from './languagePackRegistry';
import { listAvailableReferenceFormats } from './referenceFormatRegistry';
import { loadCatalog, fetchCatalogUpdate } from './sources/catalogManager';
import { downloadFromSource, deleteTranslation } from './translationManager';
import { downloadLanguagePack, deleteLanguagePack, downloadReferenceFormat, deleteReferenceFormat } from './packManager';
import type { SourceProvider, LanguagePackProvider, ReferenceFormatProvider } from './sources/catalog';

export class BibLensSettingTab extends PluginSettingTab {
	private plugin: BibLensPlugin;
	private selectedTranslProvId: string | null = null;
	private selectedFormatProvId: string | null = null;
	private selectedLangProvId: string | null = null;

	constructor(app: App, plugin: BibLensPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.renderGeneral(containerEl);
		this.renderInstalledTranslations(containerEl);
		this.renderInstalledFormats(containerEl);
		this.renderInstalledLanguages(containerEl);
		this.renderInstallSources(containerEl);
		this.renderAdvanced(containerEl);
	}

	private renderGeneral(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Verse insertion format')
			.setDesc('Format used when inserting a verse into the editor.')
			.addDropdown(drop => {
				drop.addOption('inline', 'Inline');
				drop.addOption('blockquote', 'Blockquote');
				drop.setValue(this.plugin.settings.verseInsertionFormat);
				drop.onChange(async (value) => {
					this.plugin.settings.verseInsertionFormat = value as 'inline' | 'blockquote';
					await this.plugin.saveSettings();
				});
			});

		// Preferred translation
		const translContainer = containerEl.createDiv();
		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				if (translations.length === 0) {
					new Setting(translContainer)
						.setName('Preferred translation')
						.setDesc('No translation files found in the translations/ folder.');
					return;
				}

				const options: Record<string, string> = {};
				for (const t of translations) options[t.id] = t.displayName;

				new Setting(translContainer)
					.setName('Preferred translation')
					.setDesc('Translation used for hover previews and verse insertion.')
					.addDropdown(drop => {
						drop.addOptions(options);
						drop.setValue(this.plugin.settings.preferredTranslation);
						drop.onChange(async (value) => {
							this.plugin.settings.preferredTranslation = value;
							await this.plugin.saveSettings();
							await this.plugin.reloadTranslation();
							new Notice(`BibLens: switched to ${options[value] ?? value}`);
						});
					});
			})
			.catch((e: unknown) => console.error('BibLens: failed to list translations', e));

		// Preferred language
		const langContainer = containerEl.createDiv();
		listAvailableLanguagePacks(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(packs => {
				const options: Record<string, string> = { '': 'Built-in (English)' };
				for (const p of packs) options[p.id] = p.displayName;

				new Setting(langContainer)
					.setName('Preferred language for reference recognition')
					.setDesc('Language pack used to recognise Bible book names.')
					.addDropdown(drop => {
						drop.addOptions(options);
						drop.setValue(this.plugin.settings.preferredLanguage);
						drop.onChange(async (value) => {
							this.plugin.settings.preferredLanguage = value;
							await this.plugin.saveSettings();
							await this.plugin.reloadScanner();
							new Notice('BibLens: language updated');
						});
					});
			})
			.catch((e: unknown) => console.error('BibLens: failed to list language packs', e));

		// Standard reference format
		const fmtContainer = containerEl.createDiv();
		listAvailableReferenceFormats(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(formats => {
				const options: Record<string, string> = { '': 'Built-in (English)' };
				for (const f of formats) options[f.id] = f.displayName;

				new Setting(fmtContainer)
					.setName('Standard reference format')
					.setDesc('Format pack used for abbreviations and separators in references.')
					.addDropdown(drop => {
						drop.addOptions(options);
						drop.setValue(this.plugin.settings.standardReferenceFormat);
						drop.onChange(async (value) => {
							this.plugin.settings.standardReferenceFormat = value;
							await this.plugin.saveSettings();
							await this.plugin.reloadScanner();
							new Notice('BibLens: reference format updated');
						});
					});
			})
			.catch((e: unknown) => console.error('BibLens: failed to list reference formats', e));

		// Parsing rules
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
					new Notice('BibLens: parsing rules updated');
				});
			});
	}

	private renderInstalledTranslations(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Installed translations').setHeading();
		const installedContainer = containerEl.createDiv();

		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				if (translations.length === 0) {
					installedContainer.createEl('p', {
						text: 'No translation files found.',
						cls: 'setting-item-description',
					});
					return;
				}

				for (const t of translations) {
					const isActive = t.id === this.plugin.settings.preferredTranslation;
					const desc = [
						t.lang ? `Language: ${t.lang}` : '',
						t.source ? `Source: ${t.source}` : '',
						isActive ? 'Active' : '',
					].filter(Boolean).join(' · ');

					const setting = new Setting(installedContainer)
						.setName(t.displayName)
						.setDesc(desc);

					if (!isActive) {
						setting.addButton(btn => {
							btn.setButtonText('Set as default');
							btn.onClick(async () => {
								btn.setDisabled(true);
								this.plugin.settings.preferredTranslation = t.id;
								await this.plugin.saveSettings();
								await this.plugin.reloadTranslation();
								new Notice(`BibLens: switched to ${t.displayName}`);
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
								await deleteTranslation(this.app.vault.adapter, this.plugin.manifest.dir!, t.id);
								new Notice(`BibLens: ${t.displayName} deleted`);
								if (isActive) {
									const remaining = translations.filter(x => x.id !== t.id);
									if (remaining.length > 0) {
										this.plugin.settings.preferredTranslation = remaining[0]!.id;
									} else {
										this.plugin.settings.preferredTranslation = '';
									}
									await this.plugin.saveSettings();
									await this.plugin.reloadTranslation();
								}
							} catch (e) {
								new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
							}
							this.display();
						});
					});
				}
			})
			.catch((e: unknown) => console.error('BibLens: failed to list translations', e));
	}

	private renderInstalledFormats(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Installed reference formats').setHeading();
		const container = containerEl.createDiv();

		listAvailableReferenceFormats(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(formats => {
				if (formats.length === 0) {
					container.createEl('p', {
						text: 'No reference format files found.',
						cls: 'setting-item-description',
					});
					return;
				}

				for (const f of formats) {
					const isActive = f.id === this.plugin.settings.standardReferenceFormat;
					const desc = [
						f.lang ? `Language: ${f.lang}` : '',
						isActive ? 'Active' : '',
					].filter(Boolean).join(' · ');

					new Setting(container)
						.setName(f.displayName)
						.setDesc(desc)
						.addButton(btn => {
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
			})
			.catch((e: unknown) => console.error('BibLens: failed to list reference formats', e));
	}

	private renderInstalledLanguages(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Installed recognition languages').setHeading();
		const container = containerEl.createDiv();

		listAvailableLanguagePacks(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(packs => {
				if (packs.length === 0) {
					container.createEl('p', {
						text: 'No language pack files found.',
						cls: 'setting-item-description',
					});
					return;
				}

				for (const p of packs) {
					const isActive = p.id === this.plugin.settings.preferredLanguage;
					const desc = [
						p.lang ? `Language: ${p.lang}` : '',
						isActive ? 'Active' : '',
					].filter(Boolean).join(' · ');

					new Setting(container)
						.setName(p.displayName)
						.setDesc(desc)
						.addButton(btn => {
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
			})
			.catch((e: unknown) => console.error('BibLens: failed to list language packs', e));
	}

	private renderInstallSources(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Install sources').setHeading();
		const container = containerEl.createDiv();

		loadCatalog(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(async (catalog) => {
				const installed = await listAvailableTranslations(
					this.app.vault.adapter,
					this.plugin.manifest.dir!
				);
				const installedTranslIds = new Set(installed.map(t => t.id));

				this.renderTranslationsSubsection(container, catalog.translationProviders, installedTranslIds);
				this.renderReferenceFormatsSubsection(container, catalog.referenceFormatProviders);
				this.renderLanguagePacksSubsection(container, catalog.languagePackProviders);
			})
			.catch((e: unknown) => console.error('BibLens: failed to load catalog', e));
	}

	private renderTranslationsSubsection(
		container: HTMLElement,
		providers: SourceProvider[],
		installedIds: Set<string>
	): void {
		new Setting(container).setName('Translations').setHeading();
		const inner = container.createDiv();

		if (providers.length === 0) {
			inner.createEl('p', { text: 'No translation providers available.', cls: 'setting-item-description' });
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
		let translDropRef!: DropdownComponent;
		let downloadBtnRef!: ButtonComponent;

		const getAvailableOptions = (provider: SourceProvider): Record<string, string> => {
			const opts: Record<string, string> = {};
			for (const e of provider.translations) {
				if (!installedIds.has(e.id)) opts[e.id] = `${e.displayName} (${e.language})`;
			}
			return opts;
		};

		const populateDrop = (drop: DropdownComponent, provider: SourceProvider): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const opts = getAvailableOptions(provider);
			const entries = Object.entries(opts);
			if (entries.length > 0) {
				for (const [val, label] of entries) drop.addOption(val, label);
				const firstId = entries[0]![0];
				drop.setValue(firstId);
				return firstId;
			}
			drop.addOption('', 'All translations installed');
			drop.setValue('');
			return null;
		};

		new Setting(inner)
			.addDropdown(provDrop => {
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedTranslProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					selectedTranslId = populateDrop(translDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedTranslId);
				});
			})
			.addDropdown(translDrop => {
				translDropRef = translDrop;
				selectedTranslId = populateDrop(translDrop, currentProvider);
				translDrop.onChange(id => {
					selectedTranslId = id || null;
					downloadBtnRef.setDisabled(!selectedTranslId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.setCta();
				btn.setDisabled(!selectedTranslId);
				btn.onClick(async () => {
					if (!selectedTranslId) return;
					const entry = currentProvider.translations.find(e => e.id === selectedTranslId);
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
	}

	private renderReferenceFormatsSubsection(
		container: HTMLElement,
		providers: ReferenceFormatProvider[]
	): void {
		new Setting(container).setName('Reference formats').setHeading();
		const inner = container.createDiv();

		if (providers.length === 0) {
			inner.createEl('p', { text: 'No reference format providers available.', cls: 'setting-item-description' });
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
		let formatDropRef!: DropdownComponent;
		let downloadBtnRef!: ButtonComponent;

		const populateDrop = (drop: DropdownComponent, provider: ReferenceFormatProvider): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const entries = provider.formats;
			if (entries.length > 0) {
				for (const e of entries) drop.addOption(e.id, `${e.displayName} (${e.language})`);
				drop.setValue(entries[0]!.id);
				return entries[0]!.id;
			}
			drop.addOption('', 'No formats available');
			drop.setValue('');
			return null;
		};

		new Setting(inner)
			.addDropdown(provDrop => {
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedFormatProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					selectedFormatId = populateDrop(formatDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedFormatId);
				});
			})
			.addDropdown(drop => {
				formatDropRef = drop;
				selectedFormatId = populateDrop(drop, currentProvider);
				drop.onChange(id => {
					selectedFormatId = id || null;
					downloadBtnRef.setDisabled(!selectedFormatId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.setCta();
				btn.setDisabled(!selectedFormatId);
				btn.onClick(async () => {
					if (!selectedFormatId) return;
					const entry = currentProvider.formats.find(e => e.id === selectedFormatId);
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
	}

	private renderLanguagePacksSubsection(
		container: HTMLElement,
		providers: LanguagePackProvider[]
	): void {
		new Setting(container).setName('Recognition languages').setHeading();
		const inner = container.createDiv();

		if (providers.length === 0) {
			inner.createEl('p', { text: 'No language pack providers available.', cls: 'setting-item-description' });
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
		let packDropRef!: DropdownComponent;
		let downloadBtnRef!: ButtonComponent;

		const populateDrop = (drop: DropdownComponent, provider: LanguagePackProvider): string | null => {
			const sel = drop.selectEl;
			while (sel.options.length > 0) sel.remove(0);
			const entries = provider.packs;
			if (entries.length > 0) {
				for (const e of entries) drop.addOption(e.id, `${e.displayName} (${e.language})`);
				drop.setValue(entries[0]!.id);
				return entries[0]!.id;
			}
			drop.addOption('', 'No language packs available');
			drop.setValue('');
			return null;
		};

		new Setting(inner)
			.addDropdown(provDrop => {
				provDrop.addOptions(providerOptions);
				provDrop.setValue(selectedProviderId);
				provDrop.onChange(id => {
					this.selectedLangProvId = id;
					currentProvider = providers.find(p => p.id === id) ?? first;
					selectedPackId = populateDrop(packDropRef, currentProvider);
					downloadBtnRef.setDisabled(!selectedPackId);
				});
			})
			.addDropdown(drop => {
				packDropRef = drop;
				selectedPackId = populateDrop(drop, currentProvider);
				drop.onChange(id => {
					selectedPackId = id || null;
					downloadBtnRef.setDisabled(!selectedPackId);
				});
			})
			.addButton(btn => {
				downloadBtnRef = btn;
				btn.setButtonText('Download');
				btn.setCta();
				btn.setDisabled(!selectedPackId);
				btn.onClick(async () => {
					if (!selectedPackId) return;
					const entry = currentProvider.packs.find(e => e.id === selectedPackId);
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
	}

	private renderAdvanced(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Advanced').setHeading();

		const lastUpdated = this.plugin.settings.catalogLastUpdated;
		const lastUpdatedText = lastUpdated
			? `Last update: ${new Date(lastUpdated).toLocaleDateString()}`
			: 'Never updated';

		new Setting(containerEl)
			.setName('Catalog')
			.setDesc(lastUpdatedText)
			.addButton(btn => {
				btn.setButtonText('Update catalog');
				btn.onClick(async () => {
					btn.setButtonText('Updating…');
					btn.setDisabled(true);
					const result = await fetchCatalogUpdate(
						this.app.vault.adapter,
						this.plugin.manifest.dir!
					);
					if (result.ok) {
						this.plugin.settings.catalogLastUpdated = result.updatedAt;
						await this.plugin.saveSettings();
						new Notice(`BibLens: catalog updated (${result.providerCount} providers)`);
					} else {
						new Notice(`BibLens: catalog update failed — ${result.error}`);
					}
					this.display();
				});
			});

		new Setting(containerEl)
			.setName('Auto-update catalog on startup')
			.setDesc('Silently refresh the catalog when it is older than 7 days. Requires network access on plugin load.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.autoUpdateCatalog);
				toggle.onChange(async (value) => {
					this.plugin.settings.autoUpdateCatalog = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
