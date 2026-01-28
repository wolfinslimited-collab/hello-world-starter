import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (mode === "development") {
    plugins.push(componentTagger());
  }

  return {
    plugins,
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
        services: path.resolve(__dirname, "src/services"),
        types: path.resolve(__dirname, "src/types"),
      },
    },
    build: {
      // Lovable publishing expects the standard Vite output directory.
      // Using a custom outDir can cause production build/publish to fail.
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 8080,
    },
  };
});
