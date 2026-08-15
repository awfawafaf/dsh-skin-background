import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type BackgroundKey } from './locales.ts';
/** Namespace owning this feature's settings-row copy. */
export declare const SETTINGS_NS = "settings.skin-background";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The background settings row's copy. */
        'settings.skin-background': BackgroundKey;
    }
}
/** Required services: skin manager, settings transport, slots/locale, and
 * the workspace service (the native folder picker). */
export declare const inject: string[];
/**
 * Client plugin body: register the background skin and its settings row.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
