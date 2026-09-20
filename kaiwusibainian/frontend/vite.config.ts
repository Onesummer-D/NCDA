import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/NCDA/',   // GitHub Pages 项目页路径（https://onesummer-d.github.io/NCDA/）
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8100',
    },
  },
})
