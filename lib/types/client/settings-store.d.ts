/**
 * Background row slot store: a mirror of the bound settings section. The
 * plugin's apply-world settings listener is the only writer; the row
 * component reads via props.useStore.
 */
import { type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client';
import type { BackgroundSettings } from '../skin-settings.ts';
/** Store state mirrored from the background settings section. */
export type BackgroundRowState = BackgroundSettings;
/** Declared action shape giving the exported factory a stable return type. */
type BackgroundRowActions = {
    sync: (draft: BackgroundRowState, settings: BackgroundSettings) => void;
};
/**
 * Declares the background row state and write surface.
 * @returns the store handle.
 */
export declare function createBackgroundRowStore(): EngineStoreHandle<BackgroundRowState, BackgroundRowActions>;
export {};
