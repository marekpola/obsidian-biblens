import { App, ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import type BibLensPlugin from './main';
import { listAvailableTranslations } from './translationRegistry';
import { loadCatalog, fetchCatalogUpdate } from './sources/catalogManager';
import { downloadFromSource, deleteTranslation } from './translationManager';
import type { SourceProvider } from './sources/catalog';

export class BibLensSettingTab extends PluginSettingTab {
	private plugin: BibLensPlugin;
	private selectedProviderId: string | null = null;

	constructor(app: App, plugin: BibLensPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.renderGeneral(containerEl);
		this.renderInstalledTranslations(containerEl);
		this.renderGetTranslations(containerEl);
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

		const generalContainer = containerEl.createDiv();
		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				if (translations.length === 0) {
					new Setting(generalContainer)
						.setName('Preferred translation')
						.setDesc('No translation files found in the translations/ folder.');
					return;
				}

				const options: Record<string, string> = {};
				for (const t of translations) options[t.id] = t.displayName;

				new Setting(generalContainer)
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

	private renderGetTranslations(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Get translations').setHeading();
		const getContainer = containerEl.createDiv();

		loadCatalog(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(async (providers) => {
				if (providers.length === 0) {
					new Setting(getContainer)
						.setName('No providers available')
						.setDesc('Update the catalog to fetch available translation sources.');
					return;
				}

				const installed = await listAvailableTranslations(
					this.app.vault.adapter,
					this.plugin.manifest.dir!
				);
				const installedIds = new Set(installed.map(t => t.id));

				const first = providers[0]!;
				const providerOptions: Record<string, string> = {};
				for (const p of providers) providerOptions[p.id] = p.displayName;

				const selectedProviderId =
					this.selectedProviderId && providerOptions[this.selectedProviderId]
						? this.selectedProviderId
						: first.id;
				this.selectedProviderId = selectedProviderId;

				let currentProvider: SourceProvider = providers.find(p => p.id === selectedProviderId) ?? first;
				let selectedTranslationId: string | null = null;
				let translDropRef!: DropdownComponent;
				let downloadBtnRef!: ButtonComponent;

				const getAvailableOptions = (provider: SourceProvider): Record<string, string> => {
					const opts: Record<string, string> = {};
					for (const e of provider.translations) {
						if (!installedIds.has(e.id)) opts[e.id] = `${e.displayName} (${e.language})`;
					}
					return opts;
				};

				const populateTranslDrop = (drop: DropdownComponent, provider: SourceProvider): string | null => {
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

				new Setting(getContainer)
					.addDropdown(provDrop => {
						provDrop.addOptions(providerOptions);
						provDrop.setValue(selectedProviderId);
						provDrop.onChange(id => {
							this.selectedProviderId = id;
							currentProvider = providers.find(p => p.id === id) ?? first;
							selectedTranslationId = populateTranslDrop(translDropRef, currentProvider);
							downloadBtnRef.setDisabled(!selectedTranslationId);
						});
					})
					.addDropdown(translDrop => {
						translDropRef = translDrop;
						selectedTranslationId = populateTranslDrop(translDrop, currentProvider);
						translDrop.onChange(id => {
							selectedTranslationId = id || null;
							downloadBtnRef.setDisabled(!selectedTranslationId);
						});
					})
					.addButton(btn => {
						downloadBtnRef = btn;
						btn.setButtonText('Download');
						btn.setCta();
						btn.setDisabled(!selectedTranslationId);
						btn.onClick(async () => {
							if (!selectedTranslationId) return;
							const entry = currentProvider.translations.find(e => e.id === selectedTranslationId);
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
			})
			.catch((e: unknown) => console.error('BibLens: failed to load catalog', e));
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
