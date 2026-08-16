// @vitest-environment jsdom
/**
 * Custom-background skin tests: installs the wallpaper stylesheet and the
 * `--dsh-bg-art` CSS variable (the maid-atelier architecture), waits for the
 * settings document before the first paint, applies items instantly like a
 * skin switch, flips the fallback gradient with the theme, and restores
 * everything on deactivation.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinDefinition } from 'dsh-skin-manager'
import { apply, SETTINGS_NS } from '../src/client/index.ts'
import { DEFAULT_BACKGROUND_SETTINGS, type BackgroundItem, type BackgroundSettings } from '../src/skin-settings.ts'

interface RowRegistration {
  name: string
  id: string
  order: number
  store: unknown
  locale: string
  inject: (actions: unknown) => {
    update: (field: string, value: unknown) => Promise<void>
    applyItem: (item: BackgroundItem) => void
    previewOpacity: (value: number) => void
    previewChrome: (value: number) => void
  }
}

const ITEM: BackgroundItem = { id: 'item-1', name: 'ocean.png', url: '/skin-background/assets/item-1.jpg' }

const fakes: ReturnType<typeof fakeCtx>[] = []

/** Fetch-backed settings mock mirroring the host route (/skin-background/settings). */
function fakeScope(initial?: BackgroundSettings) {
  let value = initial
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/skin-background/settings') {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { field: string; value: unknown }
        value = { ...(value ?? DEFAULT_BACKGROUND_SETTINGS), [body.field]: body.value } as BackgroundSettings
      }
      return new Response(JSON.stringify(value ?? DEFAULT_BACKGROUND_SETTINGS), { status: 200 })
    }
    return new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return {
    fetchMock,
    setValue: (next: BackgroundSettings) => { value = next },
    read: () => value,
  }
}

function fakeCtx(settings?: BackgroundSettings) {
  const host = fakeScope(settings)
  const effects: (() => unknown)[] = []
  let slotName: string | undefined
  let registration: RowRegistration | undefined
  let localeNamespace: string | undefined
  let lastSkin: SkinDefinition | undefined

  const ctx = {
    provide: () => {},
    on: () => () => {},
    emit: () => {},
    effect: (factory: () => unknown) => { effects.push(factory()) },
    locale: {
      register: (namespace: string) => { localeNamespace = namespace },
    },
    slots: {
      inject: (name: string, factory: () => unknown) => {
        slotName = name
        factory()
      },
      register: (options: RowRegistration) => {
        registration = options
        return () => {}
      },
    },
    workspaces: {
      pickDirectory: vi.fn(),
    },
    skinManager: {
      register: (skin: SkinDefinition) => {
        lastSkin = skin
        return () => {}
      },
    },
  }

  const fake = {
    ctx: ctx as unknown as ClientContext,
    host,
    runDisposers: () => { for (const disposer of effects.splice(0)) if (typeof disposer === 'function') disposer() },
    readSlot: () => ({ slotName, registration }),
    readLocale: () => localeNamespace,
    readSkin: () => lastSkin,
  }
  fakes.push(fake)
  return fake
}

async function flushMutations(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

function artVariable(): string {
  return document.body.style.getPropertyValue('--dsh-bg-art')
}

function wallpaperSheet(): HTMLStyleElement | undefined {
  return document.querySelector<HTMLStyleElement>("style[data-skin-chrome='background-style']") ?? undefined
}

afterEach(() => {
  for (const fake of fakes.splice(0)) fake.runDisposers()
  document.body.removeAttribute('style')
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  vi.restoreAllMocks()
})

describe('dsh-skin-background client apply', () => {
  it('declares the public client manifest with the skin-manager edge', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(manifest.dsh.client.platform).toBe('web')
    expect(manifest.dsh.client.inject).toContain('dsh-skin-manager')
    expect(manifest.peerDependencies['@deepseek-ai/cordis']).toBe('^4.0.1')
  })

  it('registers the background skin and the Appearance-section row', () => {
    const { ctx, readSlot, readLocale, readSkin } = fakeCtx()
    apply(ctx)

    expect(readSkin()?.id).toBe('background')
    expect(readSkin()?.label).toBe('自定义背景')
    expect(readLocale()).toBe(SETTINGS_NS)
    const { slotName, registration } = readSlot()!
    expect(slotName).toBe('settings.appearance.item')
    expect(registration!.id).toBe('skin-background')
    expect(registration!.order).toBe(30)
  })

  it('installs the wallpaper stylesheet and the art variable on apply', async () => {
    const { ctx, readSkin } = fakeCtx({ activeId: ITEM.id, opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM] })
    apply(ctx)
    const skin = readSkin()!

    const dispose = skin.apply()
    await flushMutations()
    const sheet = wallpaperSheet()
    expect(sheet).toBeDefined()
    const rules = [...(sheet!.sheet?.cssRules ?? [])].map(rule => rule.cssText)
    expect(rules.some(rule => rule.includes('[data-phase=') && rule.includes('var(--dsh-bg-art)'))).toBe(true)
    expect(rules.some(rule => rule.includes("[class*='frame']") && rule.includes('var(--dsh-bg-art)'))).toBe(true)
    expect(artVariable()).toContain('item-1.jpg')

    dispose()
  })

  it('defers the first paint until the settings route answers (no boot flash)', async () => {
    const { ctx, readSkin } = fakeCtx()
    apply(ctx)
    const skin = readSkin()!
    const dispose = skin.apply()

    // Settings route still loading: no stylesheet, no art variable,
    // nothing painted — not even the fallback gradient.
    expect(wallpaperSheet()).toBeUndefined()
    expect(artVariable()).toBe('')

    // The GET /skin-background/settings round-trip resolves (no item saved
    // yet), so the fallback gradient paints without any item flash.
    await flushMutations()
    expect(wallpaperSheet()).toBeDefined()
    expect(artVariable()).toContain('#dbe6fb')

    dispose()
  })

  it('applies an item instantly like a skin switch and persists it', async () => {
    const second: BackgroundItem = { id: 'item-2', name: 'night.png', url: '/skin-background/assets/item-2.jpg' }
    const { ctx, host, readSkin, readSlot } = fakeCtx({ activeId: ITEM.id, opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM, second] })
    apply(ctx)
    const skin = readSkin()!
    const dispose = skin.apply()
    await flushMutations()
    expect(artVariable()).toContain('item-1.jpg')

    const syncSpy = vi.fn()
    const { applyItem } = readSlot()!.registration!.inject({ sync: syncSpy })
    applyItem(second)
    // One CSS variable write switches the wallpaper on every surface, and
    // the row store highlights optimistically — no round-trip wait.
    expect(artVariable()).toContain('item-2.jpg')
    expect(syncSpy).toHaveBeenCalledWith(expect.objectContaining({ activeId: 'item-2' }))
    await flushMutations()
    expect(host.read()).toEqual({ activeId: 'item-2', opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM, second] })

    dispose()
  })

  it('sets the dimming veil from the opacity and previews it live', async () => {
    const { ctx, readSkin, readSlot } = fakeCtx({ activeId: ITEM.id, opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM] })
    apply(ctx)
    const skin = readSkin()!
    const dispose = skin.apply()
    await flushMutations()
    // 100 = full image: the veil strength is 0%.
    expect(document.body.style.getPropertyValue('--dsh-bg-veil-strength')).toBe('0%')

    const { previewOpacity } = readSlot()!.registration!.inject({ sync: () => {} })
    previewOpacity(40)
    expect(document.body.style.getPropertyValue('--dsh-bg-veil-strength')).toBe('60%')

    dispose()
  })

  it('sets the sidebar glass transparency and previews it live', async () => {
    const { ctx, readSkin, readSlot } = fakeCtx({ activeId: ITEM.id, opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM] })
    apply(ctx)
    const skin = readSkin()!
    const dispose = skin.apply()
    await flushMutations()
    expect(document.body.style.getPropertyValue('--dsh-chrome-transparency')).toBe('40%')

    const { previewChrome } = readSlot()!.registration!.inject({ sync: () => {} })
    previewChrome(80)
    expect(document.body.style.getPropertyValue('--dsh-chrome-transparency')).toBe('80%')

    dispose()
  })

  it('switches the fallback gradient with the theme when no image is saved', async () => {
    const { ctx, readSkin } = fakeCtx({ activeId: '', opacity: 100, chromeOpacity: 40, assetDir: '', items: [] })
    apply(ctx)
    const skin = readSkin()!
    const dispose = skin.apply()
    await flushMutations()
    expect(artVariable()).toContain('#dbe6fb')

    document.body.setAttribute('data-ds-dark-theme', '')
    await flushMutations()
    expect(artVariable()).toContain('#0b193f')

    dispose()
  })

  it('restores everything on deactivation', async () => {
    const { ctx, readSkin } = fakeCtx({ activeId: ITEM.id, opacity: 100, chromeOpacity: 40, assetDir: '', items: [ITEM] })
    apply(ctx)
    const skin = readSkin()!

    const dispose = skin.apply()
    await flushMutations()
    expect(wallpaperSheet()).toBeDefined()

    dispose()
    expect(wallpaperSheet()).toBeUndefined()
    expect(artVariable()).toBe('')
  })

  it('writes settings through the injected update face', async () => {
    const { ctx, host, readSlot } = fakeCtx()
    apply(ctx)
    const { update } = readSlot()!.registration!.inject({ sync: () => {} })

    await update('activeId', 'item-9')
    expect(host.read()).toEqual({ activeId: 'item-9', opacity: 100, chromeOpacity: 40, assetDir: '', items: [] })
  })
})
