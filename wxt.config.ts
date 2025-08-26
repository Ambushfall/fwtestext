import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage', 'cookies'],
    host_permissions: [
      'https://poe.ninja/builds/*/character/*',
      'https://www.pathofexile.com/trade/search/*',
      'https://www.pathofexile.com/api/trade/data/stats',
      'https://www.pathofexile.com/*',
      'https://pathofexile.com/*'
    ]
  },
  outDir: "dist"
})
