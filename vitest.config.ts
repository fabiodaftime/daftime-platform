import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // + tests purs du moteur (edge functions) : parsers / cœur, sans I/O Deno.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "supabase/functions/_shared/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
