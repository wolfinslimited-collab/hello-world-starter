import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      assets: path.resolve(__dirname, "src/assets"),
      components: path.resolve(__dirname, "src/components"),
      context: path.resolve(__dirname, "src/context"),
      hooks: path.resolve(__dirname, "src/hooks"),
      locales: path.resolve(__dirname, "src/locales"),
      pages: path.resolve(__dirname, "src/pages"),
      utils: path.resolve(__dirname, "src/utils"),
      wallet: path.resolve(__dirname, "src/wallet"),
    },
  },
  build: {
    outDir: "./build",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
  },
}));
