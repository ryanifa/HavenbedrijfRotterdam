import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relatieve paden zodat de build óók werkt onder een subpad,
  // zoals op GitHub Pages (https://<user>.github.io/<repo>/).
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
