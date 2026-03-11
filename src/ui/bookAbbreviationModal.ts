import { App, SuggestModal } from 'obsidian';
import { ALL_BOOK_IDS } from '../books';

export class BookAbbreviationModal extends SuggestModal<string> {
	private formatBooks: Record<string, string>;
	private onChoose: (abbr: string) => void;

	constructor(app: App, formatBooks: Record<string, string>, onChoose: (abbr: string) => void) {
		super(app);
		this.formatBooks = formatBooks;
		this.onChoose = onChoose;
		this.modalEl.addClass('biblens-book-abbr-modal');
	}

	getSuggestions(query: string): string[] {
		const q = query.toLowerCase();
		if (Object.keys(this.formatBooks).length > 0) {
			return Object.values(this.formatBooks).filter(abbr => abbr.toLowerCase().includes(q));
		}
		return ALL_BOOK_IDS.filter(id => id.toLowerCase().includes(q));
	}

	renderSuggestion(abbr: string, el: HTMLElement): void {
		el.textContent = abbr;
	}

	onChooseSuggestion(abbr: string): void {
		this.onChoose(abbr);
	}
}
