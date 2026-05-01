import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
      exclude: ['**/*.css'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StellarPaymentButton',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@stellar/stellar-base'],
      output: {
        assetFileNames: 'stellar-payment-button.[ext]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
