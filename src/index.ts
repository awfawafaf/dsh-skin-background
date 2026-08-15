/** Host registration for the durable custom-background preference plus the
 * image asset store: wallpapers live as files under the DSH data directory
 * and are served over the loopback web server, so the settings document
 * stays tiny — embedding the payloads made every write round-trip carry the
 * whole library and broke switching on large collections. */

import { createWriteStream, mkdirSync } from 'node:fs'
import { unlink, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
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

/** The plugin's data directory (DSH_HOME/data/dsh-skin-background). */
export function assetDataDir(): string {
  return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'data', 'dsh-skin-background')
}

/** Safe stored file name: `<uuid>.<ext>` only — nothing caller-controlled. */
function isSafeAssetName(name: string): boolean {
  return /^[0-9a-f-]{36}\.(jpg|jpeg|png|gif|webp)$/.test(name)
}

/**
 * Register the durable background section with the Host settings service
 * and the asset store routes on the web server when they are composed.
 * @param ctx - Host context that may acquire the services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema)
  })
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: ASSET_ROUTE_PREFIX,
      handler: (req, res) => handleAssetRequest(req, res),
    }), 'dsh-skin-background: asset routes')
  })
}

/** Route the asset store requests; answers everything else with 404. */
async function handleAssetRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://x').pathname
  if (pathname === `${ASSET_ROUTE_PREFIX}/upload` && req.method === 'POST') {
    await handleUpload(req, res)
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
    const file = join(assetDataDir(), name)
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

/** Read the upload body (bounded), persist it, and answer with the item. */
async function handleUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
  const dir = assetDataDir()
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
