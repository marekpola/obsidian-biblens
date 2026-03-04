export class PopoverManager {
	private el: HTMLElement | null = null;

	show(anchor: HTMLElement, content: string): void {
		this.hide();
		const popover = document.createElement('div');
		popover.addClass('biblens-popover');
		popover.textContent = content;

		document.body.appendChild(popover);
		this.el = popover;

		const rect = anchor.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const pw = popover.offsetWidth;
		const ph = popover.offsetHeight;
		const GAP = 4;

		let top = rect.bottom + GAP;
		if (top + ph > vh) top = rect.top - ph - GAP;
		if (top < 0) top = GAP;

		let left = rect.left;
		if (left + pw > vw) left = vw - pw - GAP;
		if (left < 0) left = GAP;

		popover.style.top = `${top}px`;
		popover.style.left = `${left}px`;
	}

	hide(): void {
		if (this.el) {
			this.el.remove();
			this.el = null;
		}
	}
}
