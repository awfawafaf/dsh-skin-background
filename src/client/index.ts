/**
 * Custom-background skin: registers with the skin manager like any other
 * skin (selecting it activates the background layer; switching away restores
 * the previous look). The wallpaper is a STATIC base painted by one CSS
 * variable plus an injected stylesheet — the maid-atelier skin's
 * architecture: the image is anchored to the viewport with `fixed`/`cover`,
 * so it never moves when the shell's columns animate, and switching images
 * is a single variable write that every surface picks up at once. Owns its
 * durable settings section (active item + saved library) and an
 * Appearance-section settings row for the library management.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: Context merges (ctx.settingsScope / ctx.locale / ctx.skinManager).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { SkinDefinition } from 'dsh-skin-manager'
import type {} from 'dsh-skin-manager/client'
import type { BackgroundRowInjected } from './background-row.tsx'
import { BackgroundRow } from './background-row.tsx'
import { createBackgroundRowStore } from './settings-store.ts'
import { zh, en, type BackgroundKey } from './locales.ts'
import {
  activeBackgroundItem, DARK_FALLBACK_GRADIENT, LIGHT_FALLBACK_GRADIENT,
} from './background-layer.ts'
import {
  BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, type BackgroundItem,
  type BackgroundSettings,
} from '../skin-settings.ts'

/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.skin-background'

/** The CSS variable every painted surface reads its wallpaper from. */
const ART_VARIABLE = '--dsh-bg-art'

/** The CSS variable holding the dimming veil strength (a percentage). */
const VEIL_STRENGTH_VARIABLE = '--dsh-bg-veil-strength'

/** The CSS variable holding the sidebar glass transparency (a percentage). */
const CHROME_TRANSPARENCY_VARIABLE = '--dsh-chrome-transparency'

/**
 * Wallpaper painting declarations: the veil layer (a theme-base gradient at
 * `--dsh-bg-veil-strength`) dims bright images on top of the art, and the
 * fixed/cover block anchors the whole stack to the viewport.
 */
const WALLPAPER_BLOCK = [
  'background-image: linear-gradient(color-mix(in srgb, var(--dsw-alias-bg-base) var(--dsh-bg-veil-strength, 0%), transparent), color-mix(in srgb, var(--dsw-alias-bg-base) var(--dsh-bg-veil-strength, 0%), transparent)), var(--dsh-bg-art) !important',
  'background-position: center center !important',
  'background-size: cover !important',
  'background-attachment: fixed !important',
  'background-repeat: no-repeat !important',
].join('; ')

/** The base surfaces that carry the wallpaper (stable selectors only). */
const WALLPAPER_RULES = [
  // The ultimate static base, exactly like the maid's palace backdrop.
  `body { ${WALLPAPER_BLOCK} }`,
  // The conversation column: hero (blank session) and active chat phases.
  `[data-phase='hero'], [data-phase='active'] { ${WALLPAPER_BLOCK} }`,
  // The app frame carries the wallpaper; the columns over it turn glassy
  // below, so the wallpaper shows through them with a theme tint.
  `[class*='frame'] { ${WALLPAPER_BLOCK} }`,
  // Glassy sidebars, the maid's token-rebinding trick: every surface that
  // fills with the sidebar token becomes translucent at the
  // `--dsh-chrome-transparency` percentage, and the wallpaper on the frame
  // shows through (theme-aware via the static tokens).
  `body[data-ds-dark-theme] { --dsw-specific-sidebar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-900) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
  `body:not([data-ds-dark-theme]) { --dsw-specific-sidebar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-50) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
  // The right details panel: the slot wrapper and/or the panel surface turn
  // translucent so the wallpaper shows through.
  `[class*='detailsCol'] [data-slot='details'], [class*='detailsCol'] [data-slot='details'] > * { background-color: color-mix(in srgb, var(--dsw-alias-bg-base) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) !important; }`,
  // The docked composer seat's fade mask turns translucent.
  `[class*='composerSeat'] { background-image: linear-gradient(180deg, transparent 0px, color-mix(in srgb, var(--dsw-alias-bg-base) calc(100% - var(--dsh-chrome-transparency, 40%)), transparent) 36px) !important; }`,
]

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The background settings row's copy. */
    'settings.skin-background': BackgroundKey
  }
}

/** Required services: skin manager, settings transport, slots/locale. */
export const inject = ['skinManager', 'slots', 'locale', 'connection', 'remote', 'settingsScope']

/**
 * Client plugin body: register the background skin and its settings row.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const host = ctx.settingsScope.bind<BackgroundSettings>({ namespace: BACKGROUND_SETTINGS_NAMESPACE })
  let bound: BoundActions<ReturnType<typeof createBackgroundRowStore>> | undefined
  let active = false
  let armed = false
  let sheet: HTMLStyleElement | undefined

  const current = (): BackgroundSettings => host.getSnapshot().value ?? DEFAULT_BACKGROUND_SETTINGS

  /** The image value (data URI or theme-matched gradient) for an item. */
  const imageValue = (item: BackgroundItem | undefined): string =>
    item !== undefined
      ? `url("${item.dataUrl}")`
      : document.body.hasAttribute('data-ds-dark-theme')
        ? DARK_FALLBACK_GRADIENT
        : LIGHT_FALLBACK_GRADIENT

  /** The veil strength percentage (100 = fully dimmed toward the base). */
  const veilStrength = (opacity: number): string =>
    `${100 - Math.min(100, Math.max(0, opacity))}%`

  /** The chrome transparency percentage (100 = fully clear glass). */
  const chromeTransparency = (value: number): string =>
    `${Math.min(100, Math.max(0, value))}%`

  /** Write the current wallpaper, veil, and glass into the CSS variables. */
  const syncArt = (): void => {
    if (!armed) return
    document.body.style.setProperty(ART_VARIABLE, imageValue(activeBackgroundItem(current())))
    document.body.style.setProperty(VEIL_STRENGTH_VARIABLE, veilStrength(current().opacity))
    document.body.style.setProperty(CHROME_TRANSPARENCY_VARIABLE, chromeTransparency(current().chromeOpacity))
  }

  /**
   * Install the wallpaper stylesheet and first art value. Deferred until the
   * settings document has loaded so boot never flashes the fallback gradient
   * over the chosen image (the maid paints instantly only because its art is
   * compiled in, not settings-driven); once installed, CSS applies the
   * wallpaper to every surface continuously — no per-surface repainting.
   */
  const setup = (): void => {
    if (!active || armed) return
    armed = true
    sheet = document.createElement('style')
    sheet.dataset.skinChrome = 'background-style'
    document.head.append(sheet)
    for (const rule of WALLPAPER_RULES) sheet.sheet!.insertRule(rule)
    syncArt()
  }

  const teardownSkin = (): void => {
    active = false
    armed = false
    sheet?.remove()
    sheet = undefined
    document.body.style.removeProperty(ART_VARIABLE)
    document.body.style.removeProperty(VEIL_STRENGTH_VARIABLE)
    document.body.style.removeProperty(CHROME_TRANSPARENCY_VARIABLE)
  }

  const skin: SkinDefinition = {
    id: 'background',
    label: '自定义背景',
    labelEn: 'Custom Background',
    accent: '#4a7bd4',
    order: 6,
    apply: () => {
      active = true
      // Settings still loading? The adoption subscription installs the
      // wallpaper when they arrive — boot never flashes the fallback.
      if (host.getSnapshot().value !== undefined) setup()
      return teardownSkin
    },
  }
  ctx.effect(() => ctx.skinManager.register(skin), 'dsh-skin-background: register skin')

  ctx.effect(() => host.subscribe(() => {
    bound?.sync(current())
    if (active && !armed) setup()
    else syncArt()
  }), 'dsh-skin-background: settings adoption')

  ctx.effect(() => {
    // The fallback gradient is theme-matched; re-write it on theme flips.
    const observer = new MutationObserver(() => { syncArt() })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-ds-dark-theme'],
    })
    return () => { observer.disconnect() }
  }, 'dsh-skin-background: theme observer')

  ctx.effect(() => () => { teardownSkin() }, 'dsh-skin-background: background teardown')

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'dsh-skin-background: settings row dictionaries')

  const store = createBackgroundRowStore()
  const injected = (actions: BoundActions<ReturnType<typeof createBackgroundRowStore>>): BackgroundRowInjected => {
    bound = actions
    bound.sync(current())
    return {
      // Return the pending write so the row can serialize multi-field
      // updates (a burst of concurrent writes can lose later fields), and
      // re-sync the wallpaper as soon as the write commits.
      update: (field, value) => host.set(field, value).then(() => { syncArt() }),
      // Apply instantly like a skin switch: write the CSS variable right
      // away (every surface picks it up in one style recalc), highlight the
      // row optimistically (the persist round-trip carries the whole
      // library, which is slow when it holds many images), then persist.
      applyItem: (item) => {
        if (!armed) return
        document.body.style.setProperty(ART_VARIABLE, imageValue(item))
        bound?.sync({ ...current(), activeId: item.id })
        void host.set('activeId', item.id)
      },
      // Live dimming preview: write the veil variable right away; the row
      // debounces the persisted write.
      previewOpacity: (value) => {
        if (!armed) return
        document.body.style.setProperty(VEIL_STRENGTH_VARIABLE, veilStrength(value))
      },
      // Live glass preview for the sidebar chrome, same pattern.
      previewChrome: (value) => {
        if (!armed) return
        document.body.style.setProperty(CHROME_TRANSPARENCY_VARIABLE, chromeTransparency(value))
      },
    }
  }
  ctx.slots.inject('settings.appearance.item', () => ctx.slots.register({
    name: 'settings.appearance.item',
    id: 'skin-background',
    order: 30,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, BackgroundRow))
}
