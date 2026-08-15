/**
 * Test stub for the published `@deepseek-ai/dsh-client-runtime/client` entry
 * (a browser module-loader bundle that cannot run under Node; the store
 * engine itself is owned by the official runtime suite, not this one).
 *
 * The slot system binds stores lazily at first render and this suite never
 * renders the row, so `defineStore` returns an inert handle whose shape
 * satisfies the registration options. Driving the engine from a test would
 * be a test bug and fails loud at the missing members.
 */
export function defineStore(): unknown {
  return {
    create: () => {
      throw new Error('store engine is stubbed in dsh-skin-manager tests')
    },
    dispose: () => {},
  }
}
