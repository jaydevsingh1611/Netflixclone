import { defineConfig } from 'vite'
import tailwindcss from  '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: '.',
  plugins: [
  tailwindcss(),
  react(),
],
build: {
  outDir: 'dist', // output only inside client
  emptyOutDir: true
},
resolve: {
  dedupe: ['react', 'react-dom']
},
optimizeDeps: {
  // Exclude server dependencies from optimization
  exclude: ['mongoose', 'mongodb'],
  include: ['react', 'react-dom', 'react-player']
}
})
