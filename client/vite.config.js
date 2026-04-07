import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // we provide our own manifest.json in public/
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        runtimeCaching: [
          {
            // API routes: try network first, fall back to cache
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets"
            }
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:8080"
    }
  }
});
