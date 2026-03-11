import { describe, it, expect } from 'vitest';
import { migratePreferredTranslation, getActivePriority1Id, getActiveTranslations } from '../src/translationOrder';
import type { BibLensSettings } from '../src/settings';
import { DEFAULT_SETTINGS } from '../src/settings';

function makeSettings(overrides: Partial<BibLensSettings> = {}): BibLensSettings {
	return {
		...DEFAULT_SETTINGS,
		translationOrder: { ...DEFAULT_SETTINGS.translationOrder },
		translationAbbreviations: { ...DEFAULT_SETTINGS.translationAbbreviations },
		bundledPacksWritten: { ...DEFAULT_SETTINGS.bundledPacksWritten },
		...overrides,
	};
}

describe('migratePreferredTranslation', () => {
	it('migrates preferredTranslation to translationOrder and returns true', () => {
		const s = makeSettings() as unknown as BibLensSettings & { preferredTranslation: string };
		s.preferredTranslation = 'web';
		const result = migratePreferredTranslation(s as BibLensSettings);
		expect(result).toBe(true);
		expect(s.translationOrder['web']).toBe(1);
		expect('preferredTranslation' in s).toBe(false);
	});

	it('deletes empty preferredTranslation without assigning priority and returns true', () => {
		const s = makeSettings() as unknown as BibLensSettings & { preferredTranslation: string };
		s.preferredTranslation = '';
		const result = migratePreferredTranslation(s as BibLensSettings);
		expect(result).toBe(true);
		expect(Object.keys(s.translationOrder)).toHaveLength(0);
		expect('preferredTranslation' in s).toBe(false);
	});

	it('returns false and leaves settings unchanged when key is absent', () => {
		const s = makeSettings({ translationOrder: { web: 2 } });
		const result = migratePreferredTranslation(s);
		expect(result).toBe(false);
		expect(s.translationOrder).toEqual({ web: 2 });
	});
});

describe('getActivePriority1Id', () => {
	it('returns the id with priority 1', () => {
		const s = makeSettings({ translationOrder: { web: 1 } });
		expect(getActivePriority1Id(s)).toBe('web');
	});

	it('returns undefined when translationOrder is empty', () => {
		const s = makeSettings();
		expect(getActivePriority1Id(s)).toBeUndefined();
	});

	it('returns undefined when no entry has priority 1', () => {
		const s = makeSettings({ translationOrder: { web: 2 } });
		expect(getActivePriority1Id(s)).toBeUndefined();
	});

	it('returns undefined when entry is null', () => {
		const s = makeSettings({ translationOrder: { web: null } });
		expect(getActivePriority1Id(s)).toBeUndefined();
	});
});

describe('getActiveTranslations', () => {
	const webData = { 'GEN.1.1': 'In the beginning...' };
	const kjvData = { 'GEN.1.1': 'In the beginning God...' };

	it('returns entries sorted ascending by priority', () => {
		const s = makeSettings({ translationOrder: { kjv: 2, web: 1 } });
		const result = getActiveTranslations(s, { web: webData, kjv: kjvData });
		expect(result.map(e => e.id)).toEqual(['web', 'kjv']);
	});

	it('defaults abbreviation to id when not set', () => {
		const s = makeSettings({ translationOrder: { web: 1 } });
		const result = getActiveTranslations(s, { web: webData });
		expect(result[0]!.abbreviation).toBe('web');
	});

	it('uses custom abbreviation when set', () => {
		const s = makeSettings({
			translationOrder: { web: 1 },
			translationAbbreviations: { web: 'WEB' },
		});
		const result = getActiveTranslations(s, { web: webData });
		expect(result[0]!.abbreviation).toBe('WEB');
	});

	it('excludes entries with null priority', () => {
		const s = makeSettings({ translationOrder: { web: 1, kjv: null } });
		const result = getActiveTranslations(s, { web: webData, kjv: kjvData });
		expect(result.map(e => e.id)).toEqual(['web']);
	});

	it('excludes entries not present in allData', () => {
		const s = makeSettings({ translationOrder: { web: 1, kjv: 2 } });
		const result = getActiveTranslations(s, { web: webData });
		expect(result.map(e => e.id)).toEqual(['web']);
	});

	it('returns empty array when translationOrder is empty', () => {
		const s = makeSettings();
		expect(getActiveTranslations(s, { web: webData })).toEqual([]);
	});
});
