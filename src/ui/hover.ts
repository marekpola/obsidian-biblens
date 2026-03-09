export class PopoverManager {
	private el: HTMLElement | null = null;
	private _popoverHovered = false;

	show(anchor: HTMLElement, content: HTMLElement): void {
		this.hide();
		const popover = document.createElement('div');
		popover.addClass('biblens-popover');
		popover.appendChild(content);

		document.body.appendChild(popover);
		this.el = popover;

		popover.addEventListener('mouseenter', () => {
			this._popoverHovered = true;
		});
		popover.addEventListener('mouseleave', () => {
			this._popoverHovered = false;
			this.hide();
		});

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

	requestHide(): void {
		if (!this._popoverHovered) {
			this.hide();
		}
	}
}
