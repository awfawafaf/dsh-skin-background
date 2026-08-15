import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
//#region src/skin-settings.ts
/** Custom-background skin settings stored in the Host user-settings document. */
/** Settings namespace owned by the custom-background skin. */
const BACKGROUND_SETTINGS_NAMESPACE = "skin-background";
/** Fallback values when the settings document has no override. */
const DEFAULT_BACKGROUND_SETTINGS = {
	activeId: "",
	opacity: 100,
	chromeOpacity: 40,
	items: []
};
/** Durable background schema; also the wire envelope the browser scope validates against. */
const BackgroundSettingsSchema = z.object({
	activeId: z.string().default(""),
	opacity: z.number().min(0).max(100).step(5).default(100),
	chromeOpacity: z.number().min(0).max(100).step(5).default(40),
	items: z.array(z.object({
		id: z.string(),
		name: z.string(),
		dataUrl: z.string()
	})).default([])
});
//#endregion
//#region src/index.ts
const BACKGROUND_NAMESPACE = settingsNamespace(BACKGROUND_SETTINGS_NAMESPACE);
/**
* Register the durable background section with the Host settings service
* when it is composed. The browser half binds the same namespace through
* `ctx.settingsScope`.
* @param ctx - Host context that may acquire the settings service.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema);
	});
}
//#endregion
export { BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, apply };
