import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // `@/` points at src/ (root-relative), so imports read the same from any folder depth.
  resolve: { alias: { '@/': '/src/' } },
})
