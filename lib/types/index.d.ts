/** Host registration for the durable custom-background preference plus the
 * image asset store: wallpapers live as files under the DSH data directory
 * and are served over the loopback web server, so the settings document
 * stays tiny — embedding the payloads made every write round-trip carry the
 * whole library and broke switching on large collections. */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export { BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, type BackgroundSettings, } from './skin-settings.ts';
/** Route prefix under which the asset store lives. */
export declare const ASSET_ROUTE_PREFIX = "/skin-background";
/** Route prefix under which the settings section is served. */
export declare const SETTINGS_ROUTE_PREFIX = "/skin-background/settings";
/** Plugin configuration. */
export interface Config {
    /** The asset store directory. Empty = DSH_HOME/data/dsh-skin-background. */
    assetDir: string;
}
export declare const Config: z<Config>;
/** The asset store directory: the configured folder, or DSH_HOME/data/dsh-skin-background. */
export declare function assetDataDir(config: Config): string;
/** Safe stored file name: an image file name without path separators. */
export declare function isSafeAssetName(name: string): boolean;
/**
 * Register the durable background section with the Host settings service
 * and the asset store routes on the web server when they are composed.
 * @param ctx - Host context that may acquire the services.
 * @param config - plugin configuration (the asset store directory).
 */
export declare function apply(ctx: Context, config: Config): void;
