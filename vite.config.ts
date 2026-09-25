import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' so the built app works from any sub-path (GitHub Pages, Cloudflare Pages, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
