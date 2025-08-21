import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig(async () => {
  const analyze = process.env.BUNDLE_ANALYZE === '1'

  const plugins: Plugin[] = [react(), tsconfigPaths()]

  if (analyze) {
    try {
      const moduleName = 'rollup-plugin-visualizer'
      type VisualizerModule = {
        visualizer?: (options: {
          filename: string
          open: boolean
          gzipSize: boolean
          brotliSize: boolean
        }) => Plugin
        default?: (options: {
          filename: string
          open: boolean
          gzipSize: boolean
          brotliSize: boolean
        }) => Plugin
      }
      const mod = (await import(moduleName)) as unknown as VisualizerModule
      const visualizerFn = mod.visualizer ?? mod.default
      if (visualizerFn) {
        plugins.push(
          visualizerFn({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        )
      }
    } catch {
      // visualizer not installed; skip
    }
  }

  return {
    plugins,
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined

            if (/node_modules\/(react|react-dom|scheduler|react-router-dom)\//.test(id)) {
              return 'vendor-react'
            }
            if (/node_modules\/@chakra-ui\//.test(id) || /node_modules\/@emotion\//.test(id)) {
              return 'vendor-chakra'
            }
            if (/node_modules\/@supabase\//.test(id)) {
              return 'vendor-supabase'
            }
            if (/node_modules\/react-icons\//.test(id)) {
              return 'vendor-icons'
            }
            return 'vendor'
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
  }
})
