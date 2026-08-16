/**
 * Minimal settings scope served by the plugin's own host route. The Web
 * BFF's namespace allowlist does not include third-party namespaces, so the
 * plugin's host half serves its section directly; this scope mirrors the
 * standard `SettingsScope` surface (getSnapshot/set/unset/subscribe) over
 * fetch, which is all the background runtime reads.
 */

import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'

/**
 * Create a fetch-backed settings scope over a plugin-owned route.
 * @param route - the host route serving the section (GET read, POST write).
 * @returns the scope; the initial read lands asynchronously.
 */
export function createFetchScope<T>(route: string): SettingsScope<T> {
  let value: T | undefined
  const listeners = new Set<() => void>()
  const notify = (): void => {
    for (const listener of listeners) listener()
  }
  const load = async (): Promise<void> => {
    try {
      const response = await fetch(route)
      if (!response.ok) return
      value = await response.json() as T
      notify()
    } catch {
      // Loopback read failed; the next subscribe or write retries naturally.
    }
  }
  void load()
  return {
    getSnapshot: (): SettingsScopeSnapshot<T> => ({
      // 'loading' until the first route answer lands, then 'ready'.
      status: value === undefined ? 'loading' : 'ready',
      value,
      // No composition layer behind the plugin-owned section.
      base: undefined,
      user: undefined,
      revision: undefined,
      writable: true,
      mode: 'host',
    }),
    set: async (field, next) => {
      const response = await fetch(route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field, value: next }),
      })
      if (!response.ok) throw new Error(`settings write failed: ${response.status}`)
      value = await response.json() as T
      notify()
    },
    unset: async (field) => {
      // No composition layer to fall back to: clearing writes the schema
      // default back by sending an undefined value.
      await fetch(route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field, value: undefined }),
      })
      value = undefined
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}
