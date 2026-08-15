/** Background painting for the custom-background skin.
 *
 * The wallpaper is driven by one CSS variable (`--dsh-bg-art`) on the body
 * plus an injected stylesheet that paints the app's base surfaces from it
 * — the maid-atelier skin's architecture: `background-attachment: fixed`
 * anchors the cover crop to the viewport once, so the image is a STATIC
 * base that never moves when the shell's columns animate, and switching
 * images is a single variable write that every surface picks up at once.
 * The image payloads live in the host asset store; the settings document
 * holds only served URLs.
 */
import type { BackgroundSettings } from '../skin-settings.ts';
/** Maximum accepted still-image file size (4K wallpapers fit). */
export declare const MAX_IMAGE_BYTES: number;
/** Maximum accepted animated GIF size — frames make them larger than stills. */
export declare const MAX_GIF_BYTES: number;
/** Maximum number of saved library items. */
export declare const MAX_LIBRARY_ITEMS = 24;
/** The size cap for a picked file, by its type. */
export declare function sizeCapForFile(file: File): number;
/** Fallback light gradient (soft whale-blue sky) when no image is saved. */
export declare const LIGHT_FALLBACK_GRADIENT = "linear-gradient(180deg, #dbe6fb 0%, #f4f7ff 55%, #e9effc 100%)";
/** Fallback dark gradient (deep atelier navy) when no image is saved. */
export declare const DARK_FALLBACK_GRADIENT = "linear-gradient(180deg, #0b193f 0%, #14265c 55%, #0a1636 100%)";
/** Resolve the active saved item, if any. */
export declare function activeBackgroundItem(settings: BackgroundSettings): BackgroundSettings['items'][number] | undefined;
