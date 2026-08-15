/** Host registration for the durable custom-background preference plus the
 * image asset store: wallpapers live as files under the DSH data directory
 * and are served over the loopback web server, so the settings document
 * stays tiny — embedding the payloads made every write round-trip carry the
 * whole library and broke switching on large collections. */
import type { Context } from '@deepseek-ai/cordis';
export { BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, type BackgroundSettings, } from './skin-settings.ts';
/** Route prefix under which the asset store lives. */
export declare const ASSET_ROUTE_PREFIX = "/skin-background";
/** The plugin's data directory (DSH_HOME/data/dsh-skin-background). */
export declare function assetDataDir(): string;
/**
 * Register the durable background section with the Host settings service
 * and the asset store routes on the web server when they are composed.
 * @param ctx - Host context that may acquire the services.
 */
export declare function apply(ctx: Context): void;
