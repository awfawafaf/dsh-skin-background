import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, stat, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
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
		url: z.string()
	})).default([])
});
//#endregion
//#region src/index.ts
/** Host registration for the durable custom-background preference plus the
* image asset store: wallpapers live as files under the DSH data directory
* and are served over the loopback web server, so the settings document
* stays tiny — embedding the payloads made every write round-trip carry the
* whole library and broke switching on large collections. */
const BACKGROUND_NAMESPACE = settingsNamespace(BACKGROUND_SETTINGS_NAMESPACE);
/** Route prefix under which the asset store lives. */
const ASSET_ROUTE_PREFIX = "/skin-background";
/** Maximum uploaded file size (bytes); larger bodies are refused before write. */
const MAX_UPLOAD_BYTES = 20971520;
/** MIME type by extension (upload/serve whitelist). */
const MIME_BY_EXTENSION = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp"
};
/** Extension by content-type (pick one per upload). */
function extensionForType(contentType) {
	switch (contentType.split(";")[0]?.trim().toLowerCase()) {
		case "image/jpeg": return ".jpg";
		case "image/png": return ".png";
		case "image/gif": return ".gif";
		case "image/webp": return ".webp";
		default: return;
	}
}
/** The plugin's data directory (DSH_HOME/data/dsh-skin-background). */
function assetDataDir() {
	return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "data", "dsh-skin-background");
}
/** Safe stored file name: `<uuid>.<ext>` only — nothing caller-controlled. */
function isSafeAssetName(name) {
	return /^[0-9a-f-]{36}\.(jpg|jpeg|png|gif|webp)$/.test(name);
}
/**
* Register the durable background section with the Host settings service
* and the asset store routes on the web server when they are composed.
* @param ctx - Host context that may acquire the services.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema);
	});
	ctx.inject(["webServer"], (webCtx) => {
		webCtx.effect(() => webCtx.webServer.register({
			kind: "prefix",
			path: ASSET_ROUTE_PREFIX,
			handler: (req, res) => handleAssetRequest(req, res)
		}), "dsh-skin-background: asset routes");
	});
}
/** Route the asset store requests; answers everything else with 404. */
async function handleAssetRequest(req, res) {
	const pathname = new URL(req.url ?? "/", "http://x").pathname;
	if (pathname === `/skin-background/upload` && req.method === "POST") {
		await handleUpload(req, res);
		return;
	}
	const assetsPrefix = `${ASSET_ROUTE_PREFIX}/assets/`;
	if (pathname.startsWith(assetsPrefix)) {
		const name = basename(pathname);
		if (!isSafeAssetName(name)) {
			res.writeHead(400);
			res.end();
			return;
		}
		const file = join(assetDataDir(), name);
		if (req.method === "GET") {
			await serveAsset(file, res);
			return;
		}
		if (req.method === "DELETE") {
			await deleteAsset(file, res);
			return;
		}
	}
	res.writeHead(404);
	res.end();
}
/** Read the upload body (bounded), persist it, and answer with the item. */
async function handleUpload(req, res) {
	const extension = extensionForType(String(req.headers["content-type"] ?? ""));
	if (extension === void 0) {
		res.writeHead(415);
		res.end();
		return;
	}
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		total += buffer.length;
		if (total > MAX_UPLOAD_BYTES) {
			res.writeHead(413);
			res.end();
			return;
		}
		chunks.push(buffer);
	}
	const body = Buffer.concat(chunks);
	if (body.length === 0) {
		res.writeHead(400);
		res.end();
		return;
	}
	const dir = assetDataDir();
	mkdirSync(dir, { recursive: true });
	const fileName = `${randomUUID()}${extension}`;
	const file = join(dir, fileName);
	await new Promise((resolve, reject) => {
		const stream = createWriteStream(file);
		stream.on("finish", () => {
			resolve();
		});
		stream.on("error", reject);
		stream.end(body);
	});
	const payload = JSON.stringify({
		id: fileName,
		url: `${ASSET_ROUTE_PREFIX}/assets/${fileName}`
	});
	res.writeHead(200, { "content-type": "application/json" });
	res.end(payload);
}
/** Serve a stored asset with its whitelisted content type. */
async function serveAsset(file, res) {
	try {
		const body = await readFile(file);
		res.writeHead(200, {
			"content-type": MIME_BY_EXTENSION[extname(file).toLowerCase()] ?? "application/octet-stream",
			"cache-control": "no-cache"
		});
		res.end(body);
	} catch (error) {
		if (error.code === "ENOENT") {
			res.writeHead(404);
			res.end();
			return;
		}
		res.writeHead(500);
		res.end();
	}
}
/** Remove a stored asset; missing files still answer 200 (idempotent). */
async function deleteAsset(file, res) {
	try {
		await stat(file);
		await unlink(file);
	} catch (error) {
		if (error.code !== "ENOENT") {
			res.writeHead(500);
			res.end();
			return;
		}
	}
	res.writeHead(200);
	res.end();
}
//#endregion
export { ASSET_ROUTE_PREFIX, BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS, apply, assetDataDir };
