import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/ripple/worker.js'),
      name: 'Worker',
      fileName: (format) => `worker.${format}.js`,
    },
    outDir: 'dist-worker',
  },
})
