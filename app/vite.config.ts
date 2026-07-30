import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/* MapLibre resolves its module worker at runtime with
   new URL('./maplibre-gl-worker.mjs', import.meta.url) — a dynamic string no
   bundler can statically see. In production import.meta.url points at the
   built assets/ chunk, so the worker (and the shared chunk it imports) must
   exist there under their original names; otherwise the SPA fallback serves
   index.html as the worker script and the map silently never loads tiles. */
function maplibreWorkerAssets(): Plugin {
  const require = createRequire(import.meta.url)
  const distDir = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist')
  const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']
  return {
    name: 'maplibre-worker-assets',
    generateBundle() {
      for (const f of files) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/${f}`,
          source: readFileSync(join(distDir, f), 'utf8'),
        })
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), maplibreWorkerAssets()],
  /* In dev the optimizer pre-bundles maplibre-gl but never emits the module
     worker it resolves at runtime, so the map silently never loads tiles.
     Excluding it serves the package's own files, worker included. */
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
