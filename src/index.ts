/** Host registration for the durable custom-background preference. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { BACKGROUND_SETTINGS_NAMESPACE, BackgroundSettingsSchema } from './skin-settings.ts'

export {
  BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS,
  type BackgroundSettings,
} from './skin-settings.ts'

const BACKGROUND_NAMESPACE = settingsNamespace(BACKGROUND_SETTINGS_NAMESPACE)

/**
 * Register the durable background section with the Host settings service
 * when it is composed. The browser half binds the same namespace through
 * `ctx.settingsScope`.
 * @param ctx - Host context that may acquire the settings service.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema)
  })
}
