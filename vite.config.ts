import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
        ],
        manifest: {
          name: "i8e10 | வரவு செலவு கணக்கு (Finance Tracker)",
          short_name: "i8e10",
          icons: [
            {
              src: "icons/pwa-48x48.png",
              sizes: "48x48",
              type: "image/png",
            },
            {
              src: "icons/pwa-72x72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "icons/pwa-96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "icons/pwa-128x128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "icons/pwa-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "icons/pwa-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src: "icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/pwa-256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "icons/pwa-384x384.png",
              sizes: "384x384",
              type: "image/png",
            },
            {
              src: "icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
          start_url: "/",
          display: "standalone",
          background_color: "#001c3e",
          theme_color: "#ffffff",
          screenshots: [
            {
              sizes: "360x800",
              src: "screenshots/pwa-screenshot-narrow-transaction.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Transactions view",
            },
            {
              sizes: "360x800",
              src: "screenshots/pwa-screenshot-narrow-debt.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Debt view",
            },
            {
              sizes: "360x800",
              src: "screenshots/pwa-screenshot-narrow-investment.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Investments view",
            },
            {
              sizes: "2560x1600",
              src: "screenshots/pwa-screenshot-wide-hero-view.png",
              type: "image/png",
              form_factor: "wide",
              label: "Hero view",
            },
          ],
        },
      }),
    ],
  };
});
