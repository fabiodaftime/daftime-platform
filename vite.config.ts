import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Application (landings e-commerce, dashboards, admin, espace client) — SPA react-router.
        main: path.resolve(__dirname, "index.html"),
        // Landing publicitaire Portugal — entrée autonome, hors SPA : elle doit tenir
        // un FCP < 2 s sur mobile et porter ses propres meta (lang fr, Open Graph).
        // Voir src/portugal.tsx.
        portugal: path.resolve(__dirname, "portugal/index.html"),
      },
    },
  },
}));
