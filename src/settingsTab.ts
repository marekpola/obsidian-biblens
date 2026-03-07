import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
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
		this.renderPreferences(containerEl);
		this.renderCatalogUpdate(containerEl);
		this.renderTranslationSources(containerEl);
		this.renderInstalledTranslations(containerEl);
	}

	private renderPreferences(containerEl: HTMLElement): void {
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

		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				const options: Record<string, string> = {};
				for (const t of translations) options[t.id] = t.displayName;

				if (Object.keys(options).length === 0) {
					new Setting(containerEl)
						.setName('Preferred translation')
						.setDesc('No translation files found in the translations/ folder.')
						.addText(text => text
							.setValue(this.plugin.settings.preferredTranslation)
							.setDisabled(true)
						);
					return;
				}

				new Setting(containerEl)
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

	private renderCatalogUpdate(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Translation catalog').setHeading();

		const lastUpdated = this.plugin.settings.catalogLastUpdated;
		const lastUpdatedText = lastUpdated
			? `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`
			: 'Never updated';

		new Setting(containerEl)
			.setName('Source catalog')
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

	private renderTranslationSources(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Translation sources').setHeading();
		const sourcesContainer = containerEl.createDiv();

		loadCatalog(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(async (providers) => {
				if (providers.length === 0) {
					new Setting(sourcesContainer)
						.setName('No providers available')
						.setDesc('Update the catalog above to fetch available translation sources.');
					return;
				}

				const first = providers[0]!;
				const providerOptions: Record<string, string> = {};
				for (const p of providers) providerOptions[p.id] = p.displayName;

				const selectedId =
					this.selectedProviderId && providerOptions[this.selectedProviderId]
						? this.selectedProviderId
						: first.id;
				this.selectedProviderId = selectedId;

				const listEl = sourcesContainer.createDiv();

				new Setting(sourcesContainer)
					.setName('Provider')
					.setDesc('Select a source to see available translations.')
					.addDropdown(drop => {
						drop.addOptions(providerOptions);
						drop.setValue(selectedId);
						drop.onChange(async (id) => {
							this.selectedProviderId = id;
							const provider = providers.find(p => p.id === id);
							if (provider) await this.renderTranslationList(listEl, provider);
						});
					});

				// Move list below the dropdown
				sourcesContainer.appendChild(listEl);

				const initialProvider = providers.find(p => p.id === selectedId) ?? first;
				await this.renderTranslationList(listEl, initialProvider);
			})
			.catch((e: unknown) => console.error('BibLens: failed to load catalog', e));
	}

	private async renderTranslationList(
		container: HTMLElement,
		provider: SourceProvider
	): Promise<void> {
		container.empty();

		const installed = await listAvailableTranslations(
			this.app.vault.adapter,
			this.plugin.manifest.dir!
		);
		const installedIds = new Set(installed.map(t => t.id));

		if (provider.translations.length === 0) {
			container.createEl('p', {
				text: 'No translations available from this provider.',
				cls: 'setting-item-description',
			});
			return;
		}

		for (const entry of provider.translations) {
			const isInstalled = installedIds.has(entry.id);
			const statusText = isInstalled ? 'Downloaded' : 'Not downloaded';
			const setting = new Setting(container)
				.setName(entry.displayName)
				.setDesc(`${entry.language.toUpperCase()} · ${statusText}`);

			if (isInstalled) {
				setting.addButton(btn => {
					btn.setButtonText('Update');
					btn.onClick(async () => {
						btn.setDisabled(true);
						btn.setButtonText('Updating…');
						try {
							await deleteTranslation(this.app.vault.adapter, this.plugin.manifest.dir!, entry.id);
							await downloadFromSource(this.app.vault.adapter, this.plugin.manifest.dir!, provider, entry);
							await this.plugin.reloadTranslation();
							new Notice(`BibLens: ${entry.displayName} updated`);
						} catch (e) {
							new Notice(`BibLens: update failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					});
				});
				setting.addButton(btn => {
					btn.setButtonText('Delete');
					btn.setWarning();
					btn.onClick(async () => {
						btn.setDisabled(true);
						try {
							await deleteTranslation(this.app.vault.adapter, this.plugin.manifest.dir!, entry.id);
							new Notice(`BibLens: ${entry.displayName} deleted`);
						} catch (e) {
							new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					});
				});
			} else {
				setting.addButton(btn => {
					btn.setButtonText('Download');
					btn.setCta();
					btn.onClick(async () => {
						btn.setDisabled(true);
						btn.setButtonText('Downloading…');
						try {
							await downloadFromSource(this.app.vault.adapter, this.plugin.manifest.dir!, provider, entry);
							new Notice(`BibLens: ${entry.displayName} downloaded`);
						} catch (e) {
							new Notice(`BibLens: download failed — ${e instanceof Error ? e.message : String(e)}`);
						}
						this.display();
					});
				});
			}
		}
	}

	private renderInstalledTranslations(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Installed translations').setHeading();

		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				if (translations.length === 0) {
					containerEl.createEl('p', {
						text: 'No translation files found.',
						cls: 'setting-item-description',
					});
					return;
				}

				for (const t of translations) {
					const isActive = t.id === this.plugin.settings.preferredTranslation;
					const desc = [
						t.lang ? `Language: ${t.lang}` : '',
						isActive ? 'Active' : '',
					].filter(Boolean).join(' · ');

					const setting = new Setting(containerEl)
						.setName(t.displayName)
						.setDesc(desc);

					if (!isActive) {
						setting.addButton(btn => {
							btn.setButtonText('Delete');
							btn.setWarning();
							btn.onClick(async () => {
								btn.setDisabled(true);
								try {
									await deleteTranslation(this.app.vault.adapter, this.plugin.manifest.dir!, t.id);
									new Notice(`BibLens: ${t.displayName} deleted`);
								} catch (e) {
									new Notice(`BibLens: delete failed — ${e instanceof Error ? e.message : String(e)}`);
								}
								this.display();
							});
						});
					}
				}
			})
			.catch((e: unknown) => console.error('BibLens: failed to list translations', e));
	}
}
