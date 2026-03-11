import { StateEffect, StateField } from '@codemirror/state';
import type { RefScanner } from '../parser';

/** Dispatched to push a new scanner into all open editor views. */
export const scannerEffect = StateEffect.define<RefScanner>();

/** Holds the active RefScanner in CM6 state. Initialised with a no-op stub. */
export const scannerField = StateField.define<RefScanner>({
	create: () => ({ scan: () => [] }),
	update(scanner, tr) {
		for (const e of tr.effects) {
			if (e.is(scannerEffect)) return e.value;
		}
		return scanner;
	},
});
