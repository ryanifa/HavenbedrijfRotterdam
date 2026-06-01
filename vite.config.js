import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build-identificatie: commit-hash (in GitHub Actions) + datum/tijd.
const commit = (process.env.GITHUB_SHA || 'local').slice(0, 7)
const buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ')
const APP_VERSION = `${buildDate} UTC · ${commit}`

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  },
  // Relatieve paden zodat de build óók werkt onder een subpad,
  // zoals op GitHub Pages (https://<user>.github.io/<repo>/).
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
