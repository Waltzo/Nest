import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repo at https://waltzo.github.io/Nest/
// so assets must be resolved under the /Nest/ base path.
// If you later attach a custom domain served at the root, change base to '/'.
export default defineConfig({
  base: '/Nest/',
  plugins: [react()],
})
