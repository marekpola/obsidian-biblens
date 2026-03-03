import { Notice, Plugin } from 'obsidian';

export default class BibLensPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'show-diagnostics',
			name: 'BibLens:Show Diagnostics',
			callback: () => {
				const { version } = this.manifest;
				new Notice(`BibLens v${version} is active.`);
			}
		});
	}

	onunload() {}
}
