// Pure module — no Obsidian imports

export const CATALOG_STALE_DAYS = 7;

export function isCatalogStale(catalogLastUpdated: string): boolean {
	if (!catalogLastUpdated) return true;
	const last = new Date(catalogLastUpdated).getTime();
	if (isNaN(last)) return true;
	return Date.now() - last > CATALOG_STALE_DAYS * 24 * 60 * 60 * 1000;
}
