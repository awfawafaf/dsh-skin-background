import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // The published /client bundles are browser module-loader format and
      // crash under Node. This suite never exercises the store engine (the
      // official runtime suite owns that), so defineStore resolves to a test
      // stub instead of dragging the whole runtime client tree into devDeps.
      '@deepseek-ai/dsh-client-runtime/client': fileURLToPath(new URL('./tests/stubs/runtime-client.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.{ts,tsx}'],
  },
})
