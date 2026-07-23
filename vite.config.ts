import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline app shell for the /scan ticket scanner ONLY — see spec
    // docs/superpowers/specs/2026-07-21-ticketing-design.md section 6 and
    // plan task T-F8. This must never touch the public marketing site or
    // the admin dashboard, both of which share this same single-page app's
    // one index.html. Two things keep it scoped to /scan:
    //
    //   1. `injectRegister: false` and `manifest: false` — nothing about
    //      this plugin writes to index.html. There is no auto-injected
    //      <script> or <link rel="manifest"> that would run for every
    //      visitor. dist/sw.js is emitted but otherwise completely inert.
    //   2. The service worker is registered manually, and ONLY from
    //      src/pages/ScanPage.tsx (itself lazy-loaded, never reached by an
    //      ordinary visitor), with an explicit `{ scope: "/scan" }`. A
    //      service worker only controls documents whose URL falls within
    //      its registered scope, so it can never intercept requests made by
    //      "/", "/dashboard", etc. — those pages never register it at all.
    VitePWA({
      injectRegister: false,
      manifest: false,
      registerType: 'prompt',
      // generateSW precaches every JS/CSS/HTML file in the build — that is
      // intentional here, not an oversight: the SPA has a single entry
      // script, so loading /scan with genuinely zero network (a cold
      // service-worker cache, no prior page in this tab session) requires
      // that entry plus the scan chunk to already be cached, not just the
      // scan chunk on its own.
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/scan/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
