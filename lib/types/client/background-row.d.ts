import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createBackgroundRowStore } from './settings-store.ts';
import type { BackgroundItem, BackgroundSettings } from '../skin-settings.ts';
/** Injected business face: the settings write (t rides the standard locale seat). */
export interface BackgroundRowInjected {
    /** Write one background settings field; resolves when the write commits. */
    update: (field: keyof BackgroundSettings, value: BackgroundSettings[keyof BackgroundSettings]) => Promise<void>;
    /** Upload the picked file to the host asset store; resolves with the item. */
    upload: (file: File) => Promise<BackgroundItem>;
    /** List the image files already sitting in the asset store folder. */
    scanFolder: () => Promise<BackgroundItem[]>;
    /** Best-effort cleanup of the stored file behind a deleted item. */
    removeAsset: (item: BackgroundItem) => void;
    /** Apply an item instantly, like a skin switch; the write persists it. */
    applyItem: (item: BackgroundItem) => void;
    /** Paint the slider's live value immediately (real-time dimming preview). */
    previewOpacity: (value: number) => void;
    /** Paint the sidebar glass transparency live. */
    previewChrome: (value: number) => void;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type BackgroundRowComponentProps = PropsRuntime<'settings.appearance.item'> & PropsStore<ReturnType<typeof createBackgroundRowStore>> & PropsLocale<'settings.skin-background'> & BackgroundRowInjected;
/**
 * Render the background row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export declare function BackgroundRow({ t, useStore, update, upload, scanFolder, removeAsset, applyItem, previewOpacity, previewChrome, }: BackgroundRowComponentProps): import("react").JSX.Element;
