import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from '@tailwindcss/vite'

// grab version from package.json so we can inject it into the build
import { version } from "./package.json";

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
      // expose the current application version so it can be shown in the UI
      "process.env.APP_VERSION": JSON.stringify(version),
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
        registerType: "prompt",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
        ],
        manifest: {
          name: "i8·e10 — Personal Finance Ledger & Wealth Manager",
          short_name: "i8e10",
          icons: [
            {
              src: "icons/pwa-48x48.png",
              sizes: "48x48",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-72x72.png",
              sizes: "72x72",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-128x128.png",
              sizes: "128x128",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-144x144.png",
              sizes: "144x144",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-152x152.png",
              sizes: "152x152",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "icons/pwa-256x256.png",
              sizes: "256x256",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "icons/pwa-384x384.png",
              sizes: "384x384",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          start_url: "/?utm_source=pwa",
          display: "standalone",
          background_color: "#f2efff",
          theme_color: "#4f39f6",
          screenshots: [
            {
              sizes: "1080x1920",
              src: "screenshots/pwa-screenshot-narrow-health.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Health view",
            },
            {
              sizes: "1080x1920",
              src: "screenshots/pwa-screenshot-narrow-debt.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Debt view",
            },
            {
              sizes: "1080x1920",
              src: "screenshots/pwa-screenshot-narrow-investment.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Investments view",
            },
            {
              sizes: "1080x1920",
              src: "screenshots/pwa-screenshot-narrow-transaction.png",
              type: "image/png",
              form_factor: "narrow",
              label: "Transactions view",
            },
            {
              sizes: "1920x1080",
              src: "screenshots/pwa-screenshot-wide-health.png",
              type: "image/png",
              form_factor: "wide",
              label: "Health view",
            },
            {
              sizes: "1920x1080",
              src: "screenshots/pwa-screenshot-wide-debt.png",
              type: "image/png",
              form_factor: "wide",
              label: "Debt view",
            },
            {
              sizes: "1920x1080",
              src: "screenshots/pwa-screenshot-wide-investment.png",
              type: "image/png",
              form_factor: "wide",
              label: "Investments view",
            },
            {
              sizes: "1920x1080",
              src: "screenshots/pwa-screenshot-wide-transaction.png",
              type: "image/png",
              form_factor: "wide",
              label: "Transactions view",
            },
          ],
        },
      }),
    ],
  };
});
