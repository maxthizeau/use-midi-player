import react from '@vitejs/plugin-react'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],

  build: {
    copyPublicDir: true,
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'use-midi-player',
      formats: ['es', 'umd'],
      fileName: (format) => `use-midi-player.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'midifile-ts', '@ryohey/wavelet'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'midifile-ts': 'midifile-ts',
          '@ryohey/wavelet': '@ryohey/wavelet',
        },
      },
    },
  },
})
