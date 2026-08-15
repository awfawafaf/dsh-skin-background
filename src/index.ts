/** Host registration for the durable custom-background preference plus the
 * image asset store: wallpapers live as files under the DSH data directory
 * and are served over the loopback web server, so the settings document
 * stays tiny — embedding the payloads made every write round-trip carry the
 * whole library and broke switching on large collections. */

import { createWriteStream, mkdirSync } from 'node:fs'
import { readdir, unlink, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { BACKGROUND_SETTINGS_NAMESPACE, BackgroundSettingsSchema } from './skin-settings.ts'

export {
  BACKGROUND_SETTINGS_NAMESPACE, DEFAULT_BACKGROUND_SETTINGS,
  type BackgroundSettings,
} from './skin-settings.ts'

const BACKGROUND_NAMESPACE = settingsNamespace(BACKGROUND_SETTINGS_NAMESPACE)

/** Route prefix under which the asset store lives. */
export const ASSET_ROUTE_PREFIX = '/skin-background'

/** Maximum uploaded file size (bytes); larger bodies are refused before write. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/** Plugin configuration. */
export interface Config {
  /** The asset store directory. Empty = DSH_HOME/data/dsh-skin-background. */
  assetDir: string
}

export const Config: z<Config> = z.object({
  assetDir: z.string().default(''),
})

/** MIME type by extension (upload/serve whitelist). */
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

/** Extension by content-type (pick one per upload). */
function extensionForType(contentType: string): string | undefined {
  switch (contentType.split(';')[0]?.trim().toLowerCase()) {
    case 'image/jpeg': return '.jpg'
    case 'image/png': return '.png'
    case 'image/gif': return '.gif'
    case 'image/webp': return '.webp'
    default: return undefined
  }
}

/** The asset store directory: the configured folder, or DSH_HOME/data/dsh-skin-background. */
export function assetDataDir(config: Config): string {
  if (config.assetDir.trim() !== '') {
    const configured = config.assetDir.startsWith('~')
      ? join(homedir(), config.assetDir.slice(1))
      : config.assetDir
    return resolve(configured)
  }
  return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'data', 'dsh-skin-background')
}

/** Safe stored file name: an image file name without path separators. */
export function isSafeAssetName(name: string): boolean {
  return /^[^/\\]+\.(jpg|jpeg|png|gif|webp)$/.test(name)
}

/**
 * Register the durable background section with the Host settings service
 * and the asset store routes on the web server when they are composed.
 * @param ctx - Host context that may acquire the services.
 * @param config - plugin configuration (the asset store directory).
 */
export function apply(ctx: Context, config: Config): void {
  ctx.inject(['settings', 'webServer'], (svcCtx) => {
    svcCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema)
    // Minimal structural face of the Host settings service: the current
    // resolved value of the background namespace (schema defaults + user).
    const readChosenDir = (): string => {
      try {
        const descriptor = svcCtx.settings
          .describe({ redactSecrets: true })
          .find(candidate => String(candidate.ns) === BACKGROUND_SETTINGS_NAMESPACE)
        const chosen = (descriptor?.value as { assetDir?: unknown } | undefined)?.assetDir
        return typeof chosen === 'string' ? chosen : ''
      } catch {
        return ''
      }
    }
    svcCtx.effect(() => svcCtx.webServer.register({
      kind: 'prefix',
      path: ASSET_ROUTE_PREFIX,
      // The store folder follows the user's setting (picked in the row);
      // the patch config is only the fallback default.
      handler: (req, res) => handleAssetRequest(req, res, assetDataDir({ assetDir: readChosenDir() || config.assetDir })),
    }), 'dsh-skin-background: asset routes')
  })
}

/** Route the asset store requests; answers everything else with 404. */
async function handleAssetRequest(req: IncomingMessage, res: ServerResponse, dir: string): Promise<void> {
  // URL.pathname keeps percent-escapes; decode so Chinese/space names match
  // the files on disk (a bad escape answers 400 instead of throwing).
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
  } catch {
    res.writeHead(400)
    res.end()
    return
  }
  if (pathname === `${ASSET_ROUTE_PREFIX}/upload` && req.method === 'POST') {
    await handleUpload(req, res, dir)
    return
  }
  if (pathname === `${ASSET_ROUTE_PREFIX}/list` && req.method === 'GET') {
    await handleList(res, dir)
    return
  }
  const assetsPrefix = `${ASSET_ROUTE_PREFIX}/assets/`
  if (pathname.startsWith(assetsPrefix)) {
    const name = basename(pathname)
    if (!isSafeAssetName(name)) {
      res.writeHead(400)
      res.end()
      return
    }
    const file = join(dir, name)
    if (req.method === 'GET') {
      await serveAsset(file, res)
      return
    }
    if (req.method === 'DELETE') {
      await deleteAsset(file, res)
      return
    }
  }
  res.writeHead(404)
  res.end()
}

/** List the image files in the store as ready-to-import items. */
async function handleList(res: ServerResponse, dir: string): Promise<void> {
  let entries: string[] = []
  try {
    entries = await readdir(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      res.writeHead(500)
      res.end()
      return
    }
  }
  const items = entries
    .filter(isSafeAssetName)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({ id: name, name, url: `${ASSET_ROUTE_PREFIX}/assets/${encodeURIComponent(name)}` }))
  const payload = JSON.stringify(items)
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(payload)
}

/** Read the upload body (bounded), persist it, and answer with the item. */
async function handleUpload(req: IncomingMessage, res: ServerResponse, dir: string): Promise<void> {
  const extension = extensionForType(String(req.headers['content-type'] ?? ''))
  if (extension === undefined) {
    res.writeHead(415)
    res.end()
    return
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    total += buffer.length
    if (total > MAX_UPLOAD_BYTES) {
      res.writeHead(413)
      res.end()
      return
    }
    chunks.push(buffer)
  }
  const body = Buffer.concat(chunks)
  if (body.length === 0) {
    res.writeHead(400)
    res.end()
    return
  }
  mkdirSync(dir, { recursive: true })
  const fileName = `${randomUUID()}${extension}`
  const file = join(dir, fileName)
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(file)
    stream.on('finish', () => { resolve() })
    stream.on('error', reject)
    stream.end(body)
  })
  const payload = JSON.stringify({ id: fileName, url: `${ASSET_ROUTE_PREFIX}/assets/${fileName}` })
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(payload)
}

/** Serve a stored asset with its whitelisted content type. */
async function serveAsset(file: string, res: ServerResponse): Promise<void> {
  try {
    const body = await readFile(file)
    res.writeHead(200, {
      'content-type': MIME_BY_EXTENSION[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    })
    res.end(body)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(500)
    res.end()
  }
}

/** Remove a stored asset; missing files still answer 200 (idempotent). */
async function deleteAsset(file: string, res: ServerResponse): Promise<void> {
  try {
    await stat(file)
    await unlink(file)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      res.writeHead(500)
      res.end()
      return
    }
  }
  res.writeHead(200)
  res.end()
}
