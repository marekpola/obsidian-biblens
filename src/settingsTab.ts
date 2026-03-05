import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type BibLensPlugin from './main';
import { listAvailableTranslations } from './translationRegistry';

export class BibLensSettingTab extends PluginSettingTab {
	private plugin: BibLensPlugin;

	constructor(app: App, plugin: BibLensPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		listAvailableTranslations(this.app.vault.adapter, this.plugin.manifest.dir!)
			.then(translations => {
				const options: Record<string, string> = {};
				for (const t of translations) {
					options[t.id] = t.displayName;
				}

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
							new Notice(`BibLens: switched to ${value.toUpperCase()}`);
						});
					});
			})
			.catch((e: unknown) => {
				console.error('BibLens: failed to list translations', e);
			});
	}
}
