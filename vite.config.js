import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' supaya build boleh di-host di mana-mana termasuk GitHub Pages (subpath repo)
export default defineConfig({
  plugins: [react()],
  base: './',
})
