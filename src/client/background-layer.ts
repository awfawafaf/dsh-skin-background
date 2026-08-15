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

import type { BackgroundSettings } from '../skin-settings.ts'

/** Maximum accepted still-image file size (4K wallpapers fit). */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024

/** Maximum accepted animated GIF size — frames make them larger than stills. */
export const MAX_GIF_BYTES = 15 * 1024 * 1024

/** Maximum number of saved library items. */
export const MAX_LIBRARY_ITEMS = 24

/** The size cap for a picked file, by its type. */
export function sizeCapForFile(file: File): number {
  return file.type === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES
}

/** Fallback light gradient (soft whale-blue sky) when no image is saved. */
export const LIGHT_FALLBACK_GRADIENT = 'linear-gradient(180deg, #dbe6fb 0%, #f4f7ff 55%, #e9effc 100%)'

/** Fallback dark gradient (deep atelier navy) when no image is saved. */
export const DARK_FALLBACK_GRADIENT = 'linear-gradient(180deg, #0b193f 0%, #14265c 55%, #0a1636 100%)'

/** Resolve the active saved item, if any. */
export function activeBackgroundItem(settings: BackgroundSettings): BackgroundSettings['items'][number] | undefined {
  return settings.items.find(item => item.id === settings.activeId)
}
