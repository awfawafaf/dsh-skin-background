/** Custom-background skin settings stored in the Host user-settings document. */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the custom-background skin. */
export declare const BACKGROUND_SETTINGS_NAMESPACE = "skin-background";
/** One saved background image. */
export interface BackgroundItem {
    /** Stable id (settings identity + asset id). */
    id: string;
    /** Original file name (display only). */
    name: string;
    /** Served asset path (`/skin-background/assets/<file>`); the payload lives
     * on disk, so the settings document stays tiny and every write round-trip
     * is small — embedding the images in the document made switching break on
     * large libraries. */
    url: string;
}
/** Durable background section shared by the Host schema and the browser scope. */
export interface BackgroundSettings {
    /** The saved item applied while the skin is active; empty = default gradient. */
    activeId: string;
    /** Image opacity 0–100 (step 5); 100 = full strength, lower dims bright images. */
    opacity: number;
    /** Sidebar glass transparency 0–100 (step 5); 0 = solid chrome, 100 = fully clear. */
    chromeOpacity: number;
    /** Saved background library. */
    items: BackgroundItem[];
}
/** Fallback values when the settings document has no override. */
export declare const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings;
/** Durable background schema; also the wire envelope the browser scope validates against. */
export declare const BackgroundSettingsSchema: z<BackgroundSettings>;
