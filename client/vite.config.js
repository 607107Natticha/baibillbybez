import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    {
      name: 'inject-single-host-api-flag',
      enforce: 'pre',
      transformIndexHtml(html, ctx) {
        if (ctx.command !== 'build') return html
        if (process.env.VITE_SINGLE_HOST_API === 'false') return html
        return html.replace(
          /<head(\s[^>]*)?>/i,
          `<head$1><script>window.__SABAIBILL_USE_PAGE_ORIGIN_FOR_API__=!0</script>`
        )
      },
    },
  ],
  optimizeDeps: {
    include: ['xlsx/xlsx.mjs'],
  },
  server: {
    port: 5174,
    strictPort: false,
  },
}))
