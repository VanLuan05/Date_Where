import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/Date_Where/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "heart.svg",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        name: "DateWhere - Không gian riêng của đôi mình",
        short_name: "DateWhere",
        description: "Sổ tay lưu trữ địa điểm hẹn hò và đếm ngày yêu cho cặp đôi",
        theme_color: "#fff1f2",
        background_color: "#fff1f2",
        display: "standalone",
        orientation: "portrait",
        start_url: "/Date_Where/",
        scope: "/Date_Where/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "DateWhere - Không gian riêng của đôi mình",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "DateWhere trên màn hình rộng",
          },
        ],
        shortcuts: [
          {
            name: "Nhắn tin với người ấy",
            url: "/Date_Where/?tab=chat",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Handler push/notificationclick dùng chung cho SW chính của PWA.
        // public/firebase-messaging-sw.js KHÔNG import ở đây: nó được đăng ký
        // riêng (lazy, kèm config qua query string) từ src/firebase/messaging.js
        // để nhận background message FCM khi app đã đóng.
        importScripts: ["sw-notifications.js"],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
});
