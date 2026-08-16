/**
 * Minimal settings scope served by the plugin's own host route. The Web
 * BFF's namespace allowlist does not include third-party namespaces, so the
 * plugin's host half serves its section directly; this scope mirrors the
 * standard `SettingsScope` surface (getSnapshot/set/unset/subscribe) over
 * fetch, which is all the background runtime reads.
 */
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Create a fetch-backed settings scope over a plugin-owned route.
 * @param route - the host route serving the section (GET read, POST write).
 * @returns the scope; the initial read lands asynchronously.
 */
export declare function createFetchScope<T>(route: string): SettingsScope<T>;
