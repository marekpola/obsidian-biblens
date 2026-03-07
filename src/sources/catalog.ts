// Pure module — no Obsidian imports

export type RemoteTranslationEntry = {
	id: string;          // local file id, e.g. "bkr"
	displayName: string; // e.g. "Bible Kralická"
	language: string;    // BCP 47, e.g. "cs"
	remoteId: string;    // provider-specific key used in URL construction
};

export type SourceProvider = {
	id: string;                             // e.g. "getbible-net"
	displayName: string;                    // e.g. "GetBible (getbible.net)"
	baseUrl: string;
	adapterType: string;                    // key into adapter registry
	translations: RemoteTranslationEntry[];
};

// Bundled fallback — populated by Task 18
export const KNOWN_PROVIDERS: SourceProvider[] = [];
