import pluginReact from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/obr-initiative-tracker-4d/",
  plugins: [pluginReact()],
  resolve: {
    alias: {
      assets: resolve(__dirname, "src/assets"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        admin: resolve(__dirname, "src/admin/index.html"),
        tracker: resolve(__dirname, "src/tracker/index.html"),
        background: resolve(__dirname, "src/background/index.html"),
      },
    },
  },
});
