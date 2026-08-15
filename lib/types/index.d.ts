/** Host registration for the durable custom-background preference. */
import type { Context } from '@deepseek-ai/cordis';
export { BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, type BackgroundSettings, } from './skin-settings.ts';
/**
 * Register the durable background section with the Host settings service
 * when it is composed. The browser half binds the same namespace through
 * `ctx.settingsScope`.
 * @param ctx - Host context that may acquire the settings service.
 */
export declare function apply(ctx: Context): void;
